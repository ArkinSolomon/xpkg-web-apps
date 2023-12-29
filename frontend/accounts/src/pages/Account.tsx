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
import { Component, ReactNode } from 'react';
import LargeContentBox from '../components/LargeContentBox';
import '../css/Account.scss';
import SidebarItem from '../components/SidebarItem';
import PersonIcon from '../svgs/PersonIcon';
import DeveloperSettingsIcon from '../svgs/DeveloperSettingsIcon';
import OAuthClientIcon from '../svgs/OAuthClientIcon';
import SecuritySettingsIcon from '../svgs/SecuritySettingsIcon';
import NotificationsIcon from '../svgs/NotificationsIcon';

export default class extends Component {
  
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
          <SidebarItem icon={<PersonIcon />} label='Personal Information' onClick={() => { /**/ }} />
          <SidebarItem icon={<NotificationsIcon />} label='Notification Settings' onClick={() => { /**/ }} />
          <SidebarItem icon={<SecuritySettingsIcon />} label='Security Settings' onClick={() => { /**/ }} />
          <SidebarItem icon={<PersonIcon />} label='Your Data' onClick={() => { /**/ }}/>
          <SidebarItem icon={<DeveloperSettingsIcon />} label='Developer Settings' onClick={() => { /**/ }} />
          <SidebarItem icon={<OAuthClientIcon />} label='OAuth Clients' onClick={() => { /**/ }}/>
        </nav>
      </LargeContentBox>
    );
  }
}