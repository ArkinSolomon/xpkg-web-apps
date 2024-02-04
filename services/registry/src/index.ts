/*
 * Copyright (c) 2022-2024. Arkin Solomon.
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
 * The full registry data sent when requesting `/packages`.
 * 
 * @typedef {Object} FullRegistryData
 * @property {string} generated The ISO string of when the data was generated.
 * @property {Object[]} packages The packages with all of its data on the registry.
 * @property {string} packages.packageId The identifier of the package.
 * @property {string} packages.packageName The name of the package.
 * @property {string} packages.authorId The identifier of the author.
 * @property {string} packages.authorName The name of the author.
 * @property {string} packages.description The description of the package.
 * @property {PackageType} packages.packageType The type of the package.
 * @property {Object[]} packages.versions All of the versions of the package.
 * @property {string} packages.versions.version The version string of the package version.
 * @property {[string, string][]} packages.versions.dependencies All of the dependencies of the package.
 * @property {[string, string][]} packages.versions.incompatibilities All of the incompatibilities of the package.
 * @property {string} packages.versions.xplaneSelection The X-Plane selection string of the version.
 * @property {PlatformSupport} packages.versions.platforms The platforms that the version supports.
 */
type FullRegistryData = {
  generated: string;
  packages: {
    packageId: string;
    packageName: string;
    authorId: string;
    authorName: string;
    description: string;
    packageType: PackageType;
    versions: {
      version: string;
      dependencies: [string, string][];
      incompatibilities: [string, string][];
      xplaneSelection: string;
      platforms: PlatformSupport;
    }[];
  }[];
};

import dotenv from 'dotenv';
dotenv.config();

import Express from 'express';
import fs from 'fs/promises';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { logger, atlasConnect, expressLogger } from '@xpkg/backend-util';
import { unzippedFilesLocation, xpkgFilesLocation } from './routes/packages.js';
import { customAlphabet } from 'nanoid';

if (!process.env.NODE_ENV) {
  logger.fatal('NODE_ENV not defined');
  process.exit(1);
}

const alphaNumericNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
const SERVER_ID = process.env.SERVER_ID ?? `registry-${process.env.NODE_ENV}-${alphaNumericNanoid(32)}`;
const serverIdHash = hasha(SERVER_ID, { encoding: 'hex', algorithm: 'sha1' });

logger.info({
  NODE_ENV: process.env.NODE_ENV,
  serverId: SERVER_ID,
  serverIdHash
}, 'X-Pkg Registry initializing...');

process.on('unhandledRejection', err => {
  logger.error(err, 'Unhandled rejection');
});

process.on('uncaughtException', err => {
  logger.error(err, 'Uncaught exception');
});

logger.trace('Cleaning up leftover files from last run');
await Promise.all([
  atlasConnect(),
  fs.rm(unzippedFilesLocation, { recursive: true, force: true }),
  fs.rm(xpkgFilesLocation, { recursive: true, force: true })
]);
await Promise.all([
  fs.mkdir(unzippedFilesLocation, { recursive: true }),
  fs.mkdir(xpkgFilesLocation, { recursive: true })
]);
logger.trace('Done cleaning up files');

const app = Express();
app.use(bodyParser.json());
app.use(cors());

app.use(function (_, res, next) {
  res.setHeader('X-Powered-By', 'Express, X-Pkg contributors, and you :)');
  next();
});

let currentRequest = 0;
const maxRequest = 9999;
app.use(expressLogger(() => {
  if (currentRequest >= maxRequest)
    currentRequest = 0;

  const requestId = serverIdHash + Date.now().toString(16) + currentRequest.toString().padStart(4, '0') + alphaNumericNanoid(8);
  ++currentRequest;
  return requestId;
}));

const storeFile = path.resolve('./data.json');

import packages from './routes/packages.js';
import analytics from './routes/analytics.js';
import account from './routes/account.js';

import * as packageDatabase from './database/packageDatabase.js';
import { PackageType } from './database/models/packageModel.js';
import { PlatformSupport } from './database/models/versionModel.js';
import hasha from 'hasha';

app.use('/account', account);
app.use('/analytics', analytics);
app.use('/packages', packages);

app.get('/meta', (_, res) => {
  res
    .status(200)
    .json({
      name: 'X-Pkg',
      identifier: 'xpkg',
      description: 'X-Pkg\'s official repository.'
    });
});

/**
 * Update the JSON file which is storing all of the data.
 * 
 * @async
 * @returns {Promise<void>} A promise which resolves when the operation completes.
 */
async function updateData(): Promise<void> {
  logger.trace('Updating package data');
  const startTime = Date.now();
  const data: FullRegistryData = {
    generated: '',
    packages: []
  };

  const allPkgMap = new Map<string, FullRegistryData['packages'][0]>();
  const pkgsWithVersionsMap = new Map<string, FullRegistryData['packages'][0]>();
  const allPackageData = await packageDatabase.getPackageData();
  for (const pkg of allPackageData) 
    allPkgMap.set(pkg.packageId, {
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      authorId: pkg.authorId,
      authorName: pkg.authorName,
      description: pkg.description,
      packageType: pkg.packageType,
      versions: []
    });

  const allVersions = await packageDatabase.allPublicProcessedVersions();
  for (const version of allVersions) {
    if (!allPkgMap.has(version.packageId))
      continue;

    const packageData = allPkgMap.get(version.packageId)!;

    packageData.versions.push({
      version: version.packageVersion,
      dependencies: version.dependencies,
      incompatibilities: version.incompatibilities,
      xplaneSelection: version.xpSelection,
      platforms: version.platforms
    });
    pkgsWithVersionsMap.set(version.packageId, packageData);
  }

  data.packages = Array.from(pkgsWithVersionsMap.values());

  data.generated = new Date().toISOString();
  await fs.writeFile(storeFile, JSON.stringify(data), 'utf-8');
  const timeTaken = Date.now() - startTime;
  logger.trace(`Package data updated, ${data.packages.length || 'no'} package${data.packages.length == 1 ? '' : 's'}, took ${timeTaken}ms`);
}

await updateData();
const updateInterval = 60 * 1000;
setInterval(updateData, updateInterval);
logger.info(`Package data updating every ${updateInterval}ms`);

app.use('*', (_, res) => res.sendStatus(404));

const port = process.env.PORT || 443;
app.listen(port, () => {
  logger.info(`Server started, listening on port ${port}`);
});