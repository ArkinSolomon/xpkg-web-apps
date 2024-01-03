/*
 * Copyright (c) 2023-2024. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */
import { identifiers } from '@xpkg/validation';
import TokenModel, { TokenScope, TokenType } from './models/tokenModel.js';
import { DateTime, DurationLike } from 'luxon';
import { createPermissionsNumber, hasAnyPermission, hasPermission } from '../util/permissionNumberUtil.js';
import { logger } from '@xpkg/backend-util';
import { XIS_CLIENT_ID } from './clientDatabase.js';

/**
 * Create an access token for a user to interact with the X-Pkg identity service. Invalidates any remaining tokens.
 * 
 * @async
 * @param {string} userId The id of the user this token is for.
 * @returns {Promise<string>} The access token for the user.
 */
export async function createXisToken(userId: string): Promise<string> {
  const permissions = createPermissionsNumber(TokenScope.Identity);

  // Only one identity token at a time is permitted
  await TokenModel.deleteMany({
    userId,
    tokenType: TokenType.Identity
  })
    .exec();

  return createToken(userId, XIS_CLIENT_ID, '[identity-internal-token]', TokenType.Identity, permissions, { minutes: 30 });
}

/**
 * Validate a token, and if it is valid, get the id of the user that owns the token.
 * 
 * @async 
 * @param {string} token The token to validate.
 * @returns {Promise<string | null>} A promise which resolves to the id of the user, or null if the token is not valid.
 */
export async function validateXisToken(token: string): Promise<string | null> {
  const tokenDoc = await validateToken(token);

  if (!tokenDoc)
    return null;

  if (!hasPermission(tokenDoc.permissionsNumber, TokenScope.Identity))
    return null;

  return tokenDoc.userId;
}

/**
 * Create a new validation token and invalidate all others.
 * 
 * @param {string} userId The id of the user who's validation token is being created.
 * @param {string} email The email address of the user's validation token. 
 * @returns {string} The new validation token.
 */
export async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
  const permissionsNumber = createPermissionsNumber(TokenScope.EmailVerification);
  await TokenModel.deleteMany({
    userId,
    tokenType: TokenType.Action,
    permissionsNumber
  })
    .exec();

  return createToken(userId, XIS_CLIENT_ID, '[email-verification-internal-token]', TokenType.Action, permissionsNumber, { days: 1 }, { data: email });
}

/**
 * Delete a token and get it's data
 * 
 * @async
 * @param {string} token The action token to consume.
 * @returns {Promise<{userId: string; data?: string;}|null>} A promise which resolves to the token's data and the user id, or null if the token is invalid.
 */
export async function consumeActionToken(token: string): Promise<{ userId: string; data?: string; } | null> {
  const tokenDoc = await validateToken(token);

  if (!tokenDoc)
    return null;

  if (!hasAnyPermission(tokenDoc.permissionsNumber, TokenScope.PasswordReset, TokenScope.EmailVerification, TokenScope.EmailChangeRevoke)) {
    logger.trace('Invalid action token: not action token');
    return null;
  }

  await tokenDoc.deleteOne();

  return {
    userId: tokenDoc.userId,
    data: tokenDoc.data
  };
}

/**
 * Update the last used date of a token to now.
 * 
 * @async
 * @param {string} tokenId The id of the token to update.
 * @param {string} userId The id of the user that owns the token to update.
 * @returns {Promise} A promise which resolves if the operation completes successfully, otherwise it rejects.
 */
export async function updateTokenUsedDate(tokenId: string, userId: string): Promise<void> {
  await TokenModel.updateOne({
    tokenId,
    userId
  }, {
    $set: {
      used: new Date
    }
  })
    .exec();
}

/**
 * Create a token on the database.
 * 
 * @async
 * @param {string} userId The id of the user this token is for.
 * @param {string} clientId The id of the client that issued this token.
 * @param {string} tokenName The name of the token.
 * @param {TokenType} tokenType The type of the token.
 * @param {bigint} permissionsNumber The permissions number of the token.
 * @param {DurationLike} expiresIn How long until the token expires.
 * @param {Object} opts Aditional options for the token. 
 * @param {string} [opts.description] An optional description, defaults to undefined.
 * @param {string} [opts.data] The optional data to store with the token.
 * @returns {Promise<string>} A promise which resolves to the the new token.
 */
async function createToken(userId: string, clientId: string, tokenName: string, tokenType: TokenType, permissionsNumber: bigint, expiresIn: DurationLike, { tokenDescription, data }: { tokenDescription?: string; data?: string; } = {}) {
  const tokenId = identifiers.alphanumericNanoid(32);
  const tokenSecret = identifiers.alphanumericNanoid(71);

  const tokenSecretHash = await Bun.password.hash(tokenSecret, {
    algorithm: 'bcrypt',
    cost: 12
  });

  const created = DateTime.utc();
  const expiry = created.plus(expiresIn);
  const newToken = new TokenModel({
    userId,
    clientId,
    tokenId,
    tokenSecretHash,
    regenerated: created,
    expiry,
    tokenName,
    tokenDescription,
    tokenType,
    permissionsNumber,
    data,
    created
  });
  await newToken.save();

  return `xpkg_${tokenId}${tokenSecret}${expiry.toUnixInteger().toString(16).padStart(8, '0')}`;
}

/**
 * Validate a token by checking its expiry.
 * 
 * @async
 * @param {string} token The token to validate.
 * @returns The document of the token, or null if the token is invalid.
 */
async function validateToken(token: string) {
  const [tokenId, tokenSecret, expiry] = deconstructToken(token);
  if (expiry < DateTime.now()) {
    logger.trace('Invalid action token: expired token');
    return null;
  }

  const tokenDoc = await TokenModel.findOne({
    tokenId
  })
    .exec();

  if (!tokenDoc) {
    logger.trace('Invalid action token: not found');
    return null;
  }

  if (DateTime.fromJSDate(tokenDoc.expiry) < DateTime.now()) {
    logger.trace('Invalid action token: database expired');
    return null;
  }

  const hashValid = await Bun.password.verify(tokenSecret, tokenDoc.tokenSecretHash, 'bcrypt');
  if (!hashValid)
    return null;

  return tokenDoc;
}

/**
 * Deconstruct a token into its different parts.
 * 
 * @param {string} token The token to deconstruct
 * @returns {[string, string, DateTime]} A tuple of three values of each part of the token, the tokenId, the hash, and the expiry.
 */
function deconstructToken(token: string): [string, string, DateTime] {
  return [
    token.slice(5, 37),
    token.slice(37, 108),
    DateTime.fromSeconds(parseInt(token.slice(108), 16))
  ];
}