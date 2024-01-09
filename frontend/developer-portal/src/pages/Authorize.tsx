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
import { ACCOUNTS_URL, DEVELOPER_PORTAL_CLIENT_ID, identifiers, isTokenValid } from '@xpkg/auth-util';
import { cookies } from '@xpkg/frontend-util';
import { useEffect } from 'react';

export default function Authorize() {
  useEffect(() => {
    const token = cookies.getCookie('token');
    const currentParams = new URLSearchParams(window.location.href);
    const next = currentParams.get('next') ?? '/packages';
  
    (async () => {
      const isCookieValid = await isTokenValid(token);

      if (isCookieValid) {
        window.location.href = '/packages';
        return;
      }

      cookies.deleteCookie('token');

      let state = btoa(next);
      const equalCount = state.length - state.indexOf('=');
      state += equalCount;

      const challenge = identifiers.alphanumericNanoid(32);
      cookies.setCookie('challenge', challenge, 1);

      const authParams = new URLSearchParams();
      authParams.set('client_id', DEVELOPER_PORTAL_CLIENT_ID);
      authParams.set('state', state);
      authParams.set('redirect_uri', 'http://127.0.0.1:3001/redirect');
      authParams.set('response_type', 'code');
      authParams.set('code_challenge', challenge);
      authParams.set('code_challenge_method', 'S256');
      authParams.set('scope', 'DeveloperPortal');
      
      window.location.href = ACCOUNTS_URL + '/authorize?' + authParams.toString();
    })();
  }, []); 

  return <></>;
}