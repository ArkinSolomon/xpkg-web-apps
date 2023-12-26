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

/**
 * Different types of tokens that can be issued.
 * 
 * @name TokenType
 * @enum {string}
 */
export enum TokenType {
  Identity = 'identity', // Max of one
  Registry = 'registry', // Max of one
  Action = 'action',
  Forum = 'forum',
  Store = 'store',
  Client = 'client',
  OAuth = 'oauth', // Tokens that are issued via OIDC
  Issued = 'issued' // Tokens created by a user
}

/**
 * The different scopes that a token can have.
 * 
 * @name TokenScope
 * @enum {bigint}
 */
export const TokenScope = {
  
  // Proprietary service tokens
  Identity: 1n << 0n,
  Registry: 1n << 1n,
  Forum: 1n << 2n,
  Store: 1n << 3n,
  Client: 1n << 4n,
  
  // Action
  PasswordReset: 1n << 8n,
  EmailVerification: 1n << 9n,
  EmailChangeRevoke: 1n << 10n,

  // Registry scopes
  RegistryCreatePackage: 1n << 16n,
  RegistryUploadVersion: 1n << 17n,
  RegistryModifyPackageInfo: 1n << 18n,
  RegistryReadAuthorData: 1n << 19n,
  RegistryViewPackages: 1n << 20n,
  RegistryViewResources: 1n << 21n,
  RegistryModifyVersionData: 1n << 22n,
  RegistryViewAnalytics: 1n << 23n,
  RegistryViewBugReports: 1n << 24n,
  RegistryRespondBugReports: 1n << 25n,
  RegistryManageBugReports: 1n << 26n,

  // Identity service scopes
  IdentityViewAuthorEmail: 1n << 32n
};
Object.freeze(TokenScope);

// We use this to get around the fact that TypeScript enumerations do not support BigInts
export type TokenScope = typeof TokenScope[keyof typeof TokenScope];

/**
 * The schema of a single token that has access to a user's account.
 * 
 * @typedef {string} TokenData
 * @property {string} userId The id of the user who this token is for.
 * @property {string} tokenId The id of the token.
 * @property {string} clientId The id of the client that required this token to be issued.
 * @property {string} tokenName The name of the token. Either one provided by the user, or the same as the client application name.
 * @property {string} [tokenDescription] The description of the token. Either one optionally provided by the user for issued tokens, or the same as the client description.
 * @property {string} tokenHash The hash of the token, that must match to verify.
 * @property {TokenType} tokenType The type of the token.
 * @property {bigint} permissionsNumber The permissions number of the token.
 * @property {Date} expiry When the token expires.
 * @property {Date} created When the token was created.
 * @property {Date} regenerated When the token was last regenerated.
 * @property {string} [data] Optional token data.
 * @property {Date} used When the token was last used.
 */
export type TokenData = {
  userId: string;
  tokenId: string;
  clientId: string;
  tokenName: string;
  tokenDescription?: string;
  tokenSecretHash: string;
  tokenType: TokenType;
  permissionsNumber: bigint;
  expiry: Date;
  created: Date;
  regenerated: Date;
  data?: string;
  used: Date;
};


import mongoose, { Schema } from 'mongoose';

const tokenSchema = new Schema<TokenData>({
  userId: {
    type: String,
    required: true,
    index: true
  }, 
  tokenId: {
    type: String, 
    required: true,
    index: true,
    unique: true
  },
  clientId: {
    type: String,
    required: true,
    index: true
  },
  tokenName: {
    type: String,
    required: true
  },
  tokenDescription: {
    type: String,
    required: false
  },
  tokenSecretHash: {
    type: String,
    required: true
  },
  tokenType: {
    type: String,
    required: true,
    index: true,
    enum: TokenType
  },
  permissionsNumber: {
    type: BigInt,
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  created: {
    type: Date,
    required: true,
    default: Date.now
  },
  regenerated: {
    type: Date,
    required: true,
    default: Date.now
  },
  data: {
    type: String,
    required: false
  },
  used: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  collection: 'tokens'
});

const tokensDB = mongoose.connection.useDb('tokens');
const TokenModel = tokensDB.model<TokenData>('token', tokenSchema);

export default TokenModel;