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
 * @property {boolean} newEmailValid True if the new email is valid.
 */
type PersonalInformationState = {
  newNameValid: boolean;
  newEmailValid: boolean;
}

import { Component } from 'react';
import { UserData } from '../../pages/Account';
import '../../css/accountPages/PersonalInformationPage.scss';
import TextInput from '../TextInput';
import { validators } from '@xpkg/validation';
import { body } from 'express-validator';

export default class PersonalInformation extends Component<PersonalInformationProps, PersonalInformationState> {

  private _originalName: string;
  private _newName: string;

  private _originalEmail: string;
  private _newEmail: string;

  private _isGravatar: boolean;

  constructor(props: PersonalInformationProps) {
    super(props);

    this.state = {
      newNameValid: false,
      newEmailValid: false
    };

    this._originalName = props.userData!.name;
    this._newName = props.userData!.name;
    this._originalEmail = props.userData!.email;
    this._newEmail = props.userData!.email;
    this._isGravatar = this.props.userData!.profilePicture.startsWith('https://gravatar.com/avatar');
  }

  render() {  
    return (
      <div id='personal-info-page'>
        <div id="pfp-section">
          <img src={this.props.userData!.profilePicture + '?s=256'} alt="Profile Picture" />
          <button className="primary-button mt-4">Upload Image</button>
          <button className="primary-button mt-4" role={this._isGravatar ? 'link' : 'button'}  onClick={() => {
            if (this._isGravatar) {
              window.open('https://wordpress.com/log-in/link?client_id=1854&redirect_to=https%3A%2F%2Fpublic-api.wordpress.com%2Foauth2%2Fauthorize%3Fclient_id%3D1854%26response_type%3Dcode%26blog_id%3D0%26state%3D06d58a818e98e88ac66f10ae7dbacad0bc34559c5f776606785532173df4afe8%26redirect_uri%3Dhttps%253A%252F%252Fgravatar.com%252Fconnect%252F%253Faction%253Drequest_access_token%26from-calypso%3D1', '_blank');
              return;
            }

            window.alert('Not implemented');
          }}>{!this._isGravatar ? 'Use Gravatar' : 'Modify Gravatar'}</button>
        </div>
        <div>
          <section className='change-section'>
            <TextInput name='new-name' placeholder='New Name' label='Name' defaultValue={this._originalName} onChange={async e => {
              this._newName = e.target.value;
              const validationResult = await validators.isValidName(body('name')).run({body: { name: this._newName }});
              this.setState({
                newNameValid: this._originalName !== this._newName.trim() && validationResult.isEmpty() && this.props.userData!.nameChangeDate.valueOf() + 30 * 24 * 60 * 60 <= Date.now()
              });
            }} />
            <div className='change-info'>
              <p>Last changed: { this.props.userData!.nameChangeDate.toLocaleDateString('en-us') }<br />You can only change your name once every 30 days.</p>
              <button className="primary-button" disabled={!this.state.newNameValid}>Change Name</button>
            </div>
          </section>
          <section className="change-section">
            <TextInput name='new-email' placeholder='New Email' label='Email' defaultValue={this._originalEmail} onChange={async e => {
              this._newEmail = e.target.value;
              const validationResult = await validators.isValidEmail(body('email')).run({body: { email: this._newEmail }});
              this.setState({
                newEmailValid: this._originalEmail !== this._newEmail.trim() && validationResult.isEmpty()
              });
            }} />
            <div className='change-info'>
              <p>{this.props.userData!.emailVerified ? 'Your email has been verified.' : 'You must verify your email.'}</p>
              <div>
                <button className="primary-button" disabled={this.props.userData!.emailVerified}>Resend Email</button>
                <button className="primary-button ml-2" disabled={!this.state.newEmailValid}>Change Email</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
}