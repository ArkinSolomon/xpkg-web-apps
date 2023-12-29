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

export default function DeveloperSettingsIcon() {
  return (
    <svg width="800px" height="800px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" strokeWidth="3" stroke="#000000" fill="none">
      <line className='primary-stroke' x1="36.62" y1="13.05" x2="27.08" y2="50.95" strokeLinecap="round" />
      <polyline className='primary-stroke' points="22.26 21.98 12.81 32.01 22.26 42.02" strokeLinecap="round" stroke-linejoin="round" />
      <polyline className='primary-stroke' points="41.74 21.98 51.19 32.01 41.74 42.02" strokeLinecap="round" stroke-linejoin="round" />
    </svg>
  );
}