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

//These functions taken from w3schools (https://www.w3schools.com/js/js_cookies.asp)

/**
 * Set (or update) a cookie by name.
 * 
 * @param {string} cname The name of the cookie.
 * @param {string} cvalue The value of the cookie.
 * @param {number} exdays The number of days until the cookie expires.
 */
export function setCookie(cname: string, cvalue: string, exdays: number): void {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  const expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

/**
 * Get a cookie by name.
 * 
 * @param {string} cname The name of the cookie to get.
 * @returns {string|null} The value of the cookie, or null if it does not exist.
 */
export function getCookie(cname: string): string | null {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ')
      c = c.substring(1);
    if (c.indexOf(name) == 0)
      return c.substring(name.length, c.length);
  }
  return '';
}