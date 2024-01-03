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

import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { Version, VersionSelection } from '@xpkg/versioning';
import { logger } from '@xpkg/backend-util';
import { validators } from '@xpkg/validation';
import * as customValidators from '../util/customValidators.js';
import * as packageDatabase from '../database/packageDatabase.js';
import * as analyticsDatabase from '../database/analyticsDatabase.js';
import { FileProcessorData } from '../workers/fileProcessor.js';
import { Worker } from 'worker_threads';
import { rm } from 'fs/promises';
import { customAlphabet } from 'nanoid';
import { isMainThread } from 'worker_threads';
import NoSuchPackageError from '../errors/noSuchPackageError.js';
import { PackageType } from '../database/models/packageModel.js';
import { VersionStatus } from '../database/models/versionModel.js';
import AuthToken from '../auth/authToken.js';
import InvalidListError from '../errors/invalidListError.js';
import { body, matchedData, param, validationResult } from 'express-validator';
import { AuthorizableRequest } from '../auth/authorizeRoute.js';

const storeFile = path.resolve('./data.json');
const route = Router();

const UPLOAD_PATH = path.resolve(os.tmpdir(), 'xpkg-downloads');

if (isMainThread) 
  if (fs.existsSync(UPLOAD_PATH))
    await rm(UPLOAD_PATH, { recursive: true, force: true });

const upload = multer({ dest: UPLOAD_PATH });

const FILE_PROCESSOR_WORKER_PATH = path.resolve('.', 'dist', 'workers', 'fileProcessor.js');

export const unzippedFilesLocation = path.join(os.tmpdir(), 'xpkg', 'unzipped');
export const xpkgFilesLocation = path.join(os.tmpdir(), 'xpkg', 'xpkg-files');

const privateKeyNanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

route.get('/', (_, res) => {
  res.sendFile(storeFile);
});

route.get('/info/:packageId/:packageVersion',
  validators.isPartialPackageId(param('packageId')),
  validators.asVersion(param('packageVersion')),
  body('privateKey').trim().notEmpty().optional(),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res.sendStatus(400);

    const { packageId, packageVersion, privateKey } = matchedData(req) as {
      packageVersion: Version;
      packageId: string;
      privateKey?: string;
    };

    try {
      const versionData = await packageDatabase.getVersionData(packageId, packageVersion);
      if ((versionData.isPublic || privateKey === versionData.privateKey) && versionData.status === VersionStatus.Processed) {
        await analyticsDatabase.incrementDownloadCount(packageId, packageVersion);
        return res
          .status(200)
          .json({
            loc: versionData.loc,
            hash: versionData.hash,
            dependencies: versionData.dependencies,
            incompatibilities: versionData.incompatibilities
          });
      }
      res.sendStatus(404);
    } catch (e) {
      if (e instanceof NoSuchPackageError)
        return res.sendStatus(404);
      logger.error(e);
    }
  });

route.patch('/description',
  validators.asPartialXpkgPackageId(body('packageId')),
  validators.isValidDescription(body('newDescription')),
  async (req: AuthorizableRequest, res) => {
    const token = req.user!;

    const routeLogger = logger.child({
      ip: req.ip,
      route: '/packages/description',
      authorId: token.authorId,
      requestId: req.id
    });
    routeLogger.trace('Author wants to update package description');

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.trace(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { newDescription, packageId } = matchedData(req) as {
      newDescription: string;
      packageId: string;
    };

    try {
      routeLogger.setBindings({ packageId });

      if (!token.canUpdatePackageDescription(packageId)) {
        routeLogger.trace('Insufficient permissions to update package description');
        return res.sendStatus(401);
      }

      const author = await token.getAuthor();

      // We want to make sure they're updating the description for a package that they own
      if (!(await packageDatabase.doesAuthorHavePackage(token.authorId, packageId))) {
        routeLogger.trace('Author does not own package');
        return res.sendStatus(403);
      }

      await packageDatabase.updateDescription(packageId, newDescription);
      res.sendStatus(204);

      const { packageName } = await packageDatabase.getPackageData(packageId);
      author.sendEmail(`X-Pkg: '${packageName}' Description updated`, `The description has been updated for the package '${packageName}' (${packageId}).`);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

route.post('/new',
  validators.isPartialPackageId(body('packageId')),
  validators.isValidName(body('packageName')),
  validators.isValidDescription(body('description')),
  customValidators.asPackageType(body('packageType')),
  async (req: AuthorizableRequest, res) => {
    const token = req.user!;
    const routeLogger = logger.child({
      ip: req.ip,
      authorId: token.authorId,
      route: '/packages/new'
    });
    routeLogger.trace('New package requested, will validate fields');

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.info(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { packageName, packageId, description, packageType } = matchedData(req) as {
      packageName: string;
      packageId: string;
      description: string;
      packageType: PackageType;
    };

    try {
      const [packageIdExists, packageNameExists] = await Promise.all([
        packageDatabase.packageIdExists(packageId),
        packageDatabase.packageNameExists(packageName)
      ]);

      if (packageIdExists) {
        routeLogger.trace('Package id already in use (id_in_use)');
        return res
          .status(400)
          .send('id_in_use');
      }
      else if (packageNameExists) {
        routeLogger.trace('Package name already in use (name_in_use)');
        return res
          .status(400)
          .send('name_in_use');
      }

      await packageDatabase.addPackage(packageId, packageName, token.authorId, (await token.getAuthor()).authorName, description, packageType);
      routeLogger.trace('Registered new package in database');
      res.sendStatus(204);
    } catch (e) {
      routeLogger.error(e);
      return res.sendStatus(500);
    }
  });

route.post('/upload',
  upload.single('file'),
  validators.asPartialXpkgPackageId(body('packageId')),
  validators.asVersion(body('packageVersion')),
  validators.asVersionSelection(body('xpSelection')),
  body('isPublic').isBoolean().withMessage('not_bool'),
  body('isPrivate').isBoolean().withMessage('not_bool'),
  body('isStored').isBoolean().withMessage('not_bool'),
  body('dependencies')
    .trim().notEmpty().withMessage('dep_not_str')
    .customSanitizer(v => JSON.parse(v)).isArray({
      min: 0,
      max: 128
    }).withMessage('bad_dep_arr'),
  body('incompatibilities')
    .trim().notEmpty().withMessage('inc_not_str')
    .customSanitizer(v => JSON.parse(v)).isArray({
      min: 0,
      max: 128
    }).withMessage('bad_inc_arr'),
  body('supportsMacOS').isBoolean().withMessage('not_bool'),
  body('supportsWindows').isBoolean().withMessage('not_bool'),
  body('supportsLinux').isBoolean().withMessage('not_bool'),
  async (req: AuthorizableRequest, res) => {
    const file = req.file;
    const token = req.user!;

    const routeLogger = logger.child({
      ip: req.ip,
      authorId: token.authorId,
      route: '/packages/upload',
      id: req.id
    });
    routeLogger.trace('New version upload request, will validate fields');

    const fileDeleteCb = async () => {
      if (file) {
        routeLogger.trace('Forcefully deleting downloaded file on finish');
        await rm(file.path, { force: true });
      } else
        routeLogger.trace('Will not forcefully delete downloaded file');
    };
    res.once('finish', fileDeleteCb);

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.info(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const data = matchedData(req) as {
      packageId: string;
      packageVersion: Version;
      xpSelection: VersionSelection;
      isPublic: boolean;
      isPrivate: boolean;
      isStored: boolean;
      dependencies: [string, string][];
      incompatibilities: [string, string][];
      supportsMacOS: boolean;
      supportsWindows: boolean;
      supportsLinux: boolean;
    };
    const { packageId, packageVersion, xpSelection } = data;
    let {
      incompatibilities,
      dependencies,
      isPublic,
      isPrivate,
      isStored,
      supportsMacOS,
      supportsWindows,
      supportsLinux
    } = data;

    // This work around fixes that express validator sometimes considers these as strings instead of booleans
    isPublic = typeof isPublic !== 'boolean' ? isPublic === 'true' : isPublic;
    isPrivate = typeof isPrivate !== 'boolean' ? isPrivate === 'true' : isPrivate;
    isStored = typeof isStored !== 'boolean' ? isStored === 'true' : isStored;
    supportsMacOS = typeof supportsMacOS !== 'boolean' ? supportsMacOS === 'true' : supportsMacOS;
    supportsWindows = typeof supportsWindows !== 'boolean' ? supportsWindows === 'true' : supportsWindows;
    supportsLinux = typeof supportsLinux !== 'boolean' ? supportsLinux === 'true' : supportsLinux;

    if (!file) {
      routeLogger.trace('No file uploaded (no_file)');
      return res
        .status(400)
        .send('no_file');
    }

    if (isPublic !== !isPrivate || isPublic && !isStored) {
      routeLogger.trace('Invalid access config (invalid_access_config)');
      return res
        .status(400)
        .send('invalid_access_config');
    }

    if (!(supportsMacOS || supportsWindows || supportsLinux)) {
      routeLogger.trace('Must support one platform (plat_supp)');
      return res
        .status(400)
        .send('plat_supp');
    }

    if (!token.canUploadPackageVersion(packageId)) {
      routeLogger.trace('Insufficient permissions to upload a package version');
      return res.sendStatus(401);
    }

    try {
      [dependencies, incompatibilities] = validateLists(packageId, dependencies, incompatibilities);

      const author = await token.getAuthor();
      const packageData = await packageDatabase.getPackageData(packageId);

      if (packageData.authorId !== author.authorId) {
        routeLogger.trace('Author does not own package');
        return res.status(403);
      }

      const versionExists = await packageDatabase.versionExists(packageId, packageVersion);

      if (versionExists) {
        routeLogger.trace('Version already exists');
        return res
          .status(400)
          .send('version_exists');
      }

      const platforms = {
        macOS: supportsMacOS,
        windows: supportsWindows,
        linux: supportsLinux
      };

      await packageDatabase.addPackageVersion(packageId, packageVersion, {
        isPublic: isPublic,
        isStored: isStored,
        privateKey: !isPublic && isStored ? privateKeyNanoid(32) : void (0)
      }, dependencies, incompatibilities, xpSelection, platforms);

      routeLogger.trace('Registered package version in database');

      const fileProcessorData: FileProcessorData = {
        zipFileLoc: file.path,
        authorId: author.authorId,
        packageName: packageData.packageName,
        packageId,
        packageVersion: packageVersion.toString(),
        packageType: packageData.packageType,
        dependencies,
        incompatibilities,
        accessConfig: {
          isPublic,
          isPrivate,
          isStored
        },
        xpSelection: xpSelection.toString(),
        platforms
      };

      res.removeListener('finish', fileDeleteCb);
      const worker = new Worker(FILE_PROCESSOR_WORKER_PATH, { workerData: fileProcessorData });
      worker.once('message', v => {
        if (v === 'started') {
          res.sendStatus(204);
          routeLogger.trace('Package processing started');
        } else {
          res.sendStatus(500);
          routeLogger.error('Worker not started, failed with message: ' + v);
        }
      });
    } catch (e) {
      if (e instanceof InvalidListError) {
        routeLogger.trace(e, 'Invalid list');
        return res
          .status(400)
          .send(e.response);
      } else if (e instanceof NoSuchPackageError) {
        routeLogger.trace(e, 'Package does not exist');
        return res.sendStatus(403);
      }

      routeLogger.error(e);
      return res.sendStatus(500);
    }
  });

route.post('/retry',
  upload.single('file'),
  validators.asPartialXpkgPackageId(body('packageId')),
  validators.asVersion(body('packageVersion')),
  async (req: AuthorizableRequest, res) => {
    const file = req.file;
    const token = req.user!;

    const routeLogger = logger.child({
      ip: req.ip,
      authorId: token.authorId,
      route: '/packages/retry'
    });
    routeLogger.trace('Processing retry request');

    if (!file) {
      routeLogger.trace('No file uploaded (no_file)');
      return res
        .status(400)
        .send('no_file');
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.trace(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { packageId, packageVersion } = matchedData(req) as {
      packageId: string;
      packageVersion: Version;
    };

    try {
      const author = await token.getAuthor();
      const packageData = await packageDatabase.getPackageData(packageId);

      if (!token.canUploadPackageVersion(packageId)) {
        routeLogger.trace('Insufficient permissions to retry upload');
        await rm(file.path, { force: true });
        return res.sendStatus(401);
      }

      if (packageData.authorId !== author.authorId) {
        routeLogger.trace('Author does not own package, or it doesn\'t exist (no_package)');
        return res.sendStatus(403);
      }

      const versionData = await packageDatabase.getVersionData(packageId, packageVersion);

      if (versionData.status === VersionStatus.Processed || versionData.status === VersionStatus.Processing) {
        routeLogger.trace('Author is attempting to re-upload non-failed package');
        return res
          .status(400)
          .send('cant_retry');
      }

      routeLogger.trace('Setting version status back to processing');
      await Promise.all([
        packageDatabase.updateVersionStatus(packageId, packageVersion, VersionStatus.Processing),
        packageDatabase.updateVersionDate(packageId, packageVersion)
      ]);

      const fileProcessorData: FileProcessorData = {
        zipFileLoc: file.path,
        authorId: author.authorId,
        packageName: packageData.packageName,
        packageId,
        packageVersion: packageVersion.toString(),
        packageType: packageData.packageType,
        dependencies: versionData.dependencies,
        incompatibilities: versionData.incompatibilities,
        accessConfig: {
          isPublic: versionData.isPublic,
          isPrivate: !versionData.isPublic,
          isStored: versionData.isStored
        },
        xpSelection: versionData.xpSelection,
        platforms: versionData.platforms
      };

      const worker = new Worker(FILE_PROCESSOR_WORKER_PATH, { workerData: fileProcessorData });
      worker.on('message', v => {
        if (v === 'started') {
          routeLogger.trace('Package processing started');
          res.sendStatus(204);
        }
      });
    } catch (e) {
      if (e instanceof NoSuchPackageError) {
        routeLogger.trace(e, 'Version does not exist (version_not_exist)');
        return res
          .status(400)
          .send('version_not_exist');
      }

      routeLogger.error(e, 'Error while attempting to get version data');
      return res.sendStatus(500);
    }
  });

route.patch('/incompatibilities',
  validators.asPartialXpkgPackageId(body('packageId')),
  validators.asVersion(body('packageVersion')),
  body('incompatibilities').isArray({
    min: 0,
    max: 128
  }).withMessage('bad_inc_arr'),
  async (req: AuthorizableRequest, res) => {
    const token = req.user!;
    const routeLogger = logger.child({
      ip: req.ip,
      authorId: token.authorId,
      route: '/packages/incompatibilities'
    });

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.trace(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const data = matchedData(req) as {
      packageId: string;
      packageVersion: Version;
      incompatibilities: [string, string][];
    };
    const { packageId, packageVersion } = data;
    let { incompatibilities } = data;

    routeLogger.setBindings({
      packageId,
      version: packageVersion.toString()
    });

    if (!token.canUpdateVersionData(packageId)) {
      routeLogger.trace('Insufficient permissions to update incompatibilities');
      return res.sendStatus(401);
    }

    try {
      const [isAuthorsPkg, versionData] = await Promise.all([
        packageDatabase.doesAuthorHavePackage(token.authorId, packageId),
        packageDatabase.getVersionData(packageId, packageVersion)
      ]);

      if (!isAuthorsPkg) {
        routeLogger.trace('Author attempted to modify package that is not their own');
        return res.sendStatus(401);
      }

      [, incompatibilities] = validateLists('xpkg/' + packageId, versionData.dependencies, incompatibilities);
      await packageDatabase.updateVersionIncompatibilities(packageId, packageVersion, incompatibilities);
      routeLogger.trace('Incompatibilities updated successfully');
      res.sendStatus(204);
    } catch (e) {
      if (e instanceof NoSuchPackageError) {
        routeLogger.trace(e, 'No such package found');
        return res.sendStatus(401);
      } else if (e instanceof InvalidListError) {
        routeLogger.trace(e.message);
        return res
          .status(400)
          .send(e.response);
      }

      routeLogger.error(e);
      return res.sendStatus(500);
    }
  });

route.patch('/xpselection',
  validators.asPartialXpkgPackageId(body('packageId')),
  validators.asVersion(body('packageVersion')),
  validators.asVersionSelection(body('xpSelection')),
  async (req: AuthorizableRequest, res) => {
    const token = req.user!;

    const routeLogger = logger.child({
      ip: req.ip,
      authorId: token.authorId,
      route: '/packages/xpselection'
    });

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.info(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { packageId, packageVersion, xpSelection } = matchedData(req) as {
      packageId: string;
      packageVersion: Version;
      xpSelection: VersionSelection;
    };

    routeLogger.setBindings({
      packageId,
      packageVersion: packageVersion.toString(),
      newXpSel: xpSelection.toString()
    });

    if (!token.canUpdateVersionData(packageId)) {
      routeLogger.trace('Insufficient permissions to update X-Plane version selection');
      return res.sendStatus(401);
    }

    try {
      const packageData = await packageDatabase.getPackageData(packageId);
      if (packageData.authorId !== token.authorId) {
        routeLogger.trace('Author attempted to update X-Plane selection of a package that is not their own');
        return res.sendStatus(401);
      }

      await packageDatabase.updateVersionXPSelection(packageId, packageVersion, xpSelection);
      routeLogger.info('X-Plane version selection updated successfully');
      res.sendStatus(204);
    } catch (e) {
      if (e instanceof NoSuchPackageError) {
        routeLogger.info(e, 'Can not update X-Plane version selection of non-existent package');
        return res.sendStatus(401);
      }

      routeLogger.error(e);
      return res.sendStatus(500);
    }
  });

/**
 * Validate and simplify the dependency and incompatibility lists. Merges duplicates, and disallows the same identifier in both lists. Also enforces list-schema, and prevents self-dependency and self-incompatibilities.
 * 
 * @param {string} packageId The full package identifier of the package which these lists are for.
 * @param {[string, string][]} dependencies The client-provided dependency list, which is an array of tuples, where the first element is the full identifier of the dependency, and the second element is the selection of the dependency.
 * @param {[string, string][]} incompatibilities The client-provided incompatibility list, which is an array of tuples, where the first element is the full identifier of the incompatibility, and the second element is the selection of the incompatibility.
 * @returns {[[string, string][], [string, string][]]} A tuple of two lists of tuples, where the first element is a list of tuples is the new (simplified) dependency list, and the second element is also a list of tuples, which is the new (simplified) incompatibility list.
 */
function validateLists(packageId: string, dependencies: [string, string][], incompatibilities: [string, string][]): [[string, string][], [string, string][]] {

  const dependencyMap: Map<string, string> = new Map();
  for (const dependency of dependencies) {
    if (!Array.isArray(dependency) || dependency.length !== 2)
      throw new InvalidListError('bad_dep_tuple', 'Bad dependency tuple');

    let dependencyId = dependency[0].trim().toLowerCase();
    const dependencySelection = dependency[1];

    if (typeof dependencyId !== 'string' || typeof dependencySelection !== 'string')
      throw new InvalidListError('invalid_dep_tuple_types', 'Dependency tuple contains invalid types');

    if (!validators.validateId(dependencyId))
      throw new InvalidListError('invalid_dep_tuple_id', 'Dependency tuple contains invalid identifier');

    if (!dependencyId.includes('/'))
      dependencyId = 'xpkg/' + dependencyId;

    if (dependencyId === packageId)
      throw new InvalidListError('self_dep', 'Declared dependency is self');

    if (dependencyMap.has(dependencyId)) {
      const oldSelection = dependencyMap.get(dependencyId);
      dependencyMap.set(dependencyId, oldSelection + ',' + dependencySelection);
    } else
      dependencyMap.set(dependencyId, dependencySelection);
  }

  const dependencyIdList = dependencies.map(d => d[0]);
  const incompatibilityMap: Map<string, string> = new Map();

  for (const incompatibility of incompatibilities) {
    if (!Array.isArray(incompatibility) || incompatibility.length !== 2)
      throw new InvalidListError('bad_inc_tuple', 'Bad incompatibility tuple');

    let incompatibilityId = incompatibility[0].trim().toLowerCase();
    const incompatibilitySelection = incompatibility[1];

    if (typeof incompatibilityId !== 'string' || typeof incompatibilitySelection !== 'string')
      throw new InvalidListError('invalid_inc_tuple_types', 'Incompatibility tuple contains invalid types');

    if (!validators.validateId(incompatibilityId))
      throw new InvalidListError('invalid_inc_tuple_id', 'Incompatibility tuple contains invalid identifier');

    if (!incompatibilityId.includes('/'))
      incompatibilityId = 'xpkg/' + incompatibilityId;

    if (incompatibilityId === packageId || dependencyIdList.includes(incompatibilityId))
      throw new InvalidListError('dep_or_self_inc', 'Declared incompatibility is self or a dependency');

    if (incompatibilityMap.has(incompatibilityId)) {
      const oldSelection = incompatibilityMap.get(incompatibilityId);
      incompatibilityMap.set(incompatibilityId, oldSelection + ',' + incompatibilitySelection);
    } else
      incompatibilityMap.set(incompatibilityId, incompatibilitySelection);
  }

  // Make sure we simplify all selections before putting them back into the database
  const newDependencies = Array.from(dependencyMap.entries());
  newDependencies.forEach(d => {
    const selection = new VersionSelection(d[1]);
    if (!selection.isValid)
      throw new InvalidListError('invalid_dep_sel', 'Invalid dependency selection for ' + d[0]);

    d[1] = selection.toString();
  });

  const newIncompatibilities = Array.from(incompatibilityMap.entries());
  newIncompatibilities.forEach(i => {
    const selection = new VersionSelection(i[1]);
    if (!selection.isValid)
      throw new InvalidListError('invalid_inc_sel', 'Invalid incompatibility selection for ' + i[0]);
    i[1] = selection.toString();
  });

  return [newDependencies, newIncompatibilities];
}

export default route;