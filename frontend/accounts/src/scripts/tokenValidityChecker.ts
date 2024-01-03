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
import axios from 'axios';
import { getCookie } from './cookies';

/**
 * Check to see if the token stored in the cookie is valid.
 * 
 * @async
 * @returns {Promise<number>} A promise which resolves to the status code from the server (which is 204 on success, and typically 401 on failure), or 401 if there is a reason the request shouldn't be made.
 */
export default async function (): Promise<number> {
  const tokenCookie = getCookie('token');
  if (!tokenCookie) 
    return 401;

  const expiry = getExpiry(tokenCookie);
  if (expiry.getTime() <= Date.now()) 
    return 401;

  const data = await axios.post('http://localhost:4819/account/tokenvalidate', {}, {
    headers: {
      Authorization: tokenCookie
    },
    validateStatus: () => true
  });

  return data.status;
}

/**
 * Get the expiry date of the current token.
 * 
 * @returns {Date} The date at which the current token expires, or a Date object that points to the Unix epoch, if the token is undefined.
 */
export function getTokenExpiry() {
  const token = getCookie('token');
  if (!token) 
    return new Date(0);
  
  return getExpiry(token);
}

/**
 * Get the expiry date of a provided token.
 * 
 * @param {string} token The token to get the expiry date of.
 * @returns {Date} The date at which the provided token expires.
 */
export function getExpiry(token: string) {
  return new Date(parseInt(token.slice(108), 16) * 1000);
}