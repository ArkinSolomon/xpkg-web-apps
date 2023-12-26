/*
 * Copyright (c) 2023. Arkin Solomon.
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
import { customAlphabet } from 'nanoid';
import TokenModel, { TokenData, TokenScope, TokenType } from './models/tokenModel.js';
import { DateTime, DurationLike } from 'luxon';
import { createPermissionsNumber, hasPermission } from '../util/permissionNumberUtil.js';
import { logger } from '@xpkg/backend-util';
import { XIS_CLIENT_ID } from './clientDatabase.js';

const alphanumeric = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');

/**
 * Create an access token for a user to interact with the X-Pkg identity service. Invalidates any remaining tokens.
 * 
 * @async
 * @param {string} userId The id of the user this token is for.
 * @returns {Promise<string>} The access token for the user.
 */
export async function createXisToken(userId: string): Promise<string> {
  const permissions = createPermissionsNumber(TokenScope.Identity);
  return createOrUpdateToken(userId, XIS_CLIENT_ID, '[identity-internal-token]', TokenType.Identity, permissions, { minutes: 30 });
}

/**
 * Create a new token. Optionally update any old token of the same type.
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
 * @param {number} [max=1] The maximum amount of tokens that a singular client id can have. If max is exceeded, the oldest tokens are deleted first, and then the most recent token is updated.
 * @returns {Promise<string>} A promise which resolves to the the access token.
 */
async function createOrUpdateToken(userId: string, clientId: string, tokenName: string, tokenType: TokenType, permissionsNumber: bigint, expiresIn: DurationLike, { tokenDescription, max }: { tokenDescription?: string; max: number; } = { max: 1 }): Promise<string> {
  if (max <= 0) {
    throw new Error('Max must be a non-zero positive integer (>0)');
  }

  const existingTokens = await TokenModel.find({ userId, clientId })
    .sort({ updated: 1 })
    .select({
      _id: 0,
      tokenId: 1,
    })
    .exec();

  const initialCount = existingTokens.length;
  const toDelete: string[] = [];
  while (existingTokens.length > max) {
    toDelete.push(existingTokens.shift()!.tokenId);
  }

  if (toDelete.length > 0) {
    logger.info({
      userId,
      deleteCount: toDelete,
      initialCount,
      max
    }, 'Token maximum exceeded, deleting extra tokens');
    TokenModel.deleteMany({
      tokenId: {
        $in: toDelete
      }
    }).then(() => logger.trace('Extra tokens deleted')).catch(logger.error);
  }

  // Create a new token, unless one already exists
  const tokenId = existingTokens.shift()?.tokenId ?? alphanumeric(32);
  const tokenSecret = alphanumeric(71);

  const tokenSecretHash = await Bun.password.hash(tokenSecret, {
    algorithm: 'bcrypt',
    cost: 12
  });

  const created = DateTime.utc();
  const expiry = created.plus(expiresIn);
  await TokenModel.updateOne({
    userId,
    clientId,
  }, {
    $set: {
      userId,
      clientId,
      tokenId,
      tokenSecretHash,
      regenerated: created,
      expiry,
      tokenName,
      tokenDescription,
      tokenType,
      permissionsNumber
    },
    $setOnInsert: {
      created
    }
  }, { upsert: true });

  return `xpkg_${tokenId}${tokenSecret}${expiry.toUnixInteger().toString(16).padStart(8, '0')}`;
}

/**
 * Validate a token, and if it is valid, get the id of the user that owns the token.
 * 
 * @async 
 * @param {string} token The token to validate.
 * @returns {Promise<string | null>} A promise which resolves to the id of the user, or null if the token is not valid.
 */
export async function validateXisToken(token: string): Promise<string | null> {
  const [tokenId, tokenSecret, expiry] = deconstructToken(token);
  if (expiry < DateTime.now()) {
    return null;
  }

  const tokenData = await TokenModel.findOne({
    tokenId,
    clientId: XIS_CLIENT_ID
  })
    .select({
      _id: 0,
      tokenId: 1,
      tokenSecretHash: 1,
      expiry: 1,
      userId: 1,
      permissionsNumber: 1
    })
    .exec();

  if (!tokenData) {
    return null;
  }

  // Recheck expiry in case the token has been tampered with
  if (DateTime.fromJSDate(tokenData.expiry) < DateTime.now()) {
    return null;
  }

  if (!hasPermission(tokenData.permissionsNumber, TokenScope.Identity)) {
    return null;
  }

  const hashValid = await Bun.password.verify(tokenSecret, tokenData.tokenSecretHash, 'bcrypt');
  if (hashValid) {

    updateTokenUsedDate(tokenId, tokenData.userId)
      .then(() => logger.trace({ tokenId, userId: tokenData.userId }, 'Updated last used date of token'))
      .catch(e => logger.error({ tokenId, userId: tokenData.userId }, e));

    return tokenData.userId;
  }

  return null;
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