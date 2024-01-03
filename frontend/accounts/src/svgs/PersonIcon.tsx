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

export default function PersonIcon() {
  // https://www.svgrepo.com/collection/forge-line-interface-icons
  return (
    <svg width='800px' height='800px' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' strokeWidth='3' stroke='#000000' fill='none'>
      <circle className='primary-stroke' cx='32' cy='18.14' r='11.14' />
      <path className='primary-stroke' d='M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z' />
    </svg>

  );
}