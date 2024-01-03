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
import '../css/SvgColoring.scss';

export default function SecuritySettingsIcon() {
  return (
    <svg width='800px' height='800px' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' strokeWidth='3' stroke='#000000' fill='none'>
      <rect className='primary-stroke' x='12.34' y='25.5' width='39.32' height='30.95' rx='1.5' />
      <path className='primary-stroke' d='M32,7.55h0A11.29,11.29,0,0,1,43.29,18.84V25.5a0,0,0,0,1,0,0H20.71a0,0,0,0,1,0,0V18.84A11.29,11.29,0,0,1,32,7.55Z' />
      <circle className='primary-stroke' cx='32' cy='42.83' r='3.76' />
      <line x1='32' y1='46.6' x2='32' y2='51.83' />
    </svg>
  );
}