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

import XpkgError from './xpkgError.js';

/**
 * An error which is thrown by the token database when a token with a given id does not exist.
 */
export default class NoSuchTokenError extends XpkgError {

  /**
   * Create a new error saying that no such token exists with the given id.
   * 
   * @param {string} tokenId The id of the token that was not found.
   */
  constructor(tokenId: string) {
    super(`No such token exists with an id of ${tokenId}`);
  }
}