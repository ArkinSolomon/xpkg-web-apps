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
import '../css/SvgColoring.scss';

export default function OAuthClientIcon() {
  return (
    <svg width="800px" height="800px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" strokeWidth="3" stroke="#000000" fill="none">
      <path className='primary-stroke' d="M53.86,27.41v11.7a3,3,0,0,1-3,3H11.23A3.13,3.13,0,0,1,8.1,39V12.67a2,2,0,0,1,2-2H39.73" />
      <path className='primary-stroke' d="M54.35,48.77h-46a4.51,4.51,0,0,1-4.51-4.51V42.14H58.36v2.63A4,4,0,0,1,54.35,48.77Z" />
      <path className='primary-stroke' d="M49.27,5.23,40,9.08a.49.49,0,0,0-.3.46v8.21h0a11.47,11.47,0,0,0,5.62,9.87l4.1,2.45,4-2.44a11.48,11.48,0,0,0,5.57-9.85V9.07a.5.5,0,0,0-.32-.47L49.64,5.22A.52.52,0,0,0,49.27,5.23Z" />
      <polyline className='primary-stroke' points="44.75 18.09 48.11 20.62 54.04 12.3" />
    </svg>
  );
}