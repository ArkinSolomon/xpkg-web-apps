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
import '../css/ContentBox.scss';

export default function (props: {children?: React.JSX.Element, subtitle?: string, footer?: React.JSX.Element}): React.JSX.Element {  
  return (
    <main id='content-box' className='small'>

      <h1 className='main-title'>
        <img src="/logos/main-logo.png" alt="X-Pkg Logo" />
            X-Pkg Accounts
      </h1>
      {
        props.subtitle &&
        <h2 className='subtitle mt-2'>
          {props.subtitle}
        </h2>
      }
      {props.children}
      <div className='box-footer'>
        {props.footer}
      </div>
    </main>
  );
}