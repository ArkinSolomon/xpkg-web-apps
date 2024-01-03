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
 * @property {(ModalProps) => void} showModal The callback function which shows the modal.
 */
type PersonalInformationProps = {
  userData?: UserData;
  showModal: (modal: ModalProps) => void;
};

/**
 * The state of this page.
 * 
 * @typedef {Object} PersonalInformationState
 * @property {boolean} newNameValid True if the new name is valid.
 * @property {boolean} newEmailValid True if the new email is valid.
 * @property {string} [emailHash] The hash of the email stored on the server. Undefined while computing.
 * @property {boolean} resendButtonEnabled True if the resend email button is enabled (disabled means it is shown, but greyed out).
 * @property {string} resendText The text next to the resend button.
 */
type PersonalInformationState = {
  newNameValid: boolean;
  newEmailValid: boolean;
  emailHash?: string;
  resendButtonEnabled: boolean;
  resendText: string;
};

import { Component, ReactNode } from 'react';
import { UserData } from '../../pages/Account';
import '../../css/accountPages/PersonalInformationPage.scss';
import TextInput from '../TextInput';
import { validators } from '@xpkg/validation';
import { body } from 'express-validator';
import { ModalProps } from '../Modal';
import axios from 'axios';
import { getCookie } from '../../scripts/cookies';

export default class PersonalInformation extends Component<PersonalInformationProps, PersonalInformationState> {

  private _originalName: string;
  private _newName: string;

  private _originalEmail: string;
  private _newEmail: string;

  constructor(props: PersonalInformationProps) {
    super(props);

    this.state = {
      newNameValid: false,
      newEmailValid: false,
      resendButtonEnabled: true,
      resendText: props.userData!.emailVerified ? 'Your email has been verified.' : 'You must verify your email.'
    };

    this._originalName = props.userData!.name;
    this._newName = props.userData!.name;
    this._originalEmail = props.userData!.email;
    this._newEmail = props.userData!.email;

    this._resetNameField = this._resetNameField.bind(this);
    this._resetPfp = this._resetPfp.bind(this);
    this._changeName = this._changeName.bind(this);
    this._changeEmail = this._changeEmail.bind(this);
    this._resendVerificationEmail = this._resendVerificationEmail.bind(this);
  }

  componentDidMount(): void {
    (async () => {
      this.setState({
        emailHash: await sha256Hash(this.props.userData!.email)
      });
    })();
  }

  /**
   * Reset the name field back to the original text.
   */
  private _resetNameField() {
    this._newName = this._originalName;
    (document.getElementById('new-name-input') as HTMLInputElement).value = this._newName;
  }

  /**
   * Reset the name field back to the original text.
   */
  private _resetEmailField() {
    this._newEmail = this._originalEmail;
    (document.getElementById('new-email-input') as HTMLInputElement).value = this._newName;
  }

  /**
   * Ask the user if they are sure they want to reset their profile picture, and do so if they are.
   */
  private _resetPfp() {
    this.props.showModal({
      title: 'Reset Profile Picture',
      children: <p className='generic-modal-text'>Are you sure you want to revert your profile picture to your Gravatar. Your old profile picture is not retained, and you can upload a new one at any time.</p>,
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Okay',
          style: 'primary',
          autoFocus: true,
          action: async () => {
            this.props.showModal({
              title: 'Reset Profile Picture',
              children: <p className='generic-modal-text'>Resetting your profile picture to use Gravatar.</p>
            });

            let error = 'Could not reset your profile picture, an internal server error occured. Please try again later.';
            try {
              const result = await axios.patch('http://localhost:4819/account/resetpfp', {}, {
                headers: {
                  Authorization: getCookie('token')
                },
                validateStatus: () => true
              });  

              // We'll just redirect to login if they are unauthorized
              if (result.status === 204 || result.status === 401) 
                window.location.href = '/account';
              else if (result.status !== 500) {
                error = 'Could not reset your profile picture, an unknown error occured. Please try again later.';
                throw 'Bad status: ' + result.status;
              }
            } catch (e) {
              console.error(e);

              if (!(typeof e === 'string')) 
                error = 'Could not reset your profile picture, an unknown error occured. Please try again later.';
             
              this.props.showModal({
                title: 'Reset Profile Picture',
                children: <p className='generic-modal-text'>{error}</p>,
                buttons: [
                  {
                    text: 'Okay',
                    style: 'primary',
                    autoFocus: true
                  }
                ]
              }); 
            }
          }
        }
      ]
    });
  }

  /**
   * Change the name of the user.
   */
  private _changeName() {
    this.props.showModal({
      title: 'Change Name',
      children: <p className='generic-modal-text'>
Are you sure you want to change your name to
        <b>{this._newName.trim()}</b>
. You will not be able to change your name again for 30 days.
      </p>,
      buttons: [
        {
          text: 'Cancel',
          action: this._resetNameField
        },
        {
          text: 'Change',
          action: async () => {
            this.props.showModal({
              title: 'Change Name',
              children: <p className='generic-modal-text'>
Changing your name to
                <b>{this._newName.trim()}</b>
.
              </p>
            });

            try {
              const result = await axios.patch('http://localhost:4819/account/name', {
                newName: this._newName
              }, {
                headers: {
                  Authorization: getCookie('token')
                }
              });

              if (result.status !== 204) 
                throw result.status;

              window.location.reload();
            } catch (e) {
              console.error(e);

              let error = 'An unknown error occured. Please try again later.';
              if (typeof e === 'number' && e === 500) 
                error = 'An internal server error occured. Please try again later.';

              this.props.showModal({
                title: 'Change Name',
                children: <p className='generic-modal-text'>{ error }</p>,
                buttons: [
                  {
                    text: 'Ok',
                    style: 'primary',
                    autoFocus: true,
                    action: this._resetNameField
                  }
                ]
              });
            }
          },
          style: 'primary',
          autoFocus: true
        }
      ]
    });
  }

  /**
   * Send an email change request for the user.
   */
  private _changeEmail() {
    this.props.showModal({
      title: 'Request Email Change',
      children: <p className='generic-modal-text'>
Are you sure you want to change your email to
        <b>{this._newName.trim()}</b>
. You will need to verify that you requested this change. Any previous requests will immediately expire.
      </p>,
      buttons: [
        {
          text: 'Cancel',
          action: this._resetEmailField
        },
        {
          text: 'Change',
          action: async () => {
            this.props.showModal({
              title: 'Request Email Change',
              children: <p className='generic-modal-text'>
Creating your email change request. New email:
                <b>{this._newEmail.trim()}</b>
.
              </p>
            });

            try {
              const result = await axios.patch('http://localhost:4819/account/email', {
                newEmail: this._newEmail
              }, {
                headers: {
                  Authorization: getCookie('token')
                }
              });

              if (result.status !== 204) 
                throw result.status;

              this.props.showModal({
                title: 'Request Email Change',
                children: <p className='generic-modal-text'>
Your request to change your email to
                  <b>{this._newEmail.trim()}</b>
                  {' '}
has been created. Check the inbox of
                  <b>{this._originalEmail}</b>
                  {' '}
to complete. You will not see a change if you do not complete the request. The request expires in 1 hour.
                </p>,
                buttons: [
                  {
                    text: 'Okay',
                    style: 'primary'
                  }
                ]
              });
            } catch (e) {
              console.error(e);

              let error = 'An unknown error occured. Please try again later.';
              if (typeof e === 'number' && e === 500) 
                error = 'An internal server error occured. Please try again later.';

              this.props.showModal({
                title: 'Request Email Change',
                children: <p className='generic-modal-text'>{ error }</p>,
                buttons: [
                  {
                    text: 'Ok',
                    style: 'primary',
                    autoFocus: true,
                    action: this._resetEmailField
                  }
                ]
              });
            }
          },
          style: 'primary',
          autoFocus: true
        }
      ]
    });
  }

  /**
   * Send an resend email.
   * 
   * @async
   */
  private async _resendVerificationEmail() {
    this.setState({
      resendButtonEnabled: false,
      resendText: 'Sending verification email...'
    });

    try {
      await axios.post('http://localhost:4819/account/resend', {}, {
        headers: {
          Authorization: getCookie('token')
        }
      });

      this.setState({
        resendText: 'Resent verification email.'
      });
    } catch (e) {
      console.error(e);

      this.setState({
        resendText: 'An error occured.'
      });

      setTimeout(() => {
        this.setState({
          resendButtonEnabled: true,
          resendText: 'You must verify your email.'
        });
      }, 5500);
    }
  }
  
  /**
   * Get the element for the Gravatar button.
   * 
   * @returns {ReactNode} The update/use/modify Gravatar button.
   */
  private _gravatarButton(): ReactNode {
    const isGravatar = this.props.userData!.profilePicture.startsWith('https://gravatar.com/avatar');
    let hash: string;
    if (isGravatar) 
      hash = this.props.userData!.profilePicture.replace(/^https:\/\/gravatar.com\/avatar\//, '').split(/[/?]/)[0]!;
    
    if (isGravatar && (!this.state.emailHash || this.state.emailHash === hash!)) 
      return (
        <button className='primary-button mt-4' role='link' onClick={() => window.open('https://wordpress.com/log-in/link?client_id=1854&redirect_to=https%3A%2F%2Fpublic-api.wordpress.com%2Foauth2%2Fauthorize%3Fclient_id%3D1854%26response_type%3Dcode%26blog_id%3D0%26state%3D06d58a818e98e88ac66f10ae7dbacad0bc34559c5f776606785532173df4afe8%26redirect_uri%3Dhttps%253A%252F%252Fgravatar.com%252Fconnect%252F%253Faction%253Drequest_access_token%26from-calypso%3D1', '_blank')}>Modify Gravatar</button>
      ); 
    else if (!isGravatar) 
      return (
        <button className='primary-button mt-4' role='button' onClick={this._resetPfp}>Use Gravatar</button>
      );
    else 
      return (
        <button className='primary-button mt-4' role='button' onClick={this._resetPfp}>Update Gravatar</button>
      );
    
  }

  render() {  
    return (
      <div id='personal-info-page'>
        <div id='pfp-section'>
          <img src={this.props.userData!.profilePicture + '?s=256'} alt='Profile Picture' />
          <button className='primary-button mt-4'>Upload Image</button>
          {this._gravatarButton()}
        </div>
        <div>
          <section className='change-section'>
            <TextInput name='new-name' id='new-name-input' placeholder='New Name' label='Name' defaultValue={this._originalName} onChange={async e => {
              this._newName = e.target.value;
              const validationResult = await validators.isValidName(body('name')).run({ body: { name: this._newName } });
              this.setState({
                newNameValid: this._originalName !== this._newName.trim() && validationResult.isEmpty() && this.props.userData!.nameChangeDate.valueOf() + 30 * 24 * 60 * 60 <= Date.now()
              });
            }}
            />
            <div className='change-info'>
              <p>
Last changed:
                { this.props.userData!.nameChangeDate.toLocaleDateString('en-us') }
                <br />
You can only change your name once every 30 days.
              </p>
              <button className='primary-button' disabled={!this.state.newNameValid} onClick={this._changeName}>Change Name</button>
            </div>
          </section>
          <section className='change-section'>
            <TextInput name='new-email' placeholder='New Email' label='Email' defaultValue={this._originalEmail} onChange={async e => {
              this._newEmail = e.target.value;
              const validationResult = await validators.isValidEmail(body('email')).run({ body: { email: this._newEmail } });
              this.setState({
                newEmailValid: this._originalEmail !== this._newEmail.trim() && validationResult.isEmpty()
              });
            }}
            />
            <div className='change-info'>
              <p>{ this.state.resendText }</p>
              <div>
                {!this.props.userData!.emailVerified && <button className='primary-button' disabled={!this.state.resendButtonEnabled} onClick={this._resendVerificationEmail}>Resend Email</button>}
                <button className='primary-button ml-2' disabled={!this.state.newEmailValid} onClick={this._changeEmail}>Change Email</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
}

/**
 * Get the sha256 hash of a message. See examples at https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest.
 * 
 * @param {string} text The text to hash.
 * @returns {string} The sha256 hash of the given text.
 */
async function sha256Hash(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}