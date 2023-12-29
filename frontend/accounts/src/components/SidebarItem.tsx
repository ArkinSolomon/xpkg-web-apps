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
import { JSX, ReactElement } from 'react';
import '../css/SidebarItem.scss';

export default function ({ icon, label, onClick }: { icon: ReactElement; label: string; onClick: () => void; }): JSX.Element {
  return (
    <a className='sidebar-item' onClick={onClick}>
      <div className='sidebar-icon'>{icon}</div>
      <span className='sidebar-item-label'>{label}</span>
    </a>
  );
}