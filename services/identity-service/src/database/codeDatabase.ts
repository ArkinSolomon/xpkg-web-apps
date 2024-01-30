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
import CodeModel, { CodeData } from './models/codeModel.js';
import { identifiers } from '@xpkg/auth-util';
import { hash } from 'hasha';
import { DateTime } from 'luxon';
import genericSessionFunction from './genericSessionFunction.js';
import { ClientSession } from 'mongoose';

/**
 * Create and register an access code.
 * 
 * @async
 * @param {string} clientId The id of the client that requested this code.
 * @param {string} userId The id of the user that this code grants a token for.
 * @param {bigint} permissionsNumber The permissions number of the token which this code grants.
 * @param {Date} tokenExpiry When the token that this code grants expires.
 * @param {string} codeChallenge The code challenge recieved from the client.
 * @param {string} redirectUri The redirect URI recieved, which must match when verifying the code.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<string>} A promise which resolves to the access code that was generated.
 */
export async function generateCode(clientId: string, userId: string, permissionsNumber: bigint, tokenExpiry: Date, codeChallenge: string, redirectUri: string, session?: ClientSession): Promise<string> {
  const code = identifiers.alphanumericNanoid(32);
  const codeHash = await hash(code, { algorithm: 'sha256' });

  return genericSessionFunction(async session => {
    const codeDocument = new CodeModel({
      clientId,
      codeHash,
      codeExpiry: DateTime.now().plus({ seconds: 30 }).toJSDate(),
      codeChallenge,
      userId,
      permissionsNumber,
      tokenExpiry,
      redirectUri
    });
    await codeDocument.save({ session });
  
    return code;
  }, session);
}

/**
 * Check an access code from the client.
 * 
 * @async
 * @param {string} clientId The id of the client that requested this code.
 * @param {string} code The code given from the client.
 * @param {string} codeVerifier The code verifier recieved from the client, which will be hashed then compared with the value stored in the database.
 * @param {string} redirectUri The provided redirect URI.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<Pick<CodeData, 'clientId' | 'userId' | 'permissionsNumber' | 'tokenExpiry'> | null} The data stored with the code if all submissions match, or null otherwise.
 */
export async function verifyCode(clientId: string, code: string, codeVerifier: string, redirectUri: string, session?: ClientSession): Promise<Pick<CodeData, 'clientId' | 'userId' | 'permissionsNumber' | 'tokenExpiry'> | null> {
  const codeHash = await hash(code, { algorithm: 'sha256' });
  const verifierHash = await hash(codeVerifier, { algorithm: 'sha256' });

  return genericSessionFunction(async session => {
    const codeDocument = await CodeModel.findOne({
      clientId,
      codeHash
    });

    if (!codeDocument)
      return null;
    
    await codeDocument.deleteOne({ session });

    if (verifierHash !== codeDocument.codeChallenge || redirectUri !== codeDocument.redirectUri) 
      return null;

    return {
      clientId: codeDocument.clientId,
      userId: codeDocument.userId,
      permissionsNumber: codeDocument.permissionsNumber,
      tokenExpiry: codeDocument.tokenExpiry
    };
  }, session);
}
