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
 * The properties passed to this page.
 * 
 * @typedef {Object} PersonalInformationProps
 * @property {UserData} [userData] The user data provided by the page.
 */
type PersonalInformationProps = {
  userData?: UserData;
}

/**
 * The state of this page.
 * 
 * @typedef {Object} PersonalInformationState
 * @property {boolean} newNameValid True if the new name is valid.
 */
type PersonalInformationState = {
  newNameValid: boolean;
}

import { Component } from 'react';
import { UserData } from '../../pages/Account';
import '../../css/accountPages/PersonalInformationPage.scss';
import TextInput from '../TextInput';
import { validators } from '@xpkg/validation';
import { body, validationResult } from 'express-validator';

export default class PersonalInformation extends Component<PersonalInformationProps, PersonalInformationState> {

  private _originalName: string;
  private _newName: string;

  constructor(props: PersonalInformationProps) {
    super(props);

    this.state = {
      newNameValid: false
    };

    this._originalName = props.userData!.name;
    this._newName = props.userData!.name;
  }

  render() {  
    return (
      <div id='personal-info-page'>
        <div id="pfp-section">
          <img src={this.props.userData!.profilePicture + '?s=256'} alt="Profile Picture" />
        </div>
        <div id='name-change-section'>
          <TextInput name='new-name' placeholder='New Name' label='Name' defaultValue={this._originalName} onChange={async e => {
            this._newName = e.target.value;
            const validationResult = await validators.isValidName(body('name')).run({body: { name: this._newName }});
            this.setState({
              newNameValid: this._originalName !== this._newName.trim() && validationResult.isEmpty() && this.props.userData!.nameChangeDate.valueOf() + 30 * 24 * 60 * 60 <= Date.now()
            });
          }} />
          <div id="name-change-info">
            <p id="last-changed">Last changed: { this.props.userData!.nameChangeDate.toLocaleDateString('en-us') }<br />You can only change your name once every 30 days.</p>
            <button className="primary-button" disabled={!this.state.newNameValid}>Change Name</button>
          </div>
        </div>
      </div>
    );
  }
}