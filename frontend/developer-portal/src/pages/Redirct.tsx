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
import { ACCOUNTS_URL, DEVELOPER_PORTAL_CLIENT_ID, XIS_URL, identifiers, isTokenValid } from '@xpkg/auth-util';
import { cookies } from '@xpkg/frontend-util';
import qs from 'qs';
import { useEffect } from 'react';
import axios from 'axios';

export default function Redirect() {
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.href);
    let state = currentParams.get('state');

    let redirect = '/packages';
    if (state) {
      const equalCount = parseInt(redirect.charAt(redirect.length - 1), 10);
      state = state.slice(0, state.length - 2);
      for (let i = 0; i < equalCount; ++i)
        state += '=';
      
      redirect = atob(state);
    }

    if (!currentParams.has('code')) 
      window.location.href = '/?next=' + encodeURIComponent(redirect);
    const code = currentParams.get('code');
    
    (async () => {
      try {
        const response = await axios.post(XIS_URL + '/oauth/token', qs.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:3001/redirect',
          code_verifier: cookies.getCookie('challenge')!
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        console.log(response);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []); 

  return <></>;
}