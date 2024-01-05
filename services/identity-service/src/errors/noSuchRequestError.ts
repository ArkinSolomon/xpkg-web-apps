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
 * An error which is thrown by the a database when a (generic) request does not exist.
 */
export default class NoSuchRequestError extends XpkgError {

  /**
   * Create a new error saying a request does not exist with the given id.
   * 
   * @param {string} requestId The value of the key that the author was looked up by.
   */
  constructor(requestId: string) {
    super(`Request does not exist with the id: ${requestId}`);
  }
}