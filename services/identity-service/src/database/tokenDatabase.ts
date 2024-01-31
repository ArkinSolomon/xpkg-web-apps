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
import { TokenScope, createPermissionsNumber, hasAnyPermission, hasPermission, deconstructToken, XIS_CLIENT_ID, identifiers } from '@xpkg/auth-util';
import TokenModel, { TokenType } from './models/tokenModel.js';
import { DateTime, DurationLike } from 'luxon';
import { ClientSession } from 'mongoose';
import genericSessionFunction from './genericSessionFunction.js';
import NoSuchTokenError from '../errors/noSuchTokenError.js';

/**
 * Create an access token for a user to interact with the X-Pkg identity service. Invalidates any remaining tokens.
 * 
 * @async
 * @param {string} userId The id of the user this token is for.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<string>} The access token for the user.
 */
export async function createXisToken(userId: string, session?: ClientSession): Promise<string> {
  const permissions = createPermissionsNumber(TokenScope.Identity);

  return genericSessionFunction(async session => {
    // Only one identity service token should be active at all times
    await deleteXisTokens(userId, session);
    return createToken(userId, XIS_CLIENT_ID, '[identity-internal-token]', TokenType.Identity, permissions, { minutes: 30 });
  }, session);

}

/**
 * Validate a token, and if it is valid, get the id of the user that owns the token.
 * 
 * @async 
 * @param {string} token The token to validate.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<string | null>} A promise which resolves to the id of the user, or null if the token is not valid.
 */
export async function validateXisToken(token: string, session?: ClientSession): Promise<string | null> {
  return genericSessionFunction(async session => {
    const tokenDoc = await validateToken(token, {
      session,
      deleteExpired: true
    });

    if (!tokenDoc)
      return null;
  
    if (!hasPermission(tokenDoc.permissionsNumber, TokenScope.Identity))
      return null;
  
    return tokenDoc.userId;
  }, session);
}

/**
 * Delete any XIS tokens, though there should only be up to one.
 * 
 * @async 
 * @param {string} userId The user who's token to delete.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<void>} A promise which resolves when the operation is complete.
 */
export async function deleteXisTokens(userId:string, session?: ClientSession): Promise<void> {
  await genericSessionFunction(async session => {
    await TokenModel.deleteMany({
      userId,
      tokenType: TokenType.Identity
    })
      .session(session)
      .exec();
  }, session);
}

/**
 * Create a new validation token and invalidate all others.
 * 
 * @param {string} userId The id of the user to associate with the token.
 * @param {string} email The email address of the user's validation token. 
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<string>} The new validation token.
 */
export async function createEmailVerificationToken(userId: string, email: string, session?: ClientSession): Promise<string> {
  const permissionsNumber = createPermissionsNumber(TokenScope.EmailVerification);
  return genericSessionFunction(async session => {
    await TokenModel.deleteMany({
      userId,
      tokenType: TokenType.Action,
      permissionsNumber
    })
      .session(session)
      .exec();
    return createToken(userId, XIS_CLIENT_ID, '[email-verification-internal-token]', TokenType.Action, permissionsNumber, { days: 1 }, { data: email, session });
  }, session);
}

/**
 * Create a new request to change an email, and delete all other tokens.
 * 
 * @param {string} userId The id of the user to associate with the token.
 * @param {string} changeRequestId The id of the change request.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<string>} The change request token.
 */
export async function createChangeRequestToken(userId: string, changeRequestId: string, session?: ClientSession): Promise<string> {
  const permissionsNumber = createPermissionsNumber(TokenScope.EmailChange);
  return genericSessionFunction(async session => {
    await TokenModel.deleteMany({
      userId,
      tokenType: TokenType.Action,
      permissionsNumber
    })
      .session(session)
      .exec();

    return createToken(userId, XIS_CLIENT_ID, '[email-change-request-internal-token]', TokenType.Action, permissionsNumber, { hours: 1 }, { data: changeRequestId, session });
  }, session);
}

/**
 * Get a token and its data (if provided), and determine if it is valid.
 * 
 * @async
 * @param {string} token The token to get.
 * @param {TokenScope|TokenScope[]} scope The scope the token is expected to have. If an array is provided, any in the list will match.
 * @param {Object} [opts] Additional options.
 * @param {ClientSession} [opts.session] An optional session to use for an atomic transaction.
 * @param {boolean} [opts.update] True if the last used date of the token should be updated. Defaults to the opposite of consume. Does nothing if consume is set to true.
 * @param {boolean} [opts.deleteExpired] True if the token should be deleted if it is passed it's expiry.
 * @param {boolean} [opts.consume=false] True if the token should be deleted after being used once.
 * @returns {Promise<{userId: string; tokenId: string; data?: string;}|null>} A promise which resolves to the token's data and the user id, or null if the token is invalid.
 */
export async function getTokenData(token: string, scope: TokenScope | TokenScope[], { session, update, deleteExpired, consume }: {
  session?: ClientSession;
  update?: boolean;
  deleteExpired?: boolean;
  consume?: boolean;
} = {
  deleteExpired: false,
  consume: false
}): Promise<{
    userId: string;
    tokenId: string;
    data?: string;
  } | null> {
  if (typeof scope === typeof TokenScope.Identity)
    scope = [scope as typeof TokenScope.Identity];
  consume ??= false;
  deleteExpired ??= false;
  update ??= !consume;

  return genericSessionFunction(async session => {
    const tokenDoc = await validateToken(token, {
      deleteExpired,
      session
    });

    if (!tokenDoc)
      return null;
    
    if (!hasAnyPermission(tokenDoc.permissionsNumber, ...(scope as TokenScope[])))
      return null;

    if (consume)
      await tokenDoc.deleteOne({ session });
    else if (update) {
      tokenDoc.used = new Date();
      await tokenDoc.save({ session });
    }

    return {
      userId: tokenDoc.userId,
      tokenId: tokenDoc.tokenId,
      data: tokenDoc.data
    };
  }, session);
}

/**
 * Delete a user's token by their id and the token id. Completes successfully even if no such token matches the given criteria.
 * 
 * @async
 * @param {string} userId The id of the user who's token to delete.
 * @param {string} tokenId The id of the token to delete.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<void>} A promise that resovles when the operation is complete. 
 */
export async function deleteToken(userId: string, tokenId: string, session?: ClientSession): Promise<void> {
  await genericSessionFunction(async session => {
    await TokenModel.deleteOne({
      userId,
      tokenId
    })
      .session(session)
      .exec();
  }, session);
}

/**
 * Regenerate a token with the exact same permissions, but a different expiry date.
 * 
 * @async 
 * @param {string} userId The id of the user who's token to update.
 * @param {string} tokenId The id of the token to update.
 * @param {Date} expiry The new expiry date of the token.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<string>} A promise which resolves to the regenerated token.
 * @throws {NoSuchTokenError} Error thrown if a token with the given id is not found.
 */
export async function regenerateToken(userId: string, tokenId: string, expiry: Date, session?: ClientSession): Promise<string> {
  const tokenSecret = identifiers.alphanumericNanoid(71);
  const tokenSecretHash = await Bun.password.hash(tokenSecret, {
    algorithm: 'bcrypt',
    cost: 12
  });

  return genericSessionFunction(async session => {
    const updated = await TokenModel.updateOne({
      userId, 
      tokenId
    }, {
      expiry,
      tokenSecretHash,
      regenerated: new Date()
    })
      .session(session)
      .exec();

    if (updated.matchedCount !== 1) 
      throw new NoSuchTokenError(tokenId);

    return `xpkg_${tokenId}${tokenSecret}${DateTime.fromJSDate(expiry).toUnixInteger().toString(16).padStart(8, '0')}`;
  }, session);
}

/**
 * Regenerate a token with new permissions.
 * 
 * @async 
 * @param {string} userId The id of the user who's token to update.
 * @param {string} tokenId The id of the token to update.
 * @param {bigint} permissionsNumber The new permissions number of the token.
 * @param {Date} expiry The new expiry date of the token.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<string>} A promise which resolves to the regenerated token.
 * @throws {NoSuchTokenError} Error thrown if a token with the given id is not found.
 */
export async function regenerateTokenAndPermissions(userId: string, tokenId: string, permissionsNumber: bigint, expiry: Date, session?: ClientSession): Promise<string> {
  const tokenSecret = identifiers.alphanumericNanoid(71);
  const tokenSecretHash = await Bun.password.hash(tokenSecret, {
    algorithm: 'bcrypt',
    cost: 12
  });

  return genericSessionFunction(async session => {
    const updated = await TokenModel.updateOne({
      userId, 
      tokenId
    }, {
      expiry,
      permissionsNumber,
      tokenSecretHash,
      regenerated: new Date()
    })
      .session(session)
      .exec();
    
    if (updated.matchedCount !== 1) 
      throw new NoSuchTokenError(tokenId);

    return `xpkg_${tokenId}${tokenSecret}${DateTime.fromJSDate(expiry).toUnixInteger().toString(16).padStart(8, '0')}`;
  }, session);
}

/**
 * Update the last used date of a token to now.
 * 
 * @async
 * @param {string} userId The id of the user that owns the token to update.
 * @param {string} tokenId The id of the token to update.
 * @param {ClientSession} [session] An optional session to use for an atomic transaction.
 * @returns {Promise<void>} A promise which resolves if the operation completes successfully, otherwise it rejects.
 * @throws {NoSuchTokenError} Error thrown if a token with the given id is not found.
 */
export async function updateTokenUsedDate(userId: string, tokenId: string, session?: ClientSession): Promise<void> {
  return genericSessionFunction(async session => {
    const updateData = await TokenModel.updateOne({
      userId,
      tokenId
    }, {
      $set: {
        used: new Date()
      }
    })
      .session(session)
      .exec();
    
    if (updateData.matchedCount !== 1) 
      throw new NoSuchTokenError(tokenId);
  }, session);
}

/**
 * Check if the user has a token with the given client id. Does not check if the token is already expired..
 * 
 * @param {string} userId The id of the user that owns the token to update.
 * @param {string} clientId The client id to check for.
 * @returns {Promise<{ permissionsNumber: bigint; expiry: Date; } | null>} The token id, permissions number, and current expiry of the token, or null if the user has no token with the given id.
 */
export async function userHasToken(userId: string, clientId: string): Promise<{ tokenId: string; permissionsNumber: bigint; expiry: Date; } | null> {
  const token = await TokenModel.findOne({
    userId,
    clientId
  })
    .select({
      _id: 0,
      tokenId: 1,
      permissionsNumber: 1,
      expiry: 1
    });

  if (!token)
    return null;
  else
    return {
      tokenId: token.tokenId,
      permissionsNumber: token.permissionsNumber,
      expiry: token.expiry
    };
}

/**
 * Validate a token by checking its expiry and hash.
 * 
 * @async
 * @param {string} token The token to validate.
 * @param {Object} [opts] Additional verification options.
 * @param {boolean} [opts.deleteExpired=false] True if the token should be deleted if it is expired.
 * @param {ClientSession} [opts.session] An optional session to use for an atomic transaction.
 * @returns The document of the token, or null if the token is invalid.
 */
export async function validateToken(token: string, { deleteExpired, session }: {
  deleteExpired?: boolean;
  session?: ClientSession;
} = { deleteExpired: false }) {
  const [tokenId, tokenSecret, expiry] = deconstructToken(token);
  deleteExpired ??= false;

  // We can early return if the token claims to be expired and we don't have to delete it
  const expiredClaim = expiry < DateTime.now();
  if (expiredClaim && !deleteExpired) 
    return null;

  return genericSessionFunction(async session => {
    const tokenDoc = await TokenModel.findOne({
      tokenId
    })
      .exec();
  
    if (!tokenDoc)
      return null;
  
    if (tokenDoc.expiry.getTime() < Date.now()) {
      if (deleteExpired) 
        await tokenDoc.deleteOne({ session });
      
      return null;
    } else if (expiredClaim) 
      // The token has been tampered with so the token is not valid (we don't check if it doesn't make the expired claim though)
      return null;
  
    const hashValid = await Bun.password.verify(tokenSecret, tokenDoc.tokenSecretHash, 'bcrypt');
    if (!hashValid)
      return null;
  
    return tokenDoc;
  }, session);
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
export async function createToken(userId: string, clientId: string, tokenName: string, tokenType: TokenType, permissionsNumber: bigint, expiresIn: DurationLike, { tokenDescription, data, session }: { tokenDescription?: string; data?: string; session?: ClientSession; } = {}): Promise<string> {
  const tokenId = identifiers.alphanumericNanoid(32);
  const tokenSecret = identifiers.alphanumericNanoid(71);

  const tokenSecretHash = await Bun.password.hash(tokenSecret, {
    algorithm: 'bcrypt',
    cost: 12
  });

  return genericSessionFunction(async session => {
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
    await newToken.save({ session });

    return `xpkg_${tokenId}${tokenSecret}${expiry.toUnixInteger().toString(16).padStart(8, '0')}`;
  }, session);
}