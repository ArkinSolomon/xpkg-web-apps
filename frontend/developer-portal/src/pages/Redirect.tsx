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
import { DEVELOPER_PORTAL_CLIENT_ID, XIS_URL } from '@xpkg/auth-util';
import { cookies } from '@xpkg/frontend-util';
import { useEffect } from 'react';
import axios from 'axios';

export default function Redirect() {
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
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
        const response = await axios.post(XIS_URL + '/oauth/token', {
          client_id: DEVELOPER_PORTAL_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://127.0.0.1:3001/redirect',
          code_verifier: cookies.getCookie('code_verifier')!
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      
        cookies.setCookie('token', response.data.access_token, 30);
        window.location.href = redirect;
      } catch (e) {
        window.location.href = '/?next=' + encodeURIComponent(redirect);
      }
    })();
  }, []); 

  return <></>;
}