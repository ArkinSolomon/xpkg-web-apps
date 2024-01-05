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
import '../css/svgColoring.scss';

export default function ExternalLinkIcon() {
  return (
    <svg width='800px' height='800px' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' strokeWidth='3' stroke='#000000' fill='none'>
      <path className='button-text-stroke' d='M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32' />
      <polyline className='button-text-stroke' points='40.32 8.6 55.4 8.6 55.4 24.18' /><line x1='19.32' y1='45.72' x2='54.61' y2='8.91' />
    </svg>
  );
}