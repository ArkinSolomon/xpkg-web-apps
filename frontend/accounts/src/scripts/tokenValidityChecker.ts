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
import axios from 'axios';
import { getCookie } from './cookies';

/**
 * Check to see if the token stored in the cookie is valid.
 * 
 * @async
 * @returns The status code from the server (which is 204 on success, and typically 401 on failure), or 401 if there is a reason the request shouldn't be made.
 */
export default async function (): Promise<number> {
  const tokenCookie = getCookie('token');
  if (!tokenCookie) {
    return 401;
  }

  const expiry = new Date(parseInt(tokenCookie.slice(108), 16) * 1000);
  if (expiry.getTime() <= Date.now()) {
    return 401;
  }

  const data = await axios.post('http://localhost:4819/account/tokenvalidate', {}, {
    headers: {
      Authorization: tokenCookie
    },
    validateStatus: () => true
  });

  return data.status;

}