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

/**
 * The data for a single OAuth code grant.
 * 
 * @typedef {Object} CodeData
 * @property {string} clientId The id of the client that this code is for.
 * @property {string} codeHash The SHA256 hash of the authorization code.
 * @property {Date} codeExpiry The point at which this authorization code expires.
 * @property {string} codeChallenge The code challenge used for PKCE verification.
 * @property {string} userId The id of the user that this token is for.
 * @property {bigint} permissionsNumber The permissions number of the token.
 * @property {Date} tokenExpiry When the generated token expires.
 */
export type CodeData = {
  clientId: string;
  codeHash: string;
  codeExpiry: Date;
  codeChallenge: string;
  userId: string;
  permissionsNumber: bigint;
  tokenExpiry: Date;
};

import mongoose, { Schema } from 'mongoose';

const codeSchema = new Schema<CodeData>({
  clientId: {
    type: String,
    required: true,
    index: true
  },
  codeHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  codeExpiry: {
    type: Date,
    required: true
  },
  codeChallenge: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  permissionsNumber: {
    type: BigInt,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  }
}, {
  collection: 'codes'
});

const tokensDB = mongoose.connection.useDb('oauth');
const CodeModel = tokensDB.model<CodeData>('code', codeSchema);

tokensDB.collection('codes').createIndex({
  codeExpiry: 1
}, {
  expireAfterSeconds: 0
});

export default CodeModel;