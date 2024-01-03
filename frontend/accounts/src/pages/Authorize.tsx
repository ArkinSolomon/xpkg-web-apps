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
 * The consent information sent from the server so that the user can decide to consent.
 * 
 * @typedef {Object} ConsentInformation
 * @property {string} clientName The name of the client this user is consenting to.
 * @property {string} clientIcon The icon of the client this user is consenting to.
 * @property {string} clientDescription The description of the client given by the user that created the client.
 * @property {string} userName The name of the user that is deciding on authorization.
 * @property {string} userPicture The url of the user's profile picture.
 */
type ConsentInformation = {
  clientName: string;
  clientIcon: string;
  clientDescription: string;
  userName: string;
  userPicture: string;
};

import { JSX, useEffect, useState } from 'react';
import SmallContentBox from '../components/SmallContentBox';
import HexagonImage from '../components/HexagonImage';
import tokenValidityChecker from '../scripts/tokenValidityChecker';
import axios from 'axios';
import { getCookie } from '../scripts/cookies';
import ConnectArrows from '../svgs/ConnectArrows';

export default function (): JSX.Element {
  const [consentInfo, setConsentInfo] = useState<ConsentInformation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => { 
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.has('client_id')) 
        return setError('missing client id.');
      else if (!searchParams.has('scope')) 
        return setError('missing scope.');
      else if (!searchParams.has('redirect_uri')) 
        return setError('missing redirect URI.');
      else if (!searchParams.has('response_type')) 
        return setError('missing response type.');
      else if (!searchParams.has('code_challenge')) 
        return setError('missing code challenge.');

      const isLoginValid = await tokenValidityChecker();
      if (isLoginValid !== 204) {
        searchParams.append('next', 'authorize');
        window.location.href = '/authenticate?' + searchParams.toString();
      }
      
      const consentInfoQuery = new URLSearchParams();
      consentInfoQuery.append('client_id', searchParams.get('client_id')!);
      const response = await axios.get('http://localhost:4819/oauth/consentinformation?' + consentInfoQuery.toString(), {
        headers: {
          Authorization: getCookie('token')!
        },
        validateStatus: () => true
      });

      if (response.status !== 200) 
        return setError(`an error occured while fetching information (${response.data}).`);

      setConsentInfo(response.data);
    })();
  }, []);

  if (error) 
    return (
      <SmallContentBox>
        <p className='my-4 mx-1 explain-text'>
Invalid/malformed request:
          {error}
        </p>
      </SmallContentBox>
    );

  if (!consentInfo) 
    return (
      <SmallContentBox>
        <p className='my-4 mx-1 explain-text'>Loading details...</p>
      </SmallContentBox>
    );
  
  return (
    <SmallContentBox>
      <>
        <div className='w-10/12 mt-4 mx-auto flex gap-2'>
          <div className='inline-block flex-none'>
            <HexagonImage size='64px' alt='Application' src={consentInfo.clientIcon} />
          </div>
          <div className='flex-1 self-center'>
            <ConnectArrows />
          </div>
          <div className='flex-none'>
            <HexagonImage size='64px' alt='Application' src={consentInfo.userPicture} />
          </div>
        </div>
      </>
    </SmallContentBox>
  );
}