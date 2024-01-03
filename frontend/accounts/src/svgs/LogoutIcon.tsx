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
import '../css/SvgColoring.scss';

export default function LogoutIcon() {
  return (
    <svg width='800px' height='800px' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' stroke-width='3' stroke='#000000' fill='none'>
      <polyline className='primary-stroke' points='46.02 21.95 55.93 31.86 46.02 41.77' />
      <line className='primary-stroke' x1='55.93' y1='31.86' x2='19.59' y2='31.86' />
      <path className='primary-stroke' d='M40,38.18V52a2.8,2.8,0,0,1-2.81,2.8H12A2.8,2.8,0,0,1,9.16,52V11.77A2.8,2.8,0,0,1,12,9H37.19A2.8,2.8,0,0,1,40,11.77V25' />
    </svg>
  );
}