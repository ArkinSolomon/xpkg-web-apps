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
 * The page that we are currently on.
 * 
 * @name Page
 * @enum {number}
 */
enum Page {
  ErrorPage = -1,
  DefaultPage = 0,
  CreateEnterEmailPage = 1,
  CreateEnterNamePage = 2,
  CreateEnterPasswordPage = 3,
  CreateConfirmPasswordPage = 4,
  CreateTermsPage = 5
}

/**
 * The state of the auth page.
 * 
 * @typedef {Object} AuthState
 * @property {'light'|'dark'} theme The theme of the ReCaptcha.
 * @property {Page} currentState The current page that we are on.
 * @property {string} [subtitle] The subtitle of the page.
 * @property {boolean} showLockFooter True if the lock footer should be shown (the box that says ensure you're on accounts.xpkg.net).
 * @property {boolean} showBack True if the back button should be shown.
 * @property {boolean} showNext True if the next button should be shown.
 * @property {string} backText The text to display on the back button.
 * @property {string} nextText The text to display on the next button.
 * @property {string} [middleAnchor] The text to show on the middle anchor, undefined to hide the middle anchor.
 * @property {() => void} onBack The action to run when the back button is pressed.
 * @property {() => void} onNext The action to run when the next button is pressed.
 * @property {() => void} onMiddleAnchor The action to run when the middle anchor is pressed.
 * @property {boolean} hasOpenedTOS True if the terms of service page has been opened during account creation.
 * @property {boolean} hasOpenedPP True if the privacy policy page has been opened during account creation.
 */
type AuthState = {
  theme: 'light' | 'dark';
  currentPage: Page;
  subtitle?: string;
  showLockFooter: boolean;
  showBack: boolean;
  showNext: boolean;
  backText: string;
  nextText: string;
  middleAnchor?: string;
  onBack: () => void;
  onNext: () => void;
  onMiddleAnchor: () => void;
  hasOpenedTOS: boolean;
  hasOpenedPP: boolean;
};

import '../css/Auth.scss';
import SmallContentBox from '../components/SmallContentBox';
import TextInput from '../components/TextInput';
import { Component } from 'react';
import { registerCallback, isSiteInDarkMode } from '../components/ThemeButton';
import SmallContentBoxPage, { getStateFromIndex } from '../components/SmallContentBoxPage';
import '../css/buttons.scss';
import { validators } from 'xpkg-common';
import { body } from 'express-validator';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const EMPTY_FUNCTION = () => { };

const CREATE_SECTION_SUBTITLE = 'Create an account';
const LOGIN_INSTEAD_TEXT = 'Login instead';

export default class extends Component {

  state: AuthState;

  private isComponentMounted = false;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      theme: isSiteInDarkMode() ? 'dark' : 'light',
      currentPage: Page.CreateTermsPage,
      showLockFooter: true,
      showBack: true,
      showNext: true,
      backText: 'NOT_INIT',
      nextText: 'NOT_INIT',
      onBack: EMPTY_FUNCTION,
      onNext: EMPTY_FUNCTION,
      onMiddleAnchor: EMPTY_FUNCTION,
      hasOpenedTOS: false,
      hasOpenedPP: false
    };

    this._setPageFromIndex(this.state.currentPage);

    registerCallback(v => {
      const theme = v ? 'dark' : 'light';
      
      if (this.isComponentMounted)
        this.setState({ theme } as Partial<AuthState>);
      else
        this.state.theme = theme;
    });
  }
  
  componentDidMount(): void {
    this.isComponentMounted = true;
  }

  componentWillUnmount(): void {
    this.isComponentMounted = false;
  }
  
  /**
   * Update the state to display the current state, as well as modify the state with the proper callbacks.
   * 
   * @param {Page} index The page to set.
   */
  private _setPageFromIndex(index: Page): void {
    let updateData: Pick<AuthState, | 'showBack' | 'showNext' | 'showLockFooter' | 'backText' | 'nextText' | 'onNext' | 'onBack' | 'onMiddleAnchor'> & {
      // Force explicit declaration of undefined
      middleAnchor: string | typeof undefined;
      subtitle: string | typeof undefined;
    } & Partial<AuthState>;
    switch (index) {
    case Page.DefaultPage:
      updateData = {
        subtitle: void 0,
        showBack: false,
        showNext: false,
        backText: 'NOT_SHOWN',
        nextText: 'NOT_SHOWN',
        middleAnchor: void 0,
        showLockFooter: true,
        onNext: EMPTY_FUNCTION,
        onBack: EMPTY_FUNCTION,
        onMiddleAnchor: EMPTY_FUNCTION
      };
      break;
    case Page.CreateEnterEmailPage:
      updateData = {
        subtitle: CREATE_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Next',
        middleAnchor: LOGIN_INSTEAD_TEXT,
        showLockFooter: true,
        onNext: () => this._setPageFromIndex(Page.CreateEnterNamePage),
        onBack: () => this._setPageFromIndex(Page.DefaultPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.ErrorPage)
      };
      break;
    case Page.CreateEnterNamePage:
      updateData = {
        subtitle: CREATE_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Next',
        middleAnchor: LOGIN_INSTEAD_TEXT,
        showLockFooter: true,
        onNext: () => this._setPageFromIndex(Page.CreateEnterPasswordPage),
        onBack: () => this._setPageFromIndex(Page.CreateEnterEmailPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.ErrorPage)
      };
      break;
    case Page.CreateEnterPasswordPage: 
      updateData = {
        subtitle: CREATE_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Next',
        middleAnchor: LOGIN_INSTEAD_TEXT,
        showLockFooter: true,
        onNext: () => this._setPageFromIndex(Page.CreateConfirmPasswordPage),
        onBack: () => this._setPageFromIndex(Page.CreateEnterNamePage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.ErrorPage)
      };
      break;
    case Page.CreateConfirmPasswordPage: 
      updateData = {
        subtitle: CREATE_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Next',
        middleAnchor: LOGIN_INSTEAD_TEXT,
        showLockFooter: true,
        onNext: () => this._setPageFromIndex(Page.CreateTermsPage),
        onBack: () => this._setPageFromIndex(Page.CreateEnterPasswordPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.ErrorPage)
      };
      break;
    case Page.CreateTermsPage:
      updateData = {
        subtitle: CREATE_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Create',
        middleAnchor: void 0,
        showLockFooter: true,
        onNext: () => this._setPageFromIndex(Page.ErrorPage),
        onBack: () => this._setPageFromIndex(Page.CreateConfirmPasswordPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.ErrorPage),
        hasOpenedPP: false,
        hasOpenedTOS: false
      };
      break;
    default:
      index = -1;
      updateData = {
        subtitle: 'An error occured',
        showBack: true,
        showNext: false,
        backText: 'Back',
        nextText: 'NOT_SHOWN',
        middleAnchor: void 0,
        showLockFooter: false,
        onNext: EMPTY_FUNCTION,
        onBack: () => this._setPageFromIndex(Page.DefaultPage),
        onMiddleAnchor: EMPTY_FUNCTION
      };
      break;
    }

    if (this.isComponentMounted) 
      this.setState({
        ...updateData,
        currentPage: index
      });
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
   * @returns {boolean} True if the next button should be enabled.
   */
  private async _determineNextEnable(): Promise<boolean> {
    let enableNext = true;
    switch (this.state.currentPage) {
    case Page.CreateEnterEmailPage: {
      const req = {
        body: {
          email: 'email'
        }
      };
      enableNext = false;
      console.log((await validators.isValidEmail(body('email')).run(req)).isEmpty());
      break;
    }
    case Page.CreateTermsPage:
      enableNext = this.state.hasOpenedPP && this.state.hasOpenedTOS;
      break;
    }
    return enableNext;
  }

  render() {
    const enableNext = this._determineNextEnable();
    return (
      <>
        <SmallContentBox subtitle={this.state.subtitle} footer={
          <>
            <div className='bottom-buttons mb-12 px-8'>
              {/* We use arrow functions in order to avoid having to bind every function */}
              <button className={'secondary-button ' + (this.state.showBack ? '' : 'hide')} onClick={() => this.state.onBack()}>{this.state.backText}</button>
              <div className={'center-link-wrapper ' + (this.state.middleAnchor ? '' : 'hide')}><a onClick={() => this.state.onMiddleAnchor()}>{this.state.middleAnchor}</a></div>
              <button className={'primary-button ' + (this.state.showNext ? '' : 'hide')} onClick={() => this.state.onNext()} disabled={!enableNext}>{this.state.nextText}</button>
            </div>
            {
              this.state.showLockFooter && <div className='auth-lock mx-auto mt-7 mb-5'>
                <div className='left'>
                  <img src='/icons/lock.png' alt='Lock Icon' />
                </div>
                <div className='right'>
                  <p>Ensure you are only submitting your credentials to <b>accounts.xpkg.net</b>. Do not login from suspicious links.</p>
                </div>
              </div>
            }
          </>
        }>
          <>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.ErrorPage, this.state.currentPage)}>
              <>
                <p className='explain-text'>Oh no! Something went very wrong. This page is not implemented, or you were not sent to the proper page.</p>
              </>
            </SmallContentBoxPage>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.DefaultPage, this.state.currentPage)}>
              <>
                <p className='explain-text'>Welcome to X-Pkg Accounts. This portal lets you manage all of your account details.</p>
                <button className='primary-button w-10/12 block mx-auto mt-6' onClick={() => this._setPageFromIndex(1)}>Create an account</button>
                <button className='secondary-button w-10/12 block mx-auto mt-6' onClick={() => this._setPageFromIndex(-1)}>Login</button>
              </>
            </SmallContentBoxPage>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateEnterEmailPage, this.state.currentPage)}>
              <>
                <p className='explain-text'>Let's get started! Enter your email address. This address will be the primary point of contact between you and X-Pkg.</p>
                <TextInput className='mt-4' inputType='email' name='email' label='Email Address' placeholder='you@example.com' />
              </>
            </SmallContentBoxPage>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateEnterNamePage, this.state.currentPage)}>
              <>
                <p className='explain-text'>Enter a unique name. It can contain spaces, and does not have to be your real name. This will be public.</p>
                <TextInput className='mt-4' inputType='text' name='text' label='Name' placeholder='John Doe' />
              </>
            </SmallContentBoxPage>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateEnterPasswordPage, this.state.currentPage)}>
              <>
                <p className='explain-text'>Type a secure and unique password.</p>
                <TextInput className='mt-4' inputType='password' name='password' label='Password' placeholder='P@ssw0rd!' />
              </>
            </SmallContentBoxPage>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateConfirmPasswordPage, this.state.currentPage)}>
              <>
                <p className='explain-text'>Retype your password.</p>
                <TextInput className='mt-4' inputType='password' name='confirmPassword' label='Password' placeholder='P@ssw0rd!' />
              </>
            </SmallContentBoxPage>
            <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateTermsPage, this.state.currentPage)}>
              <>
                <p className='explain-text'>By signing up for X-Pkg, you agree to the <a className={(this.state.hasOpenedTOS && 'clicked') || void 0} onClick={() => this.setState({ hasOpenedTOS: true } as Partial<AuthState>)} href='https://cataas.com/cat/gif' target='_blank'>terms of use</a> and <a className={(this.state.hasOpenedPP && 'clicked') || void 0} onClick={() => this.setState({ hasOpenedPP: true } as Partial<AuthState>)} href='https://cataas.com/cat/gif' target='_blank'>privacy policy</a>. Please read through both policies before creating an account.</p>
              </>
            </SmallContentBoxPage>
          </>
        </SmallContentBox>
      </>
    );
  }
}