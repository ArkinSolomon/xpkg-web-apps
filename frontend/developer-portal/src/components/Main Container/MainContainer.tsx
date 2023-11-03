/*
 * Copyright (c) 2022-2023. Arkin Solomon.
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
type Elements = ReactNode | ReactNode[];

import { ReactNode } from 'react';
import '../../css/MainContainer.scss';

function MainContainer(props: { right?: Elements; left?: Elements; children?: Elements; }) {
  let children = props.children;
  const left = props.left;
  const right = props.right;
  if (!left && !children)
    children = right;

  if (!right && !children)
    children = left;
  
  if (left && right)
    return (
      <main id='main-container'>
        <div id='main-container-left'>
          {left}
        </div>
        <div id='main-container-right'>
          {right}
        </div>
      </main>
    );
  else
    return (
      <main id='main-container'>
        {children}
      </main>
    );
}

export default MainContainer;