/*
 * Copyright (c) 2022-2023. Arkin Solomon.
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
import { Version, VersionSelection } from '@xpkg/versioning';
import profaneWords from './profaneWords.js';

/**
 * Determine if a text has profanity.
 * 
 * @param {string} text The text to determine.
 * @return {boolean} True if the text is considered vulgar.
 */
export function isProfane(text: string): boolean {
  const parts = text.split(/[\s._]/);
  
  for (const part of parts) {
    if (profaneWords.includes(part.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a package identifier is valid.
 * 
 * @param {unknown} packageId The identifier to validate.
 * @returns {boolean} True if the identifier is valid.
 */
export function validateId(packageId: unknown): boolean {
  if (typeof packageId !== 'string')
    return false;

  // We declare this new variable otherwise TS complains saying packageId is unknown
  let pId = packageId;
  if (packageId.includes('/')) {
    const parts = packageId.split('/');
    const [repo] = parts;
    pId = parts[1] as string;
    if (!/^[a-z]{3,8}$/i.test(repo))
      return false;
  }

  if (pId.length > 32 || pId.length < 6)
    return false;

  return /^([a-z][a-z0-9_-]*\.)*[a-z][a-z0-9_-]*$/i.test(pId);
}

/**
 * Ensure that a provided value is an email.
 * 
 * @param {ValidationChain} chain The source of the value to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isValidEmail(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .isEmail().bail().withMessage('bad_email')
    .isLength({
      min: 5,
      max: 64
    }).bail().withMessage('bad_len')
    .toLowerCase();
}

/**
 * Ensure that a provided value can be a name.
 * 
 * @param {ValidationChain} chain The source of the value to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isValidName(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .custom(value => !isProfane(value)).bail().withMessage('profane_name')
    .custom(value => /^[a-z][a-z0-9\x20-.]+[a-z0-9]$/i.test(value)).withMessage('invalid_name');
}

/**
 * Ensure that a provided value is a valid password.
 * 
 * @param {ValidationChain} chain The source of the value to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isValidPassword(chain: ValidationChain): ValidationChain {
  return chain
    .notEmpty().withMessage('invalid_or_empty_str')
    .isLength({
      min: 8, 
      max: 64
    }).bail().withMessage('bad_len')
    .custom(value => value.toLowerCase() !== 'password').withMessage('is_password');
}

/**
 * Sanitize a full package identifier to ensure that it is valid and part of the X-Pkg repository, or validate a partial identifier.
 * 
 * @param {ValidationChain} chain The source of the identifier to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function asPartialXpkgPackageId(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .custom(value => validateId(value) && !value.startsWith('xpkg/')).bail().withMessage('invalid_id_or_repo')
    .customSanitizer(value => value.replace('xpkg/', ''));
}

/**
 * Ensure that the provided value is a partial package identifier.
 * 
 * @param {ValidationChain} chain The source of the identifier to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isPartialPackageId(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .custom(value => validateId(value) && !value.includes('/')).withMessage('full_id_or_invalid');
}

/**
 * Ensure that a description is valid. Also trim it. 
 * 
 * @param {ValidationChain} chain The source of the identifier to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function isValidDescription(chain: ValidationChain): ValidationChain {
  return chain
    .trim()
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .isLength({
      min: 10,
      max: 8192
    }).bail().withMessage('bad_desc_len')
    .custom(value => !isProfane(value)).withMessage('profane_desc');
}

/**
 * Transform a version string into a {@link Version} object. Invalidates if the provided string is not a valid version string. 
 * 
 * @param {ValidationChain} chain The source of the identifier to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function asVersion(chain: ValidationChain): ValidationChain {
  return chain
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .isLength({
      min: 1,
      max: 15
    }).bail().withMessage('bad_version_len')
    .custom(value => {
      const version = Version.fromString(value);
      if (!version)
        return false;
      (chain as ValidationChain & { __xpkgVersionCache: Version; }).__xpkgVersionCache = version;
      return true;
    })
    .bail().withMessage('invalid_version')
    .customSanitizer(() => {
      return (chain as ValidationChain & { __xpkgVersionCache: Version; }).__xpkgVersionCache;
    });
}

/**
 * Transform a version selection string into a {@link VersionSelection}.
 * 
 * @param {ValidationChain} chain The source of the identifier to validate.
 * @returns {ValidationChain} The validation chain provided to an Express route, or used for further modification.
 */
export function asVersionSelection(chain: ValidationChain): ValidationChain {
  return chain
    .notEmpty().bail().withMessage('invalid_or_empty_str')
    .isLength({
      min: 1,
      max: 256
    }).bail().withMessage('bad_sel_len')
    .custom(value => {
      const selection = new VersionSelection(value);
      if (!selection.isValid)
        return false;
      (chain as ValidationChain & { __xpkgSelectionCache: VersionSelection }).__xpkgSelectionCache = selection;
      return true;
    })
    .bail().withMessage('invalid_selection')
    .customSanitizer(() => (chain as ValidationChain & { __xpkgSelectionCache: VersionSelection }).__xpkgSelectionCache);
}