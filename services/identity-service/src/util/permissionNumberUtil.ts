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

import { TokenScope } from '../database/models/tokenModel.js';

/**
 * Decode a permissions number into its scopes.
 * 
 * @param {number} permissionsNumber The number which to decode.
 * @returns {TokenScope[]} The scopes from a permissions number.
 */
export function decodePermissionsNumber(permissionsNumber: TokenScope): TokenScope[] {
  const scopes: TokenScope[] = [];

  if ((permissionsNumber & TokenScope.Identity) > 0n) scopes.push(TokenScope.Identity);
  if ((permissionsNumber & TokenScope.Registry) > 0n) scopes.push(TokenScope.Registry);
  if ((permissionsNumber & TokenScope.Forum) > 0n) scopes.push(TokenScope.Forum);
  if ((permissionsNumber & TokenScope.Store) > 0n) scopes.push(TokenScope.Store);
  if ((permissionsNumber & TokenScope.Client) > 0n) scopes.push(TokenScope.Client);
  if ((permissionsNumber & TokenScope.PasswordReset) > 0n) scopes.push(TokenScope.PasswordReset);
  if ((permissionsNumber & TokenScope.EmailVerification) > 0n) scopes.push(TokenScope.EmailVerification);
  if ((permissionsNumber & TokenScope.EmailChangeRevoke) > 0n) scopes.push(TokenScope.EmailChangeRevoke);
  if ((permissionsNumber & TokenScope.RegistryCreatePackage) > 0n) scopes.push(TokenScope.RegistryCreatePackage);
  if ((permissionsNumber & TokenScope.RegistryUploadVersion) > 0n) scopes.push(TokenScope.RegistryUploadVersion);
  if ((permissionsNumber & TokenScope.RegistryModifyPackageInfo) > 0n) scopes.push(TokenScope.RegistryModifyPackageInfo);
  if ((permissionsNumber & TokenScope.RegistryReadAuthorData) > 0n) scopes.push(TokenScope.RegistryReadAuthorData);
  if ((permissionsNumber & TokenScope.RegistryViewPackages) > 0n) scopes.push(TokenScope.RegistryViewPackages);
  if ((permissionsNumber & TokenScope.RegistryViewResources) > 0n) scopes.push(TokenScope.RegistryViewResources);
  if ((permissionsNumber & TokenScope.RegistryModifyVersionData) > 0n) scopes.push(TokenScope.RegistryModifyVersionData);
  if ((permissionsNumber & TokenScope.RegistryViewAnalytics) > 0n) scopes.push(TokenScope.RegistryViewAnalytics);
  if ((permissionsNumber & TokenScope.RegistryViewBugReports) > 0n) scopes.push(TokenScope.RegistryViewBugReports);
  if ((permissionsNumber & TokenScope.RegistryRespondBugReports) > 0n) scopes.push(TokenScope.RegistryRespondBugReports);
  if ((permissionsNumber & TokenScope.RegistryManageBugReports) > 0n) scopes.push(TokenScope.RegistryManageBugReports);
  if ((permissionsNumber & TokenScope.IdentityViewAuthorEmail) > 0n) scopes.push(TokenScope.IdentityViewAuthorEmail);

  return scopes;
}

/**
 * Use several scopes to create a permissions number.
 * 
 * @param {...TokenScope} scopes All of the scopes to create for the permissions number.
 * @returns {bigint} A permissions number which has permissions for the scopes.
 */
export function createPermissionsNumber(...scopes: TokenScope[]): TokenScope {
  return scopes.reduce((acc, scope) => acc | scope, 0n);
}

/**
 * Determine if a permissions number contains a token scope.
 * 
 * @param {bigint} permissionsNumber The permissions number to check.
 * @param {TokenScope} scope The scope to check for.
 * @returns {boolean} True if the number contains the specified scope.
 */
export function hasPermission(permissionsNumber: bigint, scope: TokenScope): boolean { 
  return (permissionsNumber & scope) > 0n;
}

/**
 * Determine if a permissions number contains any of the token scopes.
 * 
 * @param {bigint} permissionsNumber The permissions number to check.
 * @param {...TokenScope} scopes The scopes to check for.
 * @returns {boolean} True if the number contains any of the specified scopes.
 */
export function hasAnyPermission(permissionsNumber: bigint, ...scopes: TokenScope[]): boolean { 
  return (permissionsNumber & (scopes.reduce((p, c) => p | c))) > 0n;
}