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
 * @typedef {Object} PersonalInformationProps
 * @property {UserData} [userData] The user data provided by the page.
 */
type PersonalInformationProps = {
  userData?: UserData;
}

import { Component } from 'react';
import { UserData } from '../../pages/Account';
import '../../css/accountPages/PersonalInformationPage.scss';

export default class PersonalInformation extends Component<PersonalInformationProps> {
  constructor(props: PersonalInformationProps) {
    super(props);
    
  }

  render() {  
    return (
      <img src={this.props.userData!.profilePicture} alt="Profile Picture" />
    );
  }
}