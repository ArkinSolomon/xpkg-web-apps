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
import TokenModel, { TokenScope, TokenType }  from './models/tokenModel.js';
import { DateTime, DurationLike } from 'luxon';
import { createPermissionsNumber } from '../util/permissionNumberUtil.js';
import { logger } from '@xpkg/backend-util';

const alphanumeric = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');

/**
 * Create an access token for a user to interact with the X-Pkg identity service. Invalidates any remaining tokens.
 * 
 * @async
 * @param {string} userId The id of the user this token is for.
 * @returns {Promise<string>} The access token for the user.
 */
export async function createXISToken(userId: string): Promise<string> {
  const permissions = createPermissionsNumber(TokenScope.Identity);
  return createOrUpdateToken(userId, 'xpkg_id_000000000000000000000000000000000000000000000000', '[identity-internal-token]', TokenType.Identity, permissions, { minutes: 30 });
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
 * @param {boolean} [update=true] If this is true, a token is updated by client id. Otherwise a new one is inserted, and the old one is left alone. By default, it updates.
 * @returns {Promise<string>} A promise which resolves to the the access token.
 */
async function createOrUpdateToken(userId: string, clientId: string, tokenName: string, tokenType: TokenType, permissionsNumber: bigint, expiresIn: DurationLike, { tokenDescription, update }: { tokenDescription?: string; update?: boolean; } = { update: true }): Promise<string> {
  if (!update) {
    logger.trace({ userId, clientId }, 'Deleting old token(s) (if it exists)');
    await TokenModel.deleteMany({
      userId,
      clientId,
    })
      .exec();
  }

  const tokenId = alphanumeric(32);
  const tokenSecret = alphanumeric(71);

  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(tokenId);
  const tokenIdHash = hasher.digest('hex');
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
      tokenIdHash,
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