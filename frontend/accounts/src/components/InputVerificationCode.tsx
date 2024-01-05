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
import VerificationInput from 'react-verification-input';
import '../css/Input.scss';

export default function InputVerificationCode(props: Omit<Parameters<typeof VerificationInput>[0], 'classNames'> & { error: boolean; }) {
  return (
    <VerificationInput {...props} placeholder='&#8226;' validChars='0-9' classNames={{
      container: 'input verification-input' + (props.error ? ' error' : ''),
      character: 'verification-char',
      characterSelected: 'selected',
      characterInactive: 'inactive'
    }}
    />
  );
}