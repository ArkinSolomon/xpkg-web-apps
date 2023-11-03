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
import React, { useState } from 'react';
import { getCookie, setCookie } from '../scripts/cookies';
import '../css/ThemeButton.scss';

const LIGHT_MODE_BUTTON = <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" strokeLinecap="square" strokeMiterlimit="10" viewBox="0 0 128 128"><clipPath id="a"><path d="M0 0h128v128H0V0z" /></clipPath><g fillRule="evenodd" clipPath="url(#a)"><path fill="#000000" fillOpacity="0" d="M0 0h128v128H0z" /><path fill="#0f0" d="m128 64-25.827 9.185v-18.37zm-18.75-45.256L97.486 43.503 84.497 30.514zM64 0l9.185 25.827h-18.37zM18.744 18.744l24.759 11.77-12.989 12.989zM0 64l25.827-9.185v18.37zm18.744 45.25 11.77-24.753 12.989 12.989zM64 128l-9.185-25.827h18.37zm45.25-18.75L84.497 97.486l12.989-12.989zM32 64c0-17.673 14.327-32 32-32 17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32-17.673 0-32-14.327-32-32z" className="theme-icon-color" /></g></svg>;
const DARK_MODE_BUTTON = <svg xmlns="http://www.w3.org/2000/svg"  xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" strokeLinecap="square" strokeMiterlimit="10" viewBox="0 0 128 128"><clipPath id="a"><path d="M0 0h128v128H0V0z" /></clipPath><g fillRule="evenodd" clipPath="url(#a)"><path fill="#000000" fillOpacity="0" d="M0 0h128v128H0z" /><path fill="#0f0" d="M100.444 115.394c-28.528 20.144-67.99 13.347-88.142-15.18C-7.85 71.685-1.06 32.23 27.467 12.086c-5.007 47.852 26.196 92.024 72.977 103.307z" className="theme-icon-color"/></g></svg>;

const callbacks: ((isDark: boolean) => void)[] = [];

export default function () {
  let isDarkByDefault = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (getCookie('theme')) {
    isDarkByDefault = getCookie('theme') == 'dark';
  }

  const [isDarkMode, setDarkMode] = useState(isDarkByDefault);

  let image: React.JSX.Element;
  if (isDarkMode) {
    document.getElementsByTagName('html')[0].classList.remove('theme--default');
    document.getElementsByTagName('html')[0].classList.add('theme--dark');
    setCookie('theme', 'dark', 365);
    image = LIGHT_MODE_BUTTON;
  } else {
    document.getElementsByTagName('html')[0].classList.remove('theme--dark');
    document.getElementsByTagName('html')[0].classList.add('theme--default');
    setCookie('theme', 'light', 365);
    image = DARK_MODE_BUTTON;
  }

  callbacks.forEach(cb => cb(isDarkMode));

  return (
    <button className='theme-button' onClick={() => {
      setDarkMode(!isDarkMode);
    }}>
      {image}
    </button>
  );
}

/**
 * Create a new callback to run whenever the theme updates.
 * 
 * @param {boolean => void} cb The callback to run.
 */
export function registerCallback(cb: (isDark: boolean) => void): void {
  callbacks.push(cb);
}

/**
 * Check if the site is currently in dark mode.
 * 
 * @returns {boolean} True if the site is set in dark mode.
 */
export function isSiteInDarkMode(): boolean {
  return getCookie('theme') == 'dark';
}