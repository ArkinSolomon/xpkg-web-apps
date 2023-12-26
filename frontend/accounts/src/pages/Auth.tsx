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
  CurrentLoginPage = -2,
  ErrorPage = -1,
  DefaultPage = 0,
  CreateEnterEmailPage = 1,
  CreateEnterNamePage = 2,
  CreateEnterPasswordPage = 3,
  CreateConfirmPasswordPage = 4,
  CreateTermsPage = 5,
  CreatingAccountPage = 6,
  LoginEnterEmailPage = 7,
  LoginEnterPasswordPage = 8,
  LoggingInPage = 9
}

/**
 * The state of the auth page.
 * 
 * @typedef {Object} AuthState
 * @property {'light'|'dark'} theme The theme of the ReCaptcha.
 * @property {Page} currentPage The current page that we are on.
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
 * @property {boolean} tosChecked True if the terms of service agreement has been checked.
 * @property {boolean} ppChecked True if the privacy policy page agreement has been checked.
 * @property {boolean} enableNext True if the next button is enabled.
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
  tosChecked: boolean;
  ppChecked: boolean;
  enableNext: boolean;
};

/**
 * The data used when creating a user or logging in.
 * 
 * @typedef {Object} AuthData
 * @property {string} [email] The email address of the user that is creating thier account or logging in.
 * @property {string} [name] The name that the user would like for their account.
 * @property {string} [password] The password that the user enters to login, or when they are creating their account.
 * @property {string} [confirmPassword] The password that the user enters in order to confirm their password.
 */
type AuthData = {
  email?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
};

import '../css/Auth.scss';
import SmallContentBox from '../components/SmallContentBox';
import TextInput from '../components/TextInput';
import { ChangeEvent, Component } from 'react';
import { registerCallback, isSiteInDarkMode } from '../components/ThemeButton';
import SmallContentBoxPage, { getStateFromIndex } from '../components/SmallContentBoxPage';
import '../css/buttons.scss';
import { validators } from '@xpkg/validation';
import { body } from 'express-validator';
import Checkbox from '../components/Checkbox';
import axios from 'axios';
import { getCookie, setCookie } from '../scripts/cookies';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const EMPTY_FUNCTION = () => { };

const CREATE_SECTION_SUBTITLE = 'Create an account';
const LOGIN_INSTEAD_TEXT = 'Login instead';
const LOGIN_SECTION_SUBTITLE = 'Login';
const CREATE_INSTEAD_TEXT = 'Create an account';

export default class extends Component {

  state: AuthState;

  private _authData: AuthData = {};
  private _isComponentMounted = false;
  private _redirectUrl: string;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      theme: isSiteInDarkMode() ? 'dark' : 'light',
      currentPage: Page.DefaultPage,
      showLockFooter: true,
      showBack: true,
      showNext: true,
      backText: 'NOT_INIT',
      nextText: 'NOT_INIT',
      onBack: EMPTY_FUNCTION,
      onNext: EMPTY_FUNCTION,
      onMiddleAnchor: EMPTY_FUNCTION,
      tosChecked: false,
      ppChecked: false,
      enableNext: true,
    };

    const searchParams = new URLSearchParams(window.location.search);
    const nextText = searchParams.get('next')?.toLowerCase();
    if (nextText === 'authorize') {
      if (searchParams.has('client_id') && searchParams.has('scope') && searchParams.has('redirect_uri') && searchParams.has('response_type') && searchParams.has('code_challenge')) {
        const newSearchParams = new URLSearchParams();
        newSearchParams.append('client_id', searchParams.get('client_id')!);
        newSearchParams.append('scope', searchParams.get('scope')!);
        newSearchParams.append('redirect_uri', searchParams.get('redirect_uri')!);
        newSearchParams.append('response_type', searchParams.get('response_type')!);
        newSearchParams.append('code_challenge', searchParams.get('code_challenge')!);

        if (searchParams.has('state')) {
          newSearchParams.append('state', searchParams.get('state')!);
        }
        
        this._redirectUrl = '/authorize' + searchParams.toString();
        this.state.currentPage = Page.DefaultPage;
      } else {
        this._redirectUrl = '/account';
        this.state.currentPage = Page.ErrorPage;
      }
    } else {
      this._redirectUrl = '/account';
      this.state.currentPage = Page.DefaultPage;
    }

    const tokenCookie = getCookie('token');
    if (tokenCookie) {
      const expiry = new Date(parseInt(tokenCookie.slice(108), 16) * 1000);
      
      if (expiry.getTime() > Date.now()) {
        if (this.state.currentPage !== Page.ErrorPage) {
          this.state.currentPage = Page.CurrentLoginPage;
          this._checkForTokenValidity(tokenCookie);
        }
      }
    }
    
    this._setPageFromIndex(this.state.currentPage);

    registerCallback(v => {
      const theme = v ? 'dark' : 'light';
      
      if (this._isComponentMounted)
        this.setState({ theme } as Partial<AuthState>);
      else
        this.state.theme = theme;
    });

    this._determineNextEnable = this._determineNextEnable.bind(this);
    this._updateAuthData = this._updateAuthData.bind(this);
  }
  
  componentDidMount(): void {
    this._isComponentMounted = true;
  }

  componentWillUnmount(): void {
    this._isComponentMounted = false;
  }

  private async _checkForTokenValidity(token: string) {
    
    try {
      const data = await axios.post('http://localhost:4819/account/tokenvalidate', {}, {
        headers: {
          Authorization: token
        }
      });

      if (data.status === 204) {
        window.location.href = this._redirectUrl;
      }
    } catch (e) {
      console.error(e);
    } finally {
      this._setPageFromIndex(Page.DefaultPage);
    }
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
    case Page.CurrentLoginPage:
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
        onMiddleAnchor: () => this._setPageFromIndex(Page.LoginEnterEmailPage)
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
        onMiddleAnchor: () => this._setPageFromIndex(Page.LoginEnterEmailPage)
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
        onMiddleAnchor: () => this._setPageFromIndex(Page.LoginEnterEmailPage)
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
        onMiddleAnchor: () => this._setPageFromIndex(Page.LoginEnterEmailPage)
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
        onNext: () => {
          grecaptcha.ready(async () => {
            try {
              const recaptchaToken = grecaptcha.execute(window.SITE_KEY, { action: 'create' });
              const result = await axios.post('http://localhost:4819/account/create', {
                email: this._authData.email,
                name: this._authData.name,
                password: this._authData.password,
                validation: recaptchaToken
              }); 

              if (result.status !== 200) {
                throw 'Error: status ' + result.status;
              }

              setCookie('token', result.data.token, 1);
              window.location.href = this._redirectUrl;
            } catch (e) {
              console.error(e);
              this._setPageFromIndex(Page.ErrorPage);
            }
          });
          this._setPageFromIndex(Page.CreatingAccountPage);
        },
        onBack: () => this._setPageFromIndex(Page.CreateConfirmPasswordPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.LoginEnterEmailPage),
        ppChecked: false,
        tosChecked: false
      };
      break;
    case Page.CreatingAccountPage:
      updateData = {
        subtitle: CREATE_SECTION_SUBTITLE,
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
    case Page.LoginEnterEmailPage:
      updateData = {
        subtitle: LOGIN_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Next',
        middleAnchor: CREATE_INSTEAD_TEXT,
        showLockFooter: true,
        onNext: () => this._setPageFromIndex(Page.LoginEnterPasswordPage),
        onBack: () => this._setPageFromIndex(Page.DefaultPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.CreateEnterEmailPage),
      };
      break;
    case Page.LoginEnterPasswordPage:
      updateData = {
        subtitle: LOGIN_SECTION_SUBTITLE,
        showBack: true,
        showNext: true,
        backText: 'Back',
        nextText: 'Login',
        middleAnchor: CREATE_INSTEAD_TEXT,
        showLockFooter: true,
        onNext: () => {
          grecaptcha.ready(async () => {
            try {
              const recaptchaToken = grecaptcha.execute(window.SITE_KEY, { action: 'create' });
              const result = await axios.post('http://localhost:4819/account/login', {
                email: this._authData.email,
                password: this._authData.password,
                validation: recaptchaToken
              }); 

              if (result.status !== 200) {
                throw 'Error: status ' + result.status;
              }
              
              setCookie('token', result.data.token, 1);
              window.location.href = this._redirectUrl;
            } catch (e) {
              console.error(e);
              this._setPageFromIndex(Page.ErrorPage);
            }
          });
          this._setPageFromIndex(Page.LoggingInPage);
        },
        onBack: () => this._setPageFromIndex(Page.LoginEnterEmailPage),
        onMiddleAnchor: () => this._setPageFromIndex(Page.CreateEnterEmailPage),
      };
      break;
    case Page.LoggingInPage:
      updateData = {
        subtitle: LOGIN_SECTION_SUBTITLE,
        showBack: false,
        showNext: false,
        backText: 'NOT_SHOWN',
        nextText: 'NOT_SHOWN',
        middleAnchor: void 0,
        showLockFooter: true,
        onNext: EMPTY_FUNCTION,
        onBack: EMPTY_FUNCTION,
        onMiddleAnchor: EMPTY_FUNCTION,
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

    if (this._isComponentMounted) 
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
   */
  private async _determineNextEnable(): Promise<void> {
    let enableNext = true;
    const ghostReq = {
      body: this._authData
    };
    switch (this.state.currentPage) {
    case Page.CreateEnterEmailPage: 
    case Page.LoginEnterEmailPage:
      enableNext = (await validators.isValidEmail(body('email')).run(ghostReq)).isEmpty();
      break;
    case Page.CreateEnterNamePage:
      enableNext = (await validators.isValidName(body('name')).run(ghostReq)).isEmpty();
      break;
    case Page.CreateEnterPasswordPage:
    case Page.LoginEnterPasswordPage:
      enableNext = (await validators.isValidPassword(body('password')).run(ghostReq)).isEmpty();
      break;
    case Page.CreateConfirmPasswordPage:
      enableNext = this._authData.password === this._authData.confirmPassword;
      break;
    case Page.CreateTermsPage:
      enableNext = this.state.ppChecked && this.state.tosChecked;
      break;
    }

    if (enableNext == this.state.enableNext) {
      return;
    }
    
    this.setState({
      enableNext,
    } as Partial<AuthState>);
  }

  /**
   * Update the AuthData and check for validation.
   * 
   * @param {string} keyname The key of the AuthData that needs to be updated.
   * @returns {ChangeEvent<HTMLInputElement> => void} A new function that updates the authorization data and determines if the next button should be enabled.
   */
  private _updateAuthData(keyname: keyof AuthData): (e: ChangeEvent<HTMLInputElement>) => void {
    return (e: ChangeEvent<HTMLInputElement>) => {
      this._authData[keyname] = e.target.value;
      this._determineNextEnable();
    };
  }

  render() {
    this._determineNextEnable();
    return (
      <SmallContentBox subtitle={this.state.subtitle} footer={
        <>
          <div className='bottom-buttons mb-12 px-8'>
            {/* We use arrow functions in order to avoid having to bind every function to this page's instance */}
            <button className={'secondary-button ' + (this.state.showBack ? '' : 'hide')} onClick={() => this.state.onBack()}>{this.state.backText}</button>
            <div className={'center-link-wrapper ' + (this.state.middleAnchor ? '' : 'hide')}><a onClick={() => this.state.onMiddleAnchor()}>{this.state.middleAnchor}</a></div>
            <input className={'primary-button ' + (this.state.showNext ? '' : 'hide')} onClick={() => this.state.onNext()} type='submit' disabled={!this.state.enableNext} value={this.state.nextText} />
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
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CurrentLoginPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Checking your current session. Please wait...</p>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.ErrorPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Oh no! Something went very wrong. This page is not implemented, or you were not sent to the proper page.</p>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.DefaultPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Welcome to X-Pkg Accounts. This portal lets you manage all of your account details.</p>
              <button className='primary-button w-10/12 block mx-auto mt-6' onClick={() => this._setPageFromIndex(Page.CreateEnterEmailPage)}>Create an account</button>
              <button className='secondary-button w-10/12 block mx-auto mt-6' onClick={() => this._setPageFromIndex(Page.LoginEnterEmailPage)}>Login</button>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateEnterEmailPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Let's get started! Enter your email address. This address will be the primary point of contact between you and X-Pkg.</p>
              <TextInput className='mt-4' inputType='email' name='email' label='Email Address' placeholder='you@example.com' onChange={this._updateAuthData('email')} />
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateEnterNamePage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Enter a unique name. It can contain spaces, and does not have to be your real name. This will be public.</p>
              <TextInput className='mt-4' inputType='text' name='text' label='Name' placeholder='John Doe' onChange={this._updateAuthData('name')}/>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateEnterPasswordPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Type a secure and unique password.</p>
              <TextInput className='mt-4' inputType='password' name='password' label='Password' placeholder='P@ssw0rd!' onChange={this._updateAuthData('password')}/>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateConfirmPasswordPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Retype your password.</p>
              <TextInput className='mt-4' inputType='password' name='confirmPassword' label='Password' placeholder='P@ssw0rd!' onChange={this._updateAuthData('confirmPassword')}/>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CreateTermsPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>By signing up for X-Pkg, you agree to the terms of service and privacy policy. Please read through both documents before creating an account.</p>
              <Checkbox className='mt-4' checked={this.state.tosChecked} name={'tos-checkbox'} onChange={e => this.setState({
                tosChecked: e.target.checked
              } as Partial<AuthState>)}>
                <p className='explain-text'>I agree to the <a href='https://cataas.com/cat/gif' target='_blank'>terms of use</a>.</p>
              </Checkbox>
              <Checkbox className='mt-3' checked={this.state.ppChecked} name={'tos-checkbox'} onChange={e => this.setState({
                ppChecked: e.target.checked
              } as Partial<AuthState>)}>
                <p className='explain-text'>I agree to the <a href='https://cataas.com/cat/gif' target='_blank'>privacy policy</a>.</p>
              </Checkbox>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.CreatingAccountPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Creating your account...</p>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.LoginEnterEmailPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Welcome back to X-Pkg! Enter the email you used to sign up for your account.</p>
              <TextInput className='mt-4' inputType='email' name='email' label='Email Address' placeholder='you@example.com' onChange={this._updateAuthData('email')} />
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.LoginEnterPasswordPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Enter the password you used when you signed up for your account. <a href='https://cataas.com/cat/gif'>I forgot my password.</a></p>
              <TextInput className='mt-4' inputType='password' name='password' label='Password' placeholder='P@ssw0rd!' onChange={this._updateAuthData('password')}/>
            </>
          </SmallContentBoxPage>
          <SmallContentBoxPage pageState={getStateFromIndex(Page.LoggingInPage, this.state.currentPage)}>
            <>
              <p className='explain-text'>Logging into your account...</p>
            </>
          </SmallContentBoxPage>
        </>
      </SmallContentBox>
    );
  }
}