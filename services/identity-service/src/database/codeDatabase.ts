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
import CodeModel from './models/codeModel.js';
import { identifiers } from '@xpkg/validation';
import { hash } from 'hasha';
import { DateTime } from 'luxon';

/**
 * Create and register an access code.
 * 
 * @async
 * @param {string} clientId The id of the client that requested this code.
 * @param {string} userId The id of the user that this code grants a token for.
 * @param {bigint} permissionsNumber The permissions number of the token which this code grants.
 * @param {Date} tokenExpiry When the token that this code grants expires.
 * @param {string} codeChallenge The code challenge recieved from the client.
 * @returns {Promise<string>} A promise which resolves to the access code that was generated.
 */
export async function generateCode(clientId: string, userId: string, permissionsNumber: bigint, tokenExpiry: Date, codeChallenge: string): Promise<string> {
  const code = identifiers.alphanumericNanoid(32);
  const codeHash = hash(code, { algorithm: 'sha256' });

  const codeDocument = new CodeModel({
    clientId,
    codeHash,
    codeExpiry: DateTime.now().plus({ seconds: 30 }).toJSDate(),
    codeChallenge,
    userId,
    permissionsNumber,
    tokenExpiry
  });
  await codeDocument.save();

  return code;
}