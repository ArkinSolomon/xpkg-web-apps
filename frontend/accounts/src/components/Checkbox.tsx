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

/**
 * The properties of the checkbox.
 * 
 * @typedef {Object} CheckboxProps
 * @property {boolean} checked True if the box is checked.
 * @property {string} [className] The additional classes to add to the checkbox.
 * @property {string} [label] The label of the checkbox, the children are used if no label is provided.
 * @property {string} name The name of the checkbox.
 * @property {ChangeEvent<HTMLInputElement>} [onChange] The callback to execute when the checkbox value changes.
 * @property {JSX.Element} [children] The children of the element.
 * @property {string} [key] The key of the checkbox.
 */
type CheckboxProps = {
  checked: boolean;
  className?: string;
  label?: string;
  name: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  children?: JSX.Element;
  key?: string;
}

import { ChangeEvent, JSX } from 'react';

export default function Checkbox({ checked, name, label, onChange, children, ...props }: CheckboxProps) {
  const key = props.key ?? name;
  if (!label && !children) {
    throw new Error('Neither children nor label is provided');
  }
  return (
    <div className={'input checkbox ' + (props.className ?? '')}>
      <input
        type='checkbox'
        checked={checked}
        aria-checked={checked}
        key={key}
        name={name}
        onChange={onChange}
      />
      <label htmlFor={name}>{label ?? children}</label>
    </div>
  );
}