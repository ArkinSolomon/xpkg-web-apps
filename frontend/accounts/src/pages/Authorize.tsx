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
 * @property {string} clientId The client id. Same as the one sent.
 * @property {string} clientName The name of the client this user is consenting to.
 * @property {string} clientIcon The icon of the client this user is consenting to.
 * @property {string} clientDescription The description of the client given by the user that created the client.
 * @property {string} userName The name of the user that is deciding on authorization.
 * @property {string} userPicture The url of the user's profile picture.
 * @property {boolean} autoConsent True if the user should auto-consent to the popup.
 */
type ConsentInformation = {
  clientId: string;
  clientName: string;
  clientIcon: string;
  clientDescription: string;
  userName: string;
  userPicture: string;
  autoConsent: boolean;
};

import { JSX, useEffect, useRef, useState } from 'react';
import SmallContentBox from '../components/SmallContentBox';
import HexagonImage from '../components/HexagonImage';
import axios from 'axios';
import ConnectArrows from '../svgs/ConnectArrows';
import { DEVELOPER_PORTAL_CLIENT_ID, FORUM_CLIENT_ID, STORE_CLIENT_ID, TokenScope, XIS_URL, XPKG_CLIENT_CLIENT_ID, identifiers, isTokenValid } from '@xpkg/auth-util';
import Cookies from 'js-cookie';
import '../css/Authorize.scss';

export default function Authorize(): JSX.Element {
  const [consentInfo, setConsentInfo] = useState<ConsentInformation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formId] = useState<string>(identifiers.alphaNanoid());
  const autoAuthSet = useRef<boolean>(false);

  useEffect(() => {
    (async () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.has('client_id'))
        return setError('Invalid/malformed request: missing client id.');
      else if (!searchParams.has('scope'))
        return setError('Invalid/malformed request: missing scope.');
      else if (!searchParams.has('redirect_uri'))
        return setError('Invalid/malformed request: missing redirect URI.');
      else if (!searchParams.has('response_type'))
        return setError('Invalid/malformed request: missing response type.');
      else if (!searchParams.has('code_challenge'))
        return setError('Invalid/malformed request: missing code challenge.');

      if (searchParams.get('code_challenge')!.length !== 64)
        return setError('Invalid/malformed request: invalid code challenge. Did you hash your code verifier?');
      
      try {
        const isLoginValid = await isTokenValid(Cookies.get('token'), TokenScope.Identity);
        if (!isLoginValid) {
          if (searchParams.has('next'))
            searchParams.delete('next');
          searchParams.append('next', 'authorize');
          Cookies.remove('token');
          window.location.href = '/authenticate?' + searchParams.toString();
        }
      
        const consentInfoQuery = new URLSearchParams();
        const clientId = searchParams.get('client_id')!;
        consentInfoQuery.append('client_id', clientId);

        const response = await axios.get(XIS_URL + '/oauth/consentinformation?' + consentInfoQuery.toString(), {
          headers: {
            Authorization: Cookies.get('token')!
          },
          validateStatus: () => true
        });

        if (response.status !== 200)
          return setError(`Invalid/malformed request: an error occured while fetching information (${response.data}).`);
    
        setConsentInfo(response.data);
      } catch (e) {
        console.error(e);
        setError('An unkown error occured.');
      }
    })();
  }, []);

  if (error)
    return (
      <SmallContentBox>
        <p className='my-4 mx-1 explain-text'>{error}</p>
      </SmallContentBox>
    );

  if (!consentInfo)
    return (
      <SmallContentBox>
        <p className='my-4 mx-1 explain-text'>Loading details...</p>
      </SmallContentBox>
    );
  
  const isProprietaryService = [DEVELOPER_PORTAL_CLIENT_ID, FORUM_CLIENT_ID, STORE_CLIENT_ID, XPKG_CLIENT_CLIENT_ID].includes(consentInfo.clientId);
  const shouldAutoAuth = consentInfo.autoConsent || (isProprietaryService && consentInfo.clientId !== DEVELOPER_PORTAL_CLIENT_ID);
  
  if (shouldAutoAuth && !autoAuthSet.current){
    const selector = '#' + formId;
    
    // Well it better be there in 100ms...
    autoAuthSet.current = true;
    setTimeout(() => {
      const formElement: HTMLFormElement | null = document.querySelector(selector);
      if (formElement)
        formElement.submit();
    }, 100);
  }
  
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('next'))
    searchParams.delete('next');

  const submitUrl = '/authorize?' + searchParams.toString();
  
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
        <h2 id='connect-text'>Do you want to allow {consentInfo.clientId === DEVELOPER_PORTAL_CLIENT_ID ? ' the' : ''}<br /><b>{consentInfo.clientName}</b><br /> to access your account?</h2>
        <hr className='auth-hr' />
        <p className='explain-text mt-3'>{consentInfo.clientDescription}</p>
        <div className='bottom-buttons mt-12 mb-12 px-8'>
          <button className='secondary-button' onClick={() => window.location.href = '/'} disabled={shouldAutoAuth}>Cancel</button>
          <div className='center-link-wrapper' />
          {/* We can not use axios because it will follow the redirect itself, instead of the form. */}
          <form action={submitUrl} id={formId} method='POST'>
            <input className='primary-button' id='authorize-button' type='submit' value='Authorize' disabled={shouldAutoAuth} />
          </form>
        </div>
      </>
    </SmallContentBox>
  );
}