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

/**
 * The different scopes that a token can have.
 * 
 * @name TokenScope
 * @enum {bigint}
 */
export const TokenScope = {
  
  // Proprietary service tokens
  Identity: 1n << 0n,
  DeveloperPortal: 1n << 1n,
  Forum: 1n << 2n,
  Store: 1n << 3n,
  Client: 1n << 4n,
  
  // Action
  PasswordReset: 1n << 8n,
  EmailVerification: 1n << 9n,
  EmailChange: 1n << 10n,

  // Registry scopes
  RegistryCreatePackage: 1n << 16n,
  RegistryUploadVersion: 1n << 17n,
  RegistryModifyPackageInfo: 1n << 18n,
  RegistryReadAuthorData: 1n << 19n,
  RegistryViewPackages: 1n << 20n,
  RegistryViewResources: 1n << 21n,
  RegistryModifyVersionData: 1n << 22n,
  RegistryViewAnalytics: 1n << 23n,
  RegistryViewBugReports: 1n << 24n,
  RegistryRespondBugReports: 1n << 25n,
  RegistryManageBugReports: 1n << 26n,

  // Identity service scopes
  IdentityViewAuthorEmail: 1n << 32n
};
Object.freeze(TokenScope);

// We use this to get around the fact that TypeScript enumerations do not support BigInts
export type TokenScope = typeof TokenScope[keyof typeof TokenScope];

/**
 * Decode a permissions number into its scopes.
 * 
 * @param {number} permissionsNumber The number which to decode.
 * @returns {TokenScope[]} The scopes from a permissions number.
 */
export function decodePermissionsNumber(permissionsNumber: TokenScope): TokenScope[] {
  const scopes: TokenScope[] = [];

  if ((permissionsNumber & TokenScope.Identity) > 0n) scopes.push(TokenScope.Identity);
  if ((permissionsNumber & TokenScope.DeveloperPortal) > 0n) scopes.push(TokenScope.DeveloperPortal);
  if ((permissionsNumber & TokenScope.Forum) > 0n) scopes.push(TokenScope.Forum);
  if ((permissionsNumber & TokenScope.Store) > 0n) scopes.push(TokenScope.Store);
  if ((permissionsNumber & TokenScope.Client) > 0n) scopes.push(TokenScope.Client);
  if ((permissionsNumber & TokenScope.PasswordReset) > 0n) scopes.push(TokenScope.PasswordReset);
  if ((permissionsNumber & TokenScope.EmailVerification) > 0n) scopes.push(TokenScope.EmailVerification);
  if ((permissionsNumber & TokenScope.EmailChange) > 0n) scopes.push(TokenScope.EmailChange);
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
 * Convert a set of scopes to a space-seperated string list.
 * 
 * @param {...TokenScope} scopes The token scopes to convert to a string.
 * @returns {string} A string representation of the scope list.
 * @throws {Error} An error is thrown if there is an invalid scope.
 */
export function toScopeStr(...scopes: TokenScope[]): string {
  const scopeStrs: string[] = [];
  for (const scope of scopes) {
    switch (scope) {
  Identity: 1n << 0n,
  DeveloperPortal: 1n << 1n,
  Forum: 1n << 2n,
  Store: 1n << 3n,
  Client: 1n << 4n,
  PasswordReset: 1n << 8n,
  EmailVerification: 1n << 9n,
  EmailChange: 1n << 10n,
  RegistryCreatePackage: 1n << 16n,
  RegistryUploadVersion: 1n << 17n,
  RegistryModifyPackageInfo: 1n << 18n,
  RegistryReadAuthorData: 1n << 19n,
  RegistryViewPackages: 1n << 20n,
  RegistryViewResources: 1n << 21n,
  RegistryModifyVersionData: 1n << 22n,
  RegistryViewAnalytics: 1n << 23n,
  RegistryViewBugReports: 1n << 24n,
  RegistryRespondBugReports: 1n << 25n,
  RegistryManageBugReports: 1n << 26n,

  // Identity service scopes
  IdentityViewAuthorEmail: 1n << 32n
    }
  }
  return scopeStrs.join(' ');
}

/**
 * Get the scope of a token from a string (case-sensitive).
 * 
 * @param {string} scopeStr The string of the token scope.
 * @returns {TokenScope|null} The scope/bigint representation of the scope, or null if the scope is invalid.
 */
export function parseScopeStr(scopeStr: string): TokenScope | null {
  switch (scopeStr) {
  case 'Identity': return TokenScope.Identity;
  case 'DeveloperPortal': return TokenScope.DeveloperPortal;
  case 'Forum': return TokenScope.Forum;
  case 'Store': return TokenScope.Store;
  case 'Client': return TokenScope.Client;
  case 'PasswordReset': return TokenScope.PasswordReset;
  case 'EmailVerification': return TokenScope.EmailVerification;
  case 'EmailChange': return TokenScope.EmailChange;
  case 'RegistryCreatePackage': return TokenScope.RegistryCreatePackage;
  case 'RegistryUploadVersion': return TokenScope.RegistryUploadVersion;
  case 'RegistryModifyPackageInfo': return TokenScope.RegistryModifyPackageInfo;
  case 'RegistryReadAuthorData': return TokenScope.RegistryReadAuthorData;
  case 'RegistryViewPackages': return TokenScope.RegistryViewPackages;
  case 'RegistryViewResources': return TokenScope.RegistryViewResources;
  case 'RegistryModifyVersionData': return TokenScope.RegistryModifyVersionData;
  case 'RegistryViewAnalytics': return TokenScope.RegistryViewAnalytics;
  case 'RegistryViewBugReports': return TokenScope.RegistryViewBugReports;
  case 'RegistryRespondBugReports': return TokenScope.RegistryRespondBugReports;
  case 'RegistryManageBugReports': return TokenScope.RegistryManageBugReports;
  case 'IdentityViewAuthorEmail': return TokenScope.IdentityViewAuthorEmail;
  default:
    return null;
  }
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