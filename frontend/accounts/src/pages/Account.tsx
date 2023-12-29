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
  PersonalInformation,
  NotificationSettings,
  SecuritySettings,
  YourData,
  DeveloperSettings,
  OAuthClients
}

/**
 * The data retrieved from the server about this user.
 * 
 * @typedef {Object} UserData
 * @property {string} name The public name of the user.
 * @property {string} email The email address of the user.
 * @property {string} userId The user's id.
 * @property {boolean} isDeveloper True if the user is a developer.
 */
type UserData = {
  name: string;
  email: string;
  userId: string;
  isDeveloper: boolean;
}

/**
 * The state of the Account page.
 * 
 * @typedef {Object} AccountState
 * @property {AccountPage} loadedPage The currently active page.
 * @property {string} pageTitle The title of the currently active page (human-readable).
 */
type AccountState = {
  loadedPage: AccountPage;
  pageTitle: string;
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

export default class extends Component {
  private _userData?: UserData;
  state: AccountState;

  constructor(props: Record<string, never>) {
    super(props);
    
    this.state = {
      loadedPage: AccountPage.None,
      pageTitle: ''
    };
  }

  private _changePage(newPage: AccountPage) {
    return (() => {
      let pageTitle: string;
      switch (newPage) {
      case AccountPage.None:
        pageTitle = '';
        break;
      case AccountPage.PersonalInformation:
        pageTitle = 'Personal Information';
        break;
      case AccountPage.NotificationSettings:
        pageTitle = 'Notification Settings';
        break;
      case AccountPage.SecuritySettings:
        pageTitle = 'Security Settings';
        break;
      case AccountPage.YourData:
        pageTitle = 'Your Data';
        break;
      case AccountPage.DeveloperSettings:
        pageTitle = 'Developer Settings';
        break;
      case AccountPage.OAuthClients:
        pageTitle = 'OAuth Clients';
        break;
      default:
        pageTitle = '<NO PAGE TITLE>';
      }

      this.setState({
        loadedPage: newPage,
        pageTitle
      } as Partial<AccountState>);
    }).bind(this);
  }

  private _activePage() {
    switch (this.state.loadedPage) {
    case AccountPage.None:
      return <Loading />;
    default:
      return <p style={{color: 'red', fontSize: '23pt', fontFamily: 'monospace'}}>PAGE NOT IMPLEMENTED</p>;
    }
  }
  
  render(): ReactNode {
    return (
      <LargeContentBox>
        <nav id='sidebar'>
          <div id="title-wrapper">
            <h1 className='main-title'>
              <img src="/logos/main-logo.png" alt="X-Pkg Logo" />
            X-Pkg Accounts
            </h1>
          </div>
          <SidebarItem icon={<PersonIcon />} label='Personal Information' onClick={this._changePage(AccountPage.PersonalInformation)} active={this.state.loadedPage === AccountPage.PersonalInformation} />
          <SidebarItem icon={<NotificationsIcon />} label='Notification Settings' onClick={this._changePage(AccountPage.NotificationSettings)} active={this.state.loadedPage === AccountPage.NotificationSettings}/>
          <SidebarItem icon={<SecuritySettingsIcon />} label='Security Settings' onClick={this._changePage(AccountPage.SecuritySettings)} active={this.state.loadedPage === AccountPage.SecuritySettings}/>
          <SidebarItem icon={<YourDataIcon />} label='Your Data' onClick={this._changePage(AccountPage.YourData)} active={this.state.loadedPage === AccountPage.YourData}/>
          {this._userData?.isDeveloper && 
            <>
              <hr />
              <SidebarItem icon={<DeveloperSettingsIcon />} label='Developer Settings' onClick={this._changePage(AccountPage.DeveloperSettings)}active={this.state.loadedPage === AccountPage.DeveloperSettings} />
              <SidebarItem icon={<OAuthClientIcon />} label='OAuth Clients' onClick={this._changePage(AccountPage.OAuthClients)} active={this.state.loadedPage === AccountPage.OAuthClients}/>
            </>
          }
        </nav>
        <section id='page-view'>
          <header>
            <h2>{ this.state.pageTitle }</h2>
          </header>
          {this._activePage()}
        </section>
      </LargeContentBox>
    );
  }
}