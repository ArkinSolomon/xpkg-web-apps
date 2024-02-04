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

import { Router } from 'express';
import * as packageDatabase from '../database/packageDatabase.js';
import { Version } from '@xpkg/versioning';
import { validators } from '@xpkg/validation';
import { logger } from '@xpkg/backend-util';
import { PackageData } from '../database/models/packageModel.js';
import { VersionData } from '../database/models/versionModel.js';
import { header, matchedData, param, validationResult } from 'express-validator';
import NoSuchPackageError from '../errors/noSuchPackageError.js';
import { TokenScope, getUserPersonalData, isTokenValidAny } from '@xpkg/auth-util';
import * as authorDatabase from '../database/authorDatabase.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';

const route = Router();

route.post('/init', validators.isValidTokenFormat(header('authorization')), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    req.logger.trace(`Authorization header validation failed with message: ${result.array()[0].msg}`);
    return res.sendStatus(401);
  }
  
  let author;
  const token = matchedData(req).authorization as string;
  try {
    const authorId = await isTokenValidAny(token, TokenScope.DeveloperPortal);
    if (!authorId) {
      req.logger.info('Insufficient permissions to retrieve author data');
      return res.sendStatus(401);
    }

    author = await authorDatabase.getAuthorDoc(authorId);
    req.logger.trace('Author already exists');
  } catch (e) {
    if (e instanceof NoSuchAccountError) 
      req.logger.info('Account not found, creating new account');
    else {
      logger.error(e);
      return res.sendStatus(500);
    }
  }

  try {
    const personalInfo = await getUserPersonalData(token);

    if (!personalInfo) {
      req.logger.info('User\'s token expired from checking to retrieving personal information');
      return res.sendStatus(401);
    }

    if (!author) {  
      await authorDatabase.createAuthor(personalInfo!);
      req.logger.info('Created new author successfully');
      return res.sendStatus(201);
    }

    if (author.authorName !== personalInfo.name || author.emailVerified !== personalInfo.emailVerified || author.authorEmail !== personalInfo.userEmail) {
      req.logger.info('Inconsistent data with identity service, updating personal information');
      await authorDatabase.updateAuthorInformation(author.authorId, personalInfo);
    }

    res.sendStatus(204);
  } catch (e) {
    logger.error(e);
    return res.sendStatus(500);
  }
});

route.get('/data', validators.isValidTokenFormat(header('authorization')), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    req.logger.trace(`Authorization header validation failed with message: ${result.array()[0].msg}`);
    return res.sendStatus(401);
  }

  const authorId = await isTokenValidAny(matchedData(req).authorization as string, TokenScope.DeveloperPortal, TokenScope.RegistryReadAuthorData);
  if (!authorId) {
    req.logger.info('Insufficient permissions to retrieve author data');
    return res.sendStatus(401);
  }

  const author = await authorDatabase.getAuthorDoc(authorId);
  return res
    .status(200)
    .json({
      id: author.authorId,
      name: author.authorName,  
      isVerified: author.emailVerified,
      usedStorage: author.usedStorage,
      totalStorage: author.totalStorage,
      isBanned: author.authorBanned,
      banReason: author.banReason ?? ''
    });
});

type OptionalAuthorInformationPackageData = Omit<Omit<PackageData, 'authorName'>, 'authorId'> & {
  authorId?: string;
  authorName?: string;
};
type VersionDataOptIdUploadDateAsObjOrStr = Omit<Omit<VersionData, 'packageId'>, 'uploadDate'> & {
  uploadDate: Date | string;
  packageId?: string;
};
type VersionDataNoIdUploadDateAsStr = Omit<Omit<VersionData, 'packageId'>, 'uploadDate'> & {
  uploadDate: string;
};
route.get('/packages', validators.isValidTokenFormat(header('authorization')), async (req, res) => {

  const authorId = await isTokenValidAny(matchedData(req).authorization as string, TokenScope.DeveloperPortal, TokenScope.RegistryViewPackages);
  if (!authorId) {
    req.logger.info('Insufficient permissions to retrieve author data');
    return res.sendStatus(401);
  }

  const data: (OptionalAuthorInformationPackageData & { versions: VersionDataNoIdUploadDateAsStr[]; })[] = [];
  try {
    const packages = await packageDatabase.getAuthorPackages(authorId) as OptionalAuthorInformationPackageData[];
    for (const pkg of packages) {
      const d = {
        ...pkg,
        versions: [] as VersionDataNoIdUploadDateAsStr[]
      };

      delete d.authorId;
      delete d.authorName;
      d.versions = (await packageDatabase.getVersionData(pkg.packageId))
        .map((v: VersionDataOptIdUploadDateAsObjOrStr) => {
          v.uploadDate = (v.uploadDate as Date).toISOString();
          delete v.packageId;
          return v as VersionDataNoIdUploadDateAsStr;
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.push(d);
    }

    req.logger.trace('Author retrieved their package data');
    res.json({ packages: data });
  } catch (e) {
    req.logger.error(e);
    return res.sendStatus(500);
  }
});

route.get('/packages/:packageId',
  validators.isPartialPackageId(param('packageId')),
  validators.isValidTokenFormat(header('authorization')),
  async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const mapped = result.mapped();
      if (Object.hasOwn(mapped, 'authorization')) {
        req.logger.info(`Authorization token format failed with message: ${mapped.authorization}`);
        return res.sendStatus(401);
      }
      
      const message = result.array()[0].msg;
      req.logger.info(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { packageId, authorization: token } = matchedData(req) as {
      packageId: string;
      authorization: string;
    };
    req.logger.setBindings({ packageId });
    req.logger.trace('Author requesting their package data');

    const authorId = await isTokenValidAny(token, TokenScope.DeveloperPortal, TokenScope.RegistryViewPackages);
    if (!authorId) {
      req.logger.info('Insufficient permissions to retrieve specific package information');
      return res.sendStatus(401);
    }

    try {
      const data: OptionalAuthorInformationPackageData & { versions: VersionDataNoIdUploadDateAsStr[]; } = {
        ...(await packageDatabase.getPackageData(packageId)),
        versions: []
      };

      if (data.authorId !== authorId) {
        logger.info('Author tried to retrieve data for a package that they do not own');
        return res.sendStatus(404);
      }

      delete data.authorId;
      delete data.authorName;

      data.versions = (await packageDatabase.getVersionData(packageId))
        .map((v: VersionDataOptIdUploadDateAsObjOrStr) => {
          v.uploadDate = (v.uploadDate as Date).toISOString();
          delete v.packageId;
          return v as VersionDataNoIdUploadDateAsStr;
        });

      req.logger.info('Author retrieved package information for package');
      res
        .status(200)
        .json(data);
    } catch (e) {
      if (e instanceof NoSuchPackageError) {
        req.logger.info(e, 'No such package');
        return res.sendStatus(404);
      }

      req.logger.error(e);
      res.sendStatus(500);
    }
  });

route.get('/packages/:packageId/:packageVersion',
  validators.isPartialPackageId(param('packageId')),
  validators.asVersion(param('packageVersion')),
  validators.isValidTokenFormat(header('authorization')),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const mapped = result.mapped();
      if (Object.hasOwn(mapped, 'authorization')) {
        req.logger.info(`Authorization token format failed with message: ${mapped.authorization}`);
        return res.sendStatus(401);
      }
      
      const message = result.array()[0].msg;
      req.logger.info(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { packageId, packageVersion, authorization: token } = matchedData(req) as {
      packageId: string;
      packageVersion: Version;
      authorization: string;
    };
    req.logger.setBindings({
      packageId,
      packageVersion: packageVersion.toString()
    });
    req.logger.info('Author is requesting information for a specific package version');

    const authorId = await isTokenValidAny(token, TokenScope.DeveloperPortal, TokenScope.RegistryViewPackages);
    if (!authorId) {
      req.logger.info('Insufficient permissions to retrieve specific package information');
      return res.sendStatus(401);
    }

    try {
      const packageData = await packageDatabase.getPackageData(packageId);

      if (packageData.authorId !== authorId) {
        logger.info('Author tried to retrieve data for a package version that they do not own');
        return res.sendStatus(404);
      }

      const versionData = await packageDatabase.getVersionData(packageId, packageVersion) as VersionDataOptIdUploadDateAsObjOrStr;
      versionData.uploadDate = (versionData.uploadDate as Date).toISOString();
      delete versionData.packageId;

      req.logger.info('Author retrieved package information for package');
      res.json({
        ...packageData,
        versionData: versionData as VersionDataNoIdUploadDateAsStr
      });
    } catch (e) {
      if (e instanceof NoSuchPackageError) {
        req.logger.info(e, 'No such package version');
        return res.sendStatus(404);
      }

      req.logger.error(e);
      res.sendStatus(500);
    }
  });

export default route;