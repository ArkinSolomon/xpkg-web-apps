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
 * @property {ClientData[]} oauthClients The client data for OAuth clients that belong to this user.
 */
export type UserData = {
  userId: string;
  name: string;
  created: Date; 
  email: string;
  emailVerified: boolean;
  profilePicture: string;
  isDeveloper: boolean;
  nameChangeDate: Date;
  oauthClients: ClientData[];
};

/**
 * The data for a single OAuth client returned from the server. This is just coppied and pasted from the server.
 * 
 * @typedef {Object} ClientData
 * @property {string} clientId The id of the client.
 * @property {string} userId The id of the user that created the client.
 * @property {string} name The client name.
 * @property {string} description The description of the client.
 * @property {string} icon The location of the client icon.
 * @property {string[]} redirectURIs The possible URIs to which the client may redirect.
 * @property {bigint} permissionsNumber The permission number that this client MAY request.
 * @property {Date} created When the client was created.
 * @property {Date} secretRegenerated When the client secret was regenerated.
 * @property {number} quota The maximum amount of users this client is permitted to have.
 * @property {number} currentUsers The current amount of users this client has.
 * @property {Object} limits The limits on this account.
 * @property {number} clients The maximum number of OAuth clients this user can have.
 */
export type ClientData = {
  clientId: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  redirectURIs: string[];
  permissionsNumber: bigint;
  created: Date;
  secretRegenerated: Date;
  quota: number;
  currentUsers: number;
  limits: {
    clients: number;
  };
};

/**
 * The state of the Account page.
 * 
 * @typedef {Object} AccountState
 * @property {AccountPage} loadedPage The currently active page.
 * @property {string} pageTitle The title of the currently active page (human-readable).
 * @property {SwitchState} switchState What to do if a user navigates (disallow switching, ask first, or allow switching).
 * @property {string} [error] The error to display on the error page. Does not automatically show the page when set.
 * @property {ModalProps} [modal] The currently displayed modal. If it doesn't exist, no modal is being displayed. The action property of every button automatically removes the modal from the state.
 */
type AccountState = {
  loadedPage: AccountPage;
  pageTitle: string;
  switchState: SwitchState;
  error?: string;
  modal?: ModalProps;
};

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
import Error from '../components/accountPages/Error';
import Modal, { ModalProps } from '../components/Modal';
import { deconstructToken, identifiers, isTokenValid } from '@xpkg/auth-util';
import LogoutIcon from '../svgs/LogoutIcon';
import { cookies } from '@xpkg/frontend-util';

export default class extends Component<Record<string, never>, AccountState> {
  private _userData?: UserData;
  state: AccountState;

  private _isMounted = false;

  private _modalKey?: string;

  constructor(props: Record<string, never>) {
    super(props);
    
    this.state = {
      loadedPage: AccountPage.None,
      pageTitle: '',
      switchState: SwitchState.No
    };

    (async () => {
      try {
        const isLoginValid = await isTokenValid(cookies.getCookie('token'));
        if (!isLoginValid) 
          loginAgain();
        
      } catch (e) {
        console.error(e);
        this._setOrUpdateState({
          error: 'Could not connect to the server'
        });
        return this._changePage(AccountPage.Error);
      }

      try {
        const response = await axios.get(window.XIS_URL + '/account/userdata', {
          headers: {
            Authorization: cookies.getCookie('token')!
          }
        });

        const untransformedData: UserData | { created: string; nameChangeDate: string; } = response.data;
        untransformedData.created = new Date(untransformedData.created);
        untransformedData.nameChangeDate = new Date(untransformedData.nameChangeDate);
        this._userData = untransformedData as UserData;
        this._changePage(AccountPage.PersonalInformation);
      } catch (e) {
        console.error(e);
        this._setOrUpdateState({
          error: 'An unknown error occured'
        });
        return this._changePage(AccountPage.Error);
      }

      const [,, expiryDate] = deconstructToken(cookies.getCookie('token')!);
      const delay = expiryDate.valueOf() - Date.now();

      setTimeout(() => {
        this._modalKey = 'bye-bye';
        this._setOrUpdateState({ 
          modal: {
            title: 'Session expired',
            children: <p className='generic-modal-text'>You are being logged out for your account security. Please login again.</p>,
            buttons: [
              {
                text: 'Ok',
                action: loginAgain,
                style: 'primary',
                autoFocus: true
              }
            ]
          }
        });
        setTimeout(() => {
          loginAgain();
        }, 5500);
      }, delay);
    })();

    this._toggleSidebar = this._toggleSidebar.bind(this);
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  componentWillUnmount(): void {
    this._isMounted = false;
  }

  /**
   * Show or hide the sidebar depending on if it is currently hidden.
   */
  private _toggleSidebar() {
    document.getElementById('sidebar')!.classList.toggle('closed');
  }

  /**
   * Change the state manually before/after component mount, or automatically choose to update.
   * 
   * @param {Partial<AccountState>} newState The properties of the state to update.
   */
  private _setOrUpdateState(newState: Partial<AccountState>) {    
    if (!this._isMounted) 
      this.state = {
        ...this.state,
        ...newState
      };
    else 
      this.setState(newState as AccountState);
    
  }

  /**
   * Update the state in order to change the page.
   * 
   * @param {AccountPage} newPage The page to change to.
   */
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

    this._setOrUpdateState({
      loadedPage: newPage,
      ...pageUpdate
    } as Partial<AccountState>);
  }

  /**
   * Creates a function to handle changing to a new page. Automatically handles the current switch state.
   * 
   * @param {AccountPage} newPage The page to change to.
   * @returns {() => void} A function which will switch to the new page when executed. Binded to this instance.
   */
  private _createPageChangeFunction(newPage: AccountPage) {
    return (() => {
      if (this.state.loadedPage === newPage || this.state.switchState === SwitchState.No) 
        return;

      this._changePage(newPage);
    }).bind(this);
  }

  /**
   * Get a component to render the active page.
   * 
   * @returns {ReactNode} The node for the active page.
   */
  private _activePage() {
    switch (this.state.loadedPage) {
    case AccountPage.None:
      return <Loading />;
    case AccountPage.Error:
      return <Error error={ this.state.error ?? '<NO ERROR GIVEN>' } />;
    case AccountPage.PersonalInformation:
      return <PersonalInformation showModal={modal => {
        this._modalKey = identifiers.alphanumericNanoid(8);
        this.setState({ modal });
      }} userData={this._userData}
      />;
    default:
      return <p style={{ color: 'red', fontSize: '23pt', fontFamily: 'monospace' }}>PAGE NOT IMPLEMENTED</p>;
    }
  }
  
  render(): ReactNode {
    return (
      <>
        {this.state.modal &&
          <Modal title={this.state.modal!.title} key='account-modal' buttons={this.state.modal.buttons?.map(button => {
            const oldAction = button.action;
            const currentKey = this._modalKey!;

            button.action = () => {
              if (oldAction) 
                oldAction();
              
              if (this._modalKey === currentKey) 
                this.setState({ modal: void 0 });
              
            };
            return button;
          })}
          >
            {this.state.modal!.children}
          </Modal>
        }
        <LargeContentBox>
          <div id='account-wrapper'>
            <nav id='sidebar' className='closed'>
              <button id='sidebar-close' className='plus-sign' onClick={this._toggleSidebar} />
              <div id='title-wrapper'>
                <h1 className='main-title'><img src='/logos/main-logo.png' alt='X-Pkg Logo' />X-Pkg Accounts</h1>
              </div>
              <SidebarItem icon={<PersonIcon />} label='Personal Information' onClick={this._createPageChangeFunction(AccountPage.PersonalInformation)} active={this.state.loadedPage === AccountPage.PersonalInformation} />
              <SidebarItem icon={<NotificationsIcon />} label='Notification Settings' onClick={this._createPageChangeFunction(AccountPage.NotificationSettings)} active={this.state.loadedPage === AccountPage.NotificationSettings} />
              <SidebarItem icon={<SecuritySettingsIcon />} label='Security Settings' onClick={this._createPageChangeFunction(AccountPage.SecuritySettings)} active={this.state.loadedPage === AccountPage.SecuritySettings} />
              <SidebarItem icon={<YourDataIcon />} label='Your Data' onClick={this._createPageChangeFunction(AccountPage.YourData)} active={this.state.loadedPage === AccountPage.YourData} />
              {this._userData?.isDeveloper && 
            <>
              <hr />
              <SidebarItem icon={<DeveloperSettingsIcon />} label='Developer Settings' onClick={this._createPageChangeFunction(AccountPage.DeveloperSettings)} active={this.state.loadedPage === AccountPage.DeveloperSettings} />
              <SidebarItem icon={<OAuthClientIcon />} label='OAuth Clients' onClick={this._createPageChangeFunction(AccountPage.OAuthClients)} active={this.state.loadedPage === AccountPage.OAuthClients} />
            </>
              }
              <hr className='mt-auto' />
              <SidebarItem icon={<LogoutIcon />} label='Logout' onClick={loginAgain} active={this.state.loadedPage === AccountPage.OAuthClients} />
            </nav>
            <section id='page-view'>
              <header>
                {!!this.state.pageTitle.length && <button className='plus-sign' onClick={this._toggleSidebar} />}
                <h2>{ this.state.pageTitle }</h2>
              </header>
              <div className='p-3'>
                {this._activePage()}
              </div>
            </section>
          </div>
        </LargeContentBox>
      </>
    );
  }
}

/**
 * Redirect the user to login again.
 */
function loginAgain() {
  cookies.deleteCookie('token');
  window.location.href = '/authenticate?next=account';
}