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
 * The current page.
 * 
 * @name Page
 * @enum {number}
 */
enum Page {
  LoadingPage = -2,
  ErrorPage = -1,
  EnterEmailPage = 0,
  EnterCodePage = 1,
  EmailChangedPage = 2
}

/**
 * The state of the email change.
 * 
 * @typedef {Object} EmailChangeState
 * @property {Page} currentPage The current page of the email change form.
 * @property {string} [error] The current error. Only displayed if the error page is active.
 * @property {Page} [errorNextPage] The next page after the error is displayed. Undefined if there is no next button.
 * @property {string} nextText The text to set the back button. 
 * @property {boolean} showNextButton True if the next button should be shown.
 * @property {boolean} showBackButton True if the back button should be shown.
 * @property {() => void} nextFunction The function to run when the next button is clicked.
 * @property {() => void} backFunction The function to run when the back button is clicked.
 * @property {boolean} enableNext True if the next button is enabled.
 * @property {boolean} isSubmitting True if the current page is submitting something.
 * @property {string} codeEntry The current verification code entry.
 * @property {boolean} codeHasError True if the verification code has an error.
 */
type EmailChangeState = {
  currentPage: Page;
  error?: string;
  errorNextPage?: Page;
  nextText: string;
  showNextButton: boolean;
  showBackButton: boolean;
  nextFunction: () => void;
  backFunction: () => void;
  enableNext: boolean;
  isSubmitting: boolean; 
  codeEntry: string;
  codeHasError: boolean;
};

/**
 * The data in this object represents the current email change state returned from the server. Copy and pasted from emailChangeModel.ts.
 * 
 * @typedef {Object} EmailChangeData
 * @property {string} userId The id of the user that requested this email change.
 * @property {string} requestId The id of the email change request. Must match the data in the token.
 * @property {string} originalEmail The original email that is being replaced.
 * @property {string} [newEmail] The new email which is being changed.
 * @property {Date} expiry The time at which this request expires.
 */
export type EmailChangeData = {
  userId: string;
  requestId: string;
  originalEmail: string;
  newEmail?: string;
  expiry: Date;
};

import { Component } from 'react';
import { getExpiry } from '../scripts/tokenValidityChecker';
import axios from 'axios';
import { body } from 'express-validator';
import { validators } from '@xpkg/validation';
import SmallContentBoxPage, { getStateFromIndex } from '../components/SmallContentBoxPage';
import SmallContentBox from '../components/SmallContentBox';
import TextInput from '../components/TextInput';
import InputVerificationCode from '../components/InputVerificationCode';
import '../css/EmailChange.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const EMPTY_FUNCTION = () => { };

export default class EmailChange extends Component<Record<string, never>, EmailChangeState> {

  state: EmailChangeState;

  private _emailChangeData?: EmailChangeData;
  private _isComponentMounted = false;
  
  private _changeToken?: string;
  private _newEmail = '';

  private _invalidEmails: string[] = [];

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      currentPage: Page.LoadingPage,
      nextText: 'Next',
      showNextButton: false,
      showBackButton: false,
      nextFunction: EMPTY_FUNCTION,
      backFunction: EMPTY_FUNCTION,
      enableNext: true,
      isSubmitting: false,
      codeEntry: '',
      codeHasError: false
    };

    this._determineNextEnable = this._determineNextEnable.bind(this);
  }

  async componentDidMount() {
    this._isComponentMounted = true;
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has('token')) 
      return this._setError('No token was provided.');

    this._changeToken = searchParams.get('token')!; 
    const expiryDate = getExpiry(this._changeToken);
    if (expiryDate.getTime() < Date.now()) 
      return this._setError('Token expired.');

    try {
      const response = await axios.get(`http://localhost:4819/account/email/changeemail/data?token=${this._changeToken}`, {
        validateStatus: () => true
      });

      if (response.status === 200) {
        this._emailChangeData = response.data;
        this._invalidEmails.push(this._emailChangeData!.originalEmail);
        if (this._emailChangeData!.newEmail) 
          this._setPageFromIndex(Page.EnterCodePage);
        else 
          this._setPageFromIndex(Page.EnterEmailPage);
      }
      else if (response.status === 400) 
        this._setError(`Bad request Message: (${response.data ?? '<no message>'}).`);
      else if (response.status === 401) 
        this._setError('This email change request is invalid or expired.');
      else if (response.status === 500) 
        this._setError('An internal server error occured. Please try again later.');
      else 
        this._setError(`Unknown status code (${response.status}).`);
        
    } catch (e) {
      console.error(e);
      this._setError('An unknown error occured.');
    }
  }

  async componentWillUnmount() {
    this._isComponentMounted = false;
  }

  /**
   * Set the error page to active and display a message.
   * 
   * @param {string} message The message to set.
   * @param {page} nextPage The next page to go to.
   */
  private _setError(message: string, nextPage?: Page) {
    this.setState({
      error: message,
      errorNextPage: nextPage
    }, () => this._setPageFromIndex(Page.ErrorPage));
  }

  /**
   * Update the state to display the current state, as well as modify the state with the proper callbacks.
   * 
   * @param {Page} index The page to set.
   */
  private _setPageFromIndex(index: Page): void {
    let updateData: Pick<EmailChangeState, 'nextText' | 'showNextButton' | 'showBackButton' | 'nextFunction' | 'backFunction'> & Partial<EmailChangeState>;
    const hasErrorNextPage = typeof this.state.errorNextPage !== 'undefined' && this.state.errorNextPage !== Page.ErrorPage;
    switch (index) {
    case Page.LoadingPage:
    case Page.EmailChangedPage:
      updateData = {
        nextText: 'NOT_SHOWN',
        showNextButton: false,
        showBackButton: false,
        nextFunction: EMPTY_FUNCTION,
        backFunction: EMPTY_FUNCTION
      };
      break;
    case Page.ErrorPage:
      updateData = {
        nextText: 'NOT_SHOWN',
        showNextButton: false,
        showBackButton: hasErrorNextPage,
        nextFunction: EMPTY_FUNCTION,
        backFunction: hasErrorNextPage ? () => this._setPageFromIndex(this.state.errorNextPage!) : EMPTY_FUNCTION
      };
      break;
    case Page.EnterEmailPage:
      updateData = {
        nextText: 'Next',
        showNextButton: true,
        showBackButton: false,
        nextFunction: async () => {
          try {
            this.setState({
              isSubmitting: true
            });

            const response = await axios.post('http://localhost:4819/account/email/changeemail/step1', {
              token: this._changeToken!,
              newEmail: this._newEmail
            }, {
              validateStatus: () => true
            });

            if (response.status === 204) {
              this._setPageFromIndex(Page.EnterCodePage);
              this._emailChangeData!.newEmail = this._newEmail;
            }
            else if (response.status === 400) 
              if (response.data === 'in_use') {
                this._setError('Email already in use. Please choose a different one.', Page.EnterEmailPage);
                this._invalidEmails.push(this._newEmail);
              }
              else
                this._setError(`Bad request with message: ${response.data}`);
            
            else if (response.status === 401)
              this._setError('This email change request has expired. Please request another one.');
            else if (response.status === 500) 
              this._setError('An internal server error occured. Please try again later.', Page.EnterEmailPage);
            else 
              this._setError(`Unknown status code ${response.status}.`);
          } catch (e) {
            console.error(e);
            this._setError('An unknown error occured. Please try again later.', Page.EnterEmailPage);
          } finally {
            this.setState({
              isSubmitting: false
            });
          }
        },
        backFunction: EMPTY_FUNCTION
      };
      break;
    case Page.EnterCodePage:
      updateData = {
        nextText: 'Submit',
        showNextButton: true,
        showBackButton: false,
        nextFunction: async () => {
          try {
            this.setState({
              isSubmitting: true
            });
            const response = await axios.post('http://localhost:4819/account/email/changeemail/step2', {
              token: this._changeToken!,
              code: parseInt(this.state.codeEntry, 10)
            }, {
              validateStatus: () => true
            });

            if (response.status === 204) 
              this._setPageFromIndex(Page.EmailChangedPage);
              
            else if (response.status === 400) 
              if (response.data === 'invalid_code') 
                this.setState({
                  codeHasError: true
                });
              else 
                this._setError(`Bad request with message: ${response.data}`);
            else if (response.status === 401)
              this._setError('This email change request has expired. Please request another one.');
            else if (response.status === 500)
              this._setError('An internal server error occured. Please try again later.', Page.EnterEmailPage);
            else
              this._setError(`Unknown status code ${response.status}.`);
          } catch (e) {
            console.error(e);
            this._setError('An unknown error occured. Please try again later.', Page.EnterEmailPage);
          } finally {
            this.setState({
              isSubmitting: true
            });
          }
        },
        backFunction: EMPTY_FUNCTION
      };
      break;
    default:
      updateData = {
        error: `Page not implemented (${index}).`,
        nextText: 'NOT_SHOWN',
        showNextButton: false,
        showBackButton: false,
        nextFunction: EMPTY_FUNCTION,
        backFunction: EMPTY_FUNCTION 
      };
      index = Page.ErrorPage;
      break;
    }

    updateData.enableNext ??= false;
    if (this._isComponentMounted) 
      this.setState({
        ...updateData,
        currentPage: index
      } as EmailChangeState);
    else 
      this.state = {
        ...this.state,
        ...updateData,
        currentPage: index
      };
  }
  
  /**
   * Determine if the next button should be enabled based on the current page and current state.
   * 
   * @async
   */
  private async _determineNextEnable(): Promise<void> {
    let enableNext = true;
    if (this.state.currentPage === Page.EnterEmailPage) {
      const isEnteredEmailValid = (await validators.isValidEmail(body('email')).run({
        body: {
          email: this._newEmail
        }
      })).isEmpty();
      enableNext = isEnteredEmailValid && !this._invalidEmails.includes(this._newEmail);
    } else if (this.state.currentPage === Page.EnterCodePage) 
      enableNext = /^[0-9]{6}$/.test(this.state.codeEntry);

    if (enableNext == this.state.enableNext) 
      return;
    
    this.setState({
      enableNext
    });
  }

  render() {
    this._determineNextEnable();
    return (
      <SmallContentBox subtitle='Change Email' footer={
        <>
          <div className='bottom-buttons mb-12 px-8'>
            <button className={'secondary-button ' + (this.state.showBackButton ? '' : 'hide')} onClick={() => this.state.backFunction()}>Back</button>
            <div className='center-link-wrapper' />
            <input className={'primary-button ' + (this.state.showNextButton ? '' : 'hide')} onClick={() => this.state.nextFunction()} type='submit' disabled={!this.state.enableNext || this.state.isSubmitting} value={this.state.nextText} />
          </div>
        </>
      }
      >
        <>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.LoadingPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Fetching request information. Please wait...</p>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.ErrorPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>{this.state.error}</p>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.EnterEmailPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Enter the new email address you would like to associate with your X-Pkg account.</p>
              <TextInput className='mt-4' inputType='email' name='change-email' label='New Email Address' placeholder='you@example.com' autocomplete='email' disabled={this.state.isSubmitting} onChange={e => {
                this._newEmail = e.target.value;
                this._determineNextEnable();
              }}
              />
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.EnterCodePage, this.state.currentPage)}>
            <>
              <p className='explain-text'>A 6-digit verification code was sent to <b>{this._emailChangeData?.newEmail}</b>. Check your inbox and enter it here.</p>
              <div className='w-fit mx-auto mt-4'>
                <InputVerificationCode error={this.state.codeHasError} onFocus={() => {
                  if (this.state.codeHasError) 
                    this.setState({
                      codeEntry: '',
                      codeHasError: false,
                      isSubmitting: false
                    });
                }} value={this.state.codeEntry} onChange={codeEntry =>
                  this.setState({ codeEntry }, this._determineNextEnable)
                }
                />
              </div>
              {this.state.codeHasError && <p id='code-error-text'>Invalid code</p>}
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.EmailChangedPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Your email has successfully been changed to <b>{this._emailChangeData?.newEmail}</b>. Login again with your new email.</p>
            </>
          </SmallContentBoxPage>
        </>
      </SmallContentBox>
    );
  }
}