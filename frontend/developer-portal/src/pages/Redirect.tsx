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
import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import MainContainerError from '../components/Main Container/MainContainerError';
import MainContainer from '../components/Main Container/MainContainer';

export default function Redirect() {
  const [error, setError] = useState<string | null>(null);
  const redirect = useRef<string>('/packages');

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    let state = currentParams.get('state');

    if (state) {
      const equalCount = parseInt(redirect.current.charAt(redirect.current.length - 1), 10);
      state = state.slice(0, state.length - 2);
      for (let i = 0; i < equalCount; ++i)
        state += '=';
      
      redirect.current = atob(state);
    }

    if (!currentParams.has('code') || !sessionStorage.getItem('code_verifier'))
      window.location.href = '/?next=' + encodeURIComponent(redirect.current);
    const code = currentParams.get('code');
    
    (async () => {
      const codeVerifier = sessionStorage.getItem('code_verifier')!;
      sessionStorage.removeItem('code_verifier');

      let token;

      try {
        const tokenResponse = await axios.post(XIS_URL + '/oauth/token', {
          client_id: DEVELOPER_PORTAL_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://127.0.0.1:3001/redirect',
          code_verifier: codeVerifier
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      
        token = tokenResponse.data.access_token;
      } catch (e) {
        window.location.href = '/?next=' + encodeURIComponent(redirect.current);
      }

      try {
      // This should return 201 or 204, either of which are good
        const response = await axios.post(window.REGISTRY_URL + '/account/init', {}, {
          headers: {
            'Authorization': token
          }
        });

        if (response.status < 200 || response.status >= 300) 
          setError('Could not connect to the X-Pkg Registry.');

        Cookies.set('token', token, { expires: 1 });
        window.location.href = redirect.current;
      } catch (e) {
        console.error(e);
        setError('Could not connect to the X-Pkg Registry.');
      }

    })();
  }, []); 

  if (!error)
    return <></>;
  
  return <MainContainer>
    <MainContainerError
      message='There was an error'
      subtext={error}
      link={'/?next=' + encodeURIComponent(redirect.current)}
      linkName='Try again'
    />
  </MainContainer>;
}