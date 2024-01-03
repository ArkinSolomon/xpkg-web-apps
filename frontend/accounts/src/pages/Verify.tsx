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
import { JSX, useEffect, useState } from 'react';
import SmallContentBox from '../components/SmallContentBox';
import axios from 'axios';
import { getExpiry } from '../scripts/tokenValidityChecker';

export default function (): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  
  useEffect(() => {
    (async () => { 
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.has('token')) 
        return setError('no token provided.');

      const verificationToken = searchParams.get('token')!; 
      const expiryDate = getExpiry(verificationToken);
      if (expiryDate.getTime() < Date.now()) 
        return setError('token expired.');

      try {
        const response = await axios.post('http://localhost:4819/account/verify', {
          token: verificationToken
        }, {
          validateStatus: () => true
        });

        if (response.status === 204) {
          setVerified(true);

          setTimeout(() => {
            window.location.href = 'http://127.0.0.1:3000/authenticate';
          }, 5000);
        } else if (response.status === 500) 
          setError('an internal server error occured.');
        else 
          throw `Invalid status code: ${response.status}`;
        
      } catch (e) {
        console.error(e);
        setError('an unknown error occured while trying to validate the token.');
      }

    })();
  }, []);

  if (error) 
    return (
      <SmallContentBox>
        <p className='my-4 mx-1 explain-text'>Could not verify your email, {error}</p>
      </SmallContentBox>
    );

  if (!verified) 
    return (
      <SmallContentBox>
        <p className='my-4 mx-1 explain-text'>Verifying...</p>
      </SmallContentBox>
    );
  
  return (
    <SmallContentBox>
      <p className='my-4 mx-1 explain-text'>Your email has been verified successfully. Please login again.</p>
    </SmallContentBox>
  );
}