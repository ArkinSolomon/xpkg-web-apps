/*
 * Copyright (c) 2023-2024. Arkin Solomon.
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
import { ValidationChain } from 'express-validator';
import { TokenScope } from '../database/models/tokenModel.js';
import { createPermissionsNumber } from './permissionNumberUtil.js';

/**
 * Ensure that a provided value is a valid client id for OAuth.
 * 
 * @param {ValidationChain} chain The source of the value to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isValidClientId(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .isLength({ min: 56, max: 56 }).withMessage('invalid_client_id');
}

/**
 * Ensure that a provided value is a valid scope for OAuth.
 * 
 * @param {ValidationChain} chain The source of the value to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isValidOAuthScope(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .custom((scopes: string) => {
      const scopeNumbers: TokenScope[] = [];
      const scopeArr = scopes.split(' ');

      for (const i in scopeArr) 
        if (scopeArr.indexOf(scopeArr[i]) !== ~~i) 
          return false;

      for (const scope of scopeArr) {
        if (!/^[a-z]+$/i.test(scope)) 
          return false;

        if (scope === 'Identity') 
          return false;

        if (!Object.hasOwn(TokenScope, scope)) 
          return false;

        scopeNumbers.push(TokenScope[scope as keyof typeof TokenScope]);
      }

      (chain as ValidationChain & { __xpkgScopeNumCache: TokenScope[]; }).__xpkgScopeNumCache = scopeNumbers;
    }).bail().withMessage('bad_scope')
    .customSanitizer(() => createPermissionsNumber(...(chain as ValidationChain & { __xpkgScopeNumCache: TokenScope[]; }).__xpkgScopeNumCache));
}