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
import { JSX } from 'react';
import '../css/HexagonImage.scss';

export default function ({ src, alt, size }: { src: string; alt?: string; size: string; }): JSX.Element {
  return (
    <img className='hexagon' src={src} alt={alt} style={{ height: size, width: size }} />
  );
}