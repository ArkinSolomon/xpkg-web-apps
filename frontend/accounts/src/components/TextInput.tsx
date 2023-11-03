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

import { ChangeEventHandler, HTMLInputTypeAttribute } from 'react';
import '../css/Input.scss';

export default function (props: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  onChange?: unknown;
  inputType?: HTMLInputTypeAttribute;
  className?: string;
  hasError?: boolean;
}) {
  const placeholder = props.placeholder ?? props.name;
  const id = 'text-input--' + props.name;
  return (
    <div className={'input text-input ' + (props.hasError ? 'error ' : '') + (props.className ?? '')}>
      <label htmlFor={id}>{ props.label }</label>
      <input key={id} type={props.inputType ?? 'text'} id={id} placeholder={placeholder} defaultValue={props.defaultValue} />
    </div>
  );
}