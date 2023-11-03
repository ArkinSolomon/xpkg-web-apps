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
 * An enumeration which automatically sets 
 * 
 * @name PageState
 * @enum {number}
 */
export enum PageState {
  Before,
  Active,
  After
}

import '../css/SmallContentBoxPage.scss';

export default function (props: { pageState: PageState; children: React.JSX.Element }) {
  let stateClass: string;
  switch (props.pageState) {
  case PageState.Before:
    stateClass = 'before';
    break;
  case PageState.Active:
    stateClass = 'active';
    break;
  case PageState.After:
    stateClass = 'after';
    break;
  }
  
  return (
    <div className={'small-content-box-page ' + stateClass}>
      {props.children}
    </div>  
  );
}

/**
 * Get the page state of {@code target} based on {@code index}.
 * 
 * @param target The target index of the page.
 * @param index The current index of the page being displayed.
 * @returns {PageState} {@code PageState#Active} if {@code target} is the same as {@code index}. Otherwise, returns the proper state of {@code target}.
 */
export function getStateFromIndex(target: number, index: number): PageState { 
  if (target === index)
    return PageState.Active;
  return target < index ? PageState.Before : PageState.After;
}