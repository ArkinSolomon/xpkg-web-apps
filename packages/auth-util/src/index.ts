/*
 * Copyright (c) 2024. Arkin Solomon.
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
 * A user's personal information.
 * 
 * @typedef {Object} UserPersonalInformation
 * @property {string} userId The id of the user.
 * @property {string} userEmail The email address of the user.
 * @property {boolean} emailVerified True if the user is verified.
 * @property {string} name The user's display name.
 */
export type UserPersonalInformation = {
  userId: string;
  userEmail: string;
  emailVerified: boolean;
  name: string;
};

import { DateTime } from 'luxon';
import { validators } from '@xpkg/validation';
import { body } from 'express-validator';
import axios from 'axios';
import { TokenScope, toScopeStr } from './permissionsNumber.js';

export const XIS_CLIENT_ID = 'xpkg_is_011101110110100001101111011000010110110101101001';
export const DEVELOPER_PORTAL_CLIENT_ID = 'xpkg_dp_011100000111001001100111011100100110110101110010';
export const FORUM_CLIENT_ID = 'xpkg_fm_011101000110000101101100011010110011101000101001';
export const STORE_CLIENT_ID = 'xpkg_st_011011010110111101101110011010010110010101110011';
export const XPKG_CLIENT_CLIENT_ID = 'xpkg_cl_011100000110000101101011011010010110011101100101';

export const ACCOUNTS_URL = 'https://accounts.xpkg.net';
export const XIS_URL = 'https://identity.xpkg.net';

export * as identifiers from './identifiers.js';
export * from './permissionsNumber.js';

/**
 * Check to see a provided token is valid for all of the provided scopes.
 * 
 * @async
 * @param {string} token The token to check.
 * @param {TokenScope} scope The required scope.
 * @param {...TokenScope} [scopes] Additional scopes to check for.
 * @returns A promise which resolves to the userId of the owner of the token if the token is valid for all of the provided scopes.
 */
export async function isTokenValid(token: string | null, scope: TokenScope, ...scopes: TokenScope[]): Promise<string|null> {
  const isTokenValid = await validators.isValidTokenFormat(body('token')).run({ body: { token } });
  if (!isTokenValid)
    return null;

  const isTokenExpired = isExpired(token!);
  if (isTokenExpired) 
    return null;

  const data = await axios.post(XIS_URL + '/oauth/tokenvalidate', {
    scopes: [scope, ...scopes].map(s => toScopeStr(s)).join(' ')
  }, {
    headers: {
      Authorization: token
    },
    validateStatus: () => true
  });

  if (data.status === 200)
    return data.data.userId;
  return null;
}

/**
 * Check to see a provided token is valid for any of the provided scopes.
 * 
 * @async
 * @param {string} token The token to check.
 * @param {TokenScope} scope The required scope.
 * @param {...TokenScope} scopes Additional scopes to check for.
 * @returns {Promise<string|null>} A promise which resolves to the userId of the owner of the token if the token is valid for any of the provided scopes.
 */
export async function isTokenValidAny(token: string | null, scope: TokenScope, ...scopes: TokenScope[]): Promise<string|null> {
  const isTokenValid = await validators.isValidTokenFormat(body('token')).run({ body: { token } });
  if (!isTokenValid)
    return null;

  const isTokenExpired = isExpired(token!);
  if (isTokenExpired) 
    return null;

  const data = await axios.post(XIS_URL + '/oauth/tokenvalidateany', {
    scopes: [scope, ...scopes].map(s => toScopeStr(s)).join(' ')
  }, {
    headers: {
      Authorization: token
    },
    validateStatus: () => true
  });

  if (data.status === 200)
    return data.data.userId;
  return null;
}

/**
 * The user's personal information.
 * 
 * @async
 * @param {string} token The token to use to get the user's personal information.
 * @returns {Promise<UserPersonalInformation|null>} A promise which resolves to the user's personal information, or null if the user is not permitted to access the user's personal information.
 */
export async function getUserPersonalData(token: string | null): Promise<UserPersonalInformation|null> {
  const isTokenValid = await validators.isValidTokenFormat(body('token')).run({ body: { token } });
  if (!isTokenValid)
    return null;

  const isTokenExpired = isExpired(token!);
  if (isTokenExpired) 
    return null;

  const data = await axios.get(XIS_URL + '/users/personalinformation', {
    headers: {
      Authorization: token
    },
    validateStatus: () => true
  });

  if (data.status === 200)
    return data.data as UserPersonalInformation;
  return null;
}

/**
 * Deconstruct a token into its different parts. Does not check if the token is validly formatted.
 * 
 * @param {string} token The token to deconstruct
 * @returns {[string, string, DateTime]} A tuple of three values of each part of the token, the tokenId, the hash, and the expiry.
 */
export function deconstructToken(token: string): [string, string, DateTime] {
  return [
    token.slice(5, 37),
    token.slice(37, 108),
    DateTime.fromSeconds(parseInt(token.slice(108), 16))
  ];
}

/**
 * Determine if a token is expired (according to its claim). Does not check if the token is validly formatted.
 * 
 * @param {string} token The token to check.
 * @returns {boolean} True if the token claims to not be expired. 
 */
function isExpired(token: string): boolean {
  return parseInt(token.slice(108), 16) < Math.floor(Date.now() / 1000);
}