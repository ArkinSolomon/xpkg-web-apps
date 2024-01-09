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
import { DateTime } from 'luxon';
import { validators } from '@xpkg/validation';
import { body } from 'express-validator';
import axios from 'axios';
import { TokenScope } from './permissionsNumber.js';

export const XIS_CLIENT_ID = 'xpkg_is_011101110110100001101111011000010110110101101001';
export const DEVELOPER_PORTAL_CLIENT_ID = 'xpkg_dp_011100000111001001100111011100100110110101110010';
export const FORUM_CLIENT_ID = 'xpkg_fm_011101000110000101101100011010110011101000101001';
export const STORE_CLIENT_ID = 'xpkg_st_011011010110111101101110011010010110010101110011';
export const XPKG_CLIENT_CLIENT_ID = 'xpkg_cl_011100000110000101101011011010010110011101100101';

export const ACCOUNTS_URL =  process.env.ACCOUNTS_URL ?? 'http://127.0.0.1:3000';
export const XIS_URL = process.env.XIS_URL ?? 'http://127.0.0.1:4819';

export * as identifiers from './identifiers.js';
export * from './permissionsNumber.js';

/**
 * Check to see a provided token is valid for all of the provided scopes.
 * 
 * @async
 * @param {string} token The token to check.
 * @param {...TokenScope} scopes The scopes to check for.
 * @returns {Promise<number>} A promise which resolves to the status code from the server (which is 204 on success, and typically 401 on failure), or 401 if there is a reason the request shouldn't be made. 400 May also be returned if the token itself is invalid.
 */
export async function getTokenValidityStatus(token: string,  ...scopes: TokenScope[]): Promise<number> {
  const isTokenValid = await validators.isValidTokenFormat(body('token')).run({ token });
  if (!isTokenValid)
    return 401;

  const isTokenExpired = isExpired(token);
  if (isTokenExpired) 
    return 401;

  const data = await axios.post(XIS_URL + '/oauth/tokenvalidate', {}, {
    headers: {
      Authorization: token
    },
    validateStatus: () => true
  });

  return data.status;
}

/**
 * Check to see if the given token is valid for all of the provided scopes.
 * 
 * @async
 * @param {string} [token] The token to check. Returns false if it is not provided.
 * @param {...TokenScope} scopes The scopes to check for.
 * @returns {Promise<boolean>} A promise which resolves to true if the token is valid, or false otherwise.
 */
export async function isTokenValid(token: string | null, ...scopes: TokenScope[]): Promise<boolean> {
  if (!token) 
    return false;

  return (await getTokenValidityStatus(token, ...scopes)) === 204;
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