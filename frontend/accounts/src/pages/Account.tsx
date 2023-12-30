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
 * The page which is currently loaded.
 * 
 * @name AccountPage
 * @enum {string}
 */
enum AccountPage {
  None,
  Error,
  PersonalInformation,
  NotificationSettings,
  SecuritySettings,
  YourData,
  DeveloperSettings,
  OAuthClients
}

/**
 * The state of if the pages can be switched or not.
 * 
 * @name SwitchState
 * @enum {string}
 */
enum SwitchState {
  Yes, 
  No,
  Ask
}

/**
 * The data retrieved from the server about this user.
 * 
 * @typedef {Object} UserData
 * @property {string} userId The user's id.
 * @property {string} name The public name of the user.
 * @property {Date} created When the user was created.
 * @property {string} email The email address of the user.
 * @property {boolean} emailVerified True if the user's email has been verified.
 * @property {string} profilePicture The profile picture of the user.
 * @property {boolean} isDeveloper True if the user is a developer.
 * @property {Date} nameChangeDate When the user last changed their name.
 */
export type UserData = {
  userId: string;
  name: string;
  created: Date; 
  email: string;
  emailVerified: string;
  profilePicture: string;
  isDeveloper: boolean;
  nameChangeDate: Date;
}

/**
 * The state of the Account page.
 * 
 * @typedef {Object} AccountState
 * @property {AccountPage} loadedPage The currently active page.
 * @property {string} pageTitle The title of the currently active page (human-readable).
 * @property {SwitchState} switchState What to do if a user navigates (disallow switching, ask first, or allow switching).
 * @property {string} [error] The error to display on the error page. Does not automatically show the page when set.
 */
type AccountState = {
  loadedPage: AccountPage;
  pageTitle: string;
  switchState: SwitchState;
  error?: string;
}

import { Component, ReactNode } from 'react';
import LargeContentBox from '../components/LargeContentBox';
import '../css/Account.scss';
import SidebarItem from '../components/SidebarItem';
import PersonIcon from '../svgs/PersonIcon';
import DeveloperSettingsIcon from '../svgs/DeveloperSettingsIcon';
import OAuthClientIcon from '../svgs/OAuthClientIcon';
import SecuritySettingsIcon from '../svgs/SecuritySettingsIcon';
import NotificationsIcon from '../svgs/NotificationsIcon';
import YourDataIcon from '../svgs/YourDataIcon';
import Loading from '../components/accountPages/Loading';
import PersonalInformation from '../components/accountPages/PersonalInformation';
import axios from 'axios';
import { getCookie } from '../scripts/cookies';
import tokenValidityChecker from '../scripts/tokenValidityChecker';
import Error from '../components/accountPages/Error';

export default class extends Component {
  private _userData?: UserData;
  state: AccountState;

  private _isMounted = false;

  constructor(props: Record<string, never>) {
    super(props);
    
    this.state = {
      loadedPage: AccountPage.None,
      pageTitle: '',
      switchState: SwitchState.No
    };

    (async () => {
      const isLoginValid = await tokenValidityChecker();
      if (isLoginValid !== 204) {
        window.location.href = '/authenticate?next=account';
      }

      const response =  await axios.get('http://localhost:4819/account/userdata', {
        headers: {
          Authorization: getCookie('token')!
        },
        validateStatus: () => true
      });

      if (response.status !== 200) {
        this._setOrUpdateState({
          error: 'An unknown error occured',
        });

        return this._changePage(AccountPage.Error);
      }
      
      const untransformedData: UserData | { created: string; nameChangeDate: string; } = response.data;
      untransformedData.created = new Date(untransformedData.created);
      untransformedData.nameChangeDate = new Date(untransformedData.nameChangeDate);
      this._userData = untransformedData as UserData;
      this._changePage(AccountPage.PersonalInformation);
    })();
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  componentWillUnmount(): void {
    this._isMounted = false;
  }

  private _setOrUpdateState(newState: Partial<AccountState>) {    
    if (!this._isMounted) {
      this.state = {
        ...this.state,
        ...newState
      };
    } else {
      this.setState(newState);
    }
  }

  private _changePage(newPage: AccountPage) {
    let pageUpdate: Pick<AccountState, 'pageTitle' | 'switchState'>;
    switch (newPage) {
    case AccountPage.None:
      pageUpdate = {
        pageTitle: '',
        switchState: SwitchState.No
      };
      break;
    case AccountPage.Error:
      pageUpdate = {
        pageTitle: 'An Error Occurred',
        switchState: SwitchState.No
      };
      break;
    case AccountPage.PersonalInformation:
      pageUpdate = {
        pageTitle: 'Personal Information',
        switchState: SwitchState.Yes
      };
      break;
    case AccountPage.NotificationSettings:
      pageUpdate = {
        pageTitle: 'Notification Settings',
        switchState: SwitchState.Yes
      };
      break;
    case AccountPage.SecuritySettings:
      pageUpdate = {
        pageTitle: 'Security Settings',
        switchState: SwitchState.Yes
      };
      break;
    case AccountPage.YourData:
      pageUpdate = {
        pageTitle: 'Your Data',
        switchState: SwitchState.Yes
      };
      break;
    case AccountPage.DeveloperSettings:
      pageUpdate = {
        pageTitle: 'Developer Settings',
        switchState: SwitchState.Yes
      };
      break;
    case AccountPage.OAuthClients:
      pageUpdate = {
        pageTitle: 'OAuth Clients',
        switchState: SwitchState.Yes
      };
      break;
    default:
      pageUpdate = {
        pageTitle: '<NO PAGE TITLE>',
        switchState: SwitchState.Yes
      };
    }

    this.setState({
      loadedPage: newPage,
      ...pageUpdate
    } as Partial<AccountState>);
  }

  private _createPageChangeFunction(newPage: AccountPage) {
    return (() => {
      if (this.state.loadedPage === newPage || this.state.switchState === SwitchState.No) {
        return;
      }

      this._changePage(newPage);
    }).bind(this);
  }

  private _activePage() {
    switch (this.state.loadedPage) {
    case AccountPage.None:
      return <Loading />;
    case AccountPage.Error:
      return <Error error={ this.state.error ?? '<NO ERROR GIVEN>' } />;
    case AccountPage.PersonalInformation:
      return <PersonalInformation userData={this._userData} />;
    default:
      return <p style={{color: 'red', fontSize: '23pt', fontFamily: 'monospace'}}>PAGE NOT IMPLEMENTED</p>;
    }
  }
  
  render(): ReactNode {
    return (
      <LargeContentBox>
        <div id="account-wrapper">
          <nav id='sidebar'>
            <div id="title-wrapper">
              <h1 className='main-title'>
                <img src="/logos/main-logo.png" alt="X-Pkg Logo" />
            X-Pkg Accounts
              </h1>
            </div>
            <SidebarItem icon={<PersonIcon />} label='Personal Information' onClick={this._createPageChangeFunction(AccountPage.PersonalInformation)} active={this.state.loadedPage === AccountPage.PersonalInformation} />
            <SidebarItem icon={<NotificationsIcon />} label='Notification Settings' onClick={this._createPageChangeFunction(AccountPage.NotificationSettings)} active={this.state.loadedPage === AccountPage.NotificationSettings}/>
            <SidebarItem icon={<SecuritySettingsIcon />} label='Security Settings' onClick={this._createPageChangeFunction(AccountPage.SecuritySettings)} active={this.state.loadedPage === AccountPage.SecuritySettings}/>
            <SidebarItem icon={<YourDataIcon />} label='Your Data' onClick={this._createPageChangeFunction(AccountPage.YourData)} active={this.state.loadedPage === AccountPage.YourData}/>
            {this._userData?.isDeveloper && 
            <>
              <hr />
              <SidebarItem icon={<DeveloperSettingsIcon />} label='Developer Settings' onClick={this._createPageChangeFunction(AccountPage.DeveloperSettings)}active={this.state.loadedPage === AccountPage.DeveloperSettings} />
              <SidebarItem icon={<OAuthClientIcon />} label='OAuth Clients' onClick={this._createPageChangeFunction(AccountPage.OAuthClients)} active={this.state.loadedPage === AccountPage.OAuthClients}/>
            </>
            }
          </nav>
          <section id='page-view'>
            <header>
              <h2>{ this.state.pageTitle }</h2>
            </header>
            <div className="p-3">
              {this._activePage()}
            </div>
          </section>
        </div>
      </LargeContentBox>
    );
  }
}