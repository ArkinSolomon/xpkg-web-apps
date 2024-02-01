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

import { Version, VersionSelection } from '@xpkg/versioning';
import NoSuchPackageError from '../errors/noSuchPackageError.js';
import PackageModel, { PackageData, PackageType } from './models/packageModel.js';
import VersionModel, { PlatformSupport, VersionData, VersionStatus } from './models/versionModel.js';
import { ClientSession } from 'mongoose';
import { genericSessionFunction } from '@xpkg/backend-util';

/**
 * Add a new package to the database. Does not check for existence.
 * 
 * @async 
 * @param {string} packageId The package identifier of the new package.
 * @param {string} packageName The name of the new package.
 * @param {string} authorId The id of the author that is creating the package.
 * @param {string} authorName The name of the author that is creating the package
 * @param {string} description The description of the new package.
 * @param {PackageType} packageType The type of the package that is being created.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation is completed successfully, or rejects if it does not.
 */
export async function addPackage(packageId: string, packageName: string, authorId: string, authorName: string, description: string, packageType: PackageType, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const newPackage = new PackageModel({
      packageId,
      packageName,
      authorId,
      authorName,
      description,
      packageType
    });
  
    await newPackage.save({ session });
  }, session);
}

/**
 * Create a new version for a package. If both published and private are false, the package is assumed to registered only. Does not check for package or version existence.
 * 
 * @async
 * @param {string} packageId The partial package identifier of the package that this version is for.
 * @param {Version} packageVersion The version string of the version.
 * @param {Object} accessConfig The access config of the package version.
 * @param {boolean} accessConfig.isPublic True if the package is to be public.
 * @param {boolean} accessConfig.isStored True if the package is to be stored, must be true if public is true.
 * @param {string} [accessConfig.privateKey] Access key for the version, must be provided if package is private and stored.
 * @param {[string][string][]} [dependencies] The dependencies of the version.
 * @param {[string][string][]} [incompatibilities] The incompatibilities of the version.
 * @param {VersionSelection} xpSelection The X-Plane selection.
 * @param {PlatformSupport} platforms The platform support for the version.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation is completed successfully, or rejects if it does not.
 */
export async function addPackageVersion(packageId: string, packageVersion: Version, accessConfig: {
    isPublic: boolean;
    isStored: boolean;
    privateKey?: string;
}, dependencies: [string, string][], incompatibilities: [string, string][], xpSelection: VersionSelection, platforms: PlatformSupport, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const newVersion = new VersionModel({
      packageId,
      packageVersion: packageVersion.toString(),
      ...accessConfig,
      dependencies,
      incompatibilities,
      xpSelection,
      platforms
    });
  
    await newVersion.save({ session });
  }, session);
}

/**
 * Set the last uploaded date to a date, or now.
 * 
 * @async
 * @param {string} packageId The partial package identifier of the package to update the version of.
 * @param {Version} packageVersion The version of the package of which to update the date.
 * @param {Date} [date] The date to update the version's uploaded date. Defaults to now.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation is completed successfully, or rejects if it does not.
 * @throws {NoSuchPackageError} Thrown if a package with the given version does not exist, or if the version does not exist for the given identifier.
 */
export async function updateVersionDate(packageId: string, packageVersion: Version, date?: Date, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await VersionModel.updateOne({
      packageId,
      packageVersion: packageVersion.toString()
    }, {
      $set: {
        uploadDate: date ?? new Date()
      }
    })
      .session(session)
      .exec();
    
    if (!result.matchedCount)
      throw new NoSuchPackageError(packageId, packageVersion);
  }, session);
}

/**
 * Set the information after finishing processing a package version. Also update the status to {@link VersionStatus~Processed}.
 * 
 * @async
 * @param {string} packageId The id of the package which contains the version to update.
 * @param {Version} packageVersion The version of the package to update the version data of.
 * @param {string} hash The sha256 checksum of the package.
 * @param {number} size The size of the xpkg file in bytes.
 * @param {number} installedSize The size of the unzipped xpkg file in bytes.
 * @param {string} [loc] The URL of the package, or undefined if the package is not stored.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation completes successfully.
 * @throws {NoSuchPackageError} Error thrown if no package exists with the given id or version.
 */
export async function resolveVersionData(packageId: string, packageVersion: Version, hash: string, size: number, installedSize: number, loc?: string, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await VersionModel.findOneAndUpdate({
      packageId,
      packageVersion: packageVersion.toString()
    }, {
      $set: {
        hash,
        loc,
        size,
        installedSize,
        status: VersionStatus.Processed
      }
    })
      .session(session)
      .updateOne()
      .exec();
  
    if (!result.matchedCount)
      throw new NoSuchPackageError(packageId, packageVersion);
  }, session);
}

/**
 * Update the status of a specific package version.
 * 
 * @async
 * @param {string} packageId The id of the package which contains the version to update.
 * @param {Version} packageVersion The version of the package to update the status of.
 * @param {VersionStatus} newStatus The new status to set.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation completes successfully.
 * @throws {NoSuchPackageError} Error thrown if no package exists with the given id or if the package version does not exist.
 */
export async function updateVersionStatus(packageId: string, packageVersion: Version, newStatus: VersionStatus, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await VersionModel.findOneAndUpdate({
      packageId,
      packageVersion: packageVersion.toString()
    }, {
      $set: {
        status: newStatus
      }
    })
      .session(session)
      .updateOne()
      .exec();
  
    if (!result.matchedCount)
      throw new NoSuchPackageError(packageId, packageVersion);
  }, session);
}

/**
 * Update the private key of a package version.
 * 
 * @async 
 * @param {string} packageId The id of the package to update the private key of.
 * @param {Version} packageVersion The version of the package to update the private key of.
 * @param {string} privateKey The new private key of the version. Does not check access config.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation completes.
 * @throws {NoSuchPackageError} Error thrown if no package exists with the given id or if the package version does not exist.
 */
export async function updatePrivateKey(packageId: string, packageVersion: Version, privateKey: string, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await VersionModel.findOneAndUpdate({
      packageId,
      packageVersion: packageVersion.toString()
    }, {
      $set: {
        privateKey
      }
    })
      .session(session)
      .updateOne()
      .exec();
  
    if (result.matchedCount !== 1)
      throw new NoSuchPackageError(packageId, packageVersion);
  }, session);
}

/**
 * Get all package data for all packages.
 * 
 * @async
 * @returns {Promise<PackageData[]>} The data of all of the packages on the registry. 
 */
export async function getPackageData(): Promise<PackageData[]>;

/**
 * Get the package data for a specific package.
 * 
 * @async 
 * @param {string} packageId The identifier of the package to get the data for.
 * @returns {Promise<PackageData>} A promise which resolves to the data of the specified package.
 * @throws {NoSuchPackageError} Error throws if trying to get data for a non-existent package.
 */
export async function getPackageData(packageId: string): Promise<PackageData>;

export async function getPackageData(packageId?: string): Promise<PackageData[]|PackageData> {
  if (packageId) {
    const pkg = await PackageModel
      .findOne({ packageId })
      .select('-_id -__v')
      .lean()
      .exec();
    if (!pkg)
      throw new NoSuchPackageError(packageId);
    return pkg;
  } 

  return PackageModel
    .find()
    .select('-_id -__v')
    .lean()
    .exec();
}

/**
 * Get the data for all versions of a package.
 * 
 * @async
 * @param {string} packageId The id of the package to get the version data for.
 * @returns {Promise<VersionData[]>} A promise which resolves to all of the version data for all versions of the specified package. If no versions exist, an empty array is returned.
 */
export async function getVersionData(packageId: string): Promise<VersionData[]>;

/**
 * Get the data for a specific version of a package.
 * 
 * @async
 * @param {string} packageId The identifier of the package to get the version data for.
 * @param {Version} packageVersion The version of the package to get the data for.
 * @returns {Promise<VersionData>} A promise which resolves to the version data for the specified version of the requested package.
 * @throws {NoSuchPackageError} Error thrown if the package does not exist, or the version does not exist.
 */
export async function getVersionData(packageId: string, packageVersion: Version): Promise<VersionData>;

export async function getVersionData(packageId: string, packageVersion?: Version): Promise<VersionData[] | VersionData> {
  if (packageVersion) {
    const versionDoc = await VersionModel.findOne({
      packageId,
      packageVersion: packageVersion.toString()
    })
      .lean()
      .select('-_id -__v')
      .exec();
    
    if (!versionDoc)
      throw new NoSuchPackageError(packageId, packageVersion);
    return versionDoc;
  }

  return VersionModel.find({ packageId })
    .lean()
    .select('-_id -__v')
    .exec();
}

/**
 * Get the version data for all versions of any package that are both public and processed.
 * 
 * @async
 * @returns {Promise<VersionData[]>} An array of all of the version data for public versions.
 */
export async function allPublicProcessedVersions(): Promise<VersionData[]> {
  return await VersionModel.find({
    isPublic: true,
    status: VersionStatus.Processed
  })
    .lean()
    .select('-_id -__v')
    .exec();
}

/**
 * Update the incompatibilities of a package version by overwriting the old ones.
 *
 * @async
 * @param {string} packageId The identifier of the package to update the incompatibilities of.
 * @param {Version} packageVersion The version of the package to update the incompatibilities of.
 * @param {[string, string][]} incompatibilities The new incompatibilities of the package to overwrite.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the incompatibilities are updated successfully.
 * @throws {NoSuchPackageError} Error thrown if the package does not exist, or the version does not exist.
 */
export async function updateVersionIncompatibilities(packageId: string, packageVersion: Version, incompatibilities: [string, string][], session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await VersionModel.updateOne({
      packageId,
      packageVersion: packageVersion.toString()
    }, {
      $set: {
        incompatibilities
      }
    })
      .session(session)
      .exec();
    
    if (!result.matchedCount)
      throw new NoSuchPackageError(packageId, packageVersion);
  }, session);
}

/**
 * Update the X-Plane selection of a package version by overwriting the old one.
 * 
 * @async
 * @param {string} packageId The identifier of the package to update the X-Plane selection of.
 * @param {Version} packageVersion The version of the package to update the X-Plane selection of.
 * @param {VersionSelection} xpSelection The new X-Plane selection of the package.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the X-Plane selection is updated successfully.
 * @throws {NoSuchPackageError} Error thrown if the package does not exist, or the version does not exist.
 */
export async function updateVersionXPSelection(packageId: string, packageVersion: Version, xpSelection: VersionSelection, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await VersionModel.updateOne({
      packageId,
      packageVersion: packageVersion.toString()
    }, {
      $set: {
        xpSelection: xpSelection.toString()
      }
    })
      .session(session)
      .exec();
    
    if (!result.matchedCount)
      throw new NoSuchPackageError(packageId, packageVersion);
  }, session);
}

/**
 * Check if a package exists with a given id.
 * 
 * @async
 * @param {string} packageId The id to check for existence.
 * @returns {Promise<boolean>} A promise which resolves to true if the package id is already in use.
 */
export async function packageIdExists(packageId: string): Promise<boolean> {
  return (await PackageModel.countDocuments({
    packageId
  }).exec()) === 1;
}

/**
 * Check if the given package has the given version.
 * 
 * @async
 * @param {string} packageId The package id to check for version existence.
 * @param {Version} version The version to check for existence.
 * @returns {Promise<boolean>} A promise which resolves to true if the package already has the version, or false if the package or version does not exist.
 */
export async function versionExists(packageId: string, packageVersion: Version): Promise<boolean> {
  return (await VersionModel.countDocuments({
    packageId,
    packageVersion
  }).exec()) === 1;
}

/**
 * Check if a package exists with a given name.
 * 
 * @async
 * @param {string} packageName The package name to check for
 * @returns {Promise<boolean>} A promise which resolves to true if the name is already in use.
 */
export async function packageNameExists(packageName: string): Promise<boolean> {
  return (await PackageModel.countDocuments({
    packageName: {
      $regex: packageName,
      $options: 'i'
    }
  }).exec()) > 0;
}

/**
 * Update the description for a package.
 * 
 * @async
 * @param {string} packageId The id of the package which we're changing the description of.
 * @param {string} newDescription The new description of the package.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation completes successfully.
 * @throws {NoSuchPackageError} Error thrown if no package exists with the given id.
 */
export async function updateDescription(packageId: string, newDescription: string, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    const result = await PackageModel.findOneAndUpdate({
      packageId
    }, {
      $set: {
        description: newDescription
      }
    })
      .session(session)
      .updateOne()
      .exec();
  
    if (result.matchedCount !== 1)
      throw new NoSuchPackageError(packageId);
  }, session);
}

/**
 * Get all packages by a certain author.
 * 
 * @async
 * @param {string} authorId The id of the author to get the packages of.
 * @returns {Promise<PackageData[]>} A promise which resolves to the data of all packages created by the provided author.
 */
export async function getAuthorPackages(authorId: string): Promise<PackageData[]> {
  return PackageModel
    .find({
      authorId
    })
    .lean()
    .select('-_id -__v')
    .exec();
}

/** 
 * Determine if an author owns a package with the package id.
 * 
 * @async
 * @param {string} authorId The id of the author to determine ownership
 * @param {string} packageId The id of the package to check for.
 * @returns {Promise<boolean>} A promise which resolves to true if the author owns the package
 */
export async function doesAuthorHavePackage(authorId: string, packageId: string): Promise<boolean> {
  return !!PackageModel.exists({
    authorId,
    packageId
  });
}

/**
 * Update any packages that was made by the author with the id and change the name.
 * 
 * @async
 * @param {string} authorId The id of the author to change the name of.
 * @param {string} newName The new name of the author.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves if the operation completes successfully.
 */
export async function updateAuthorName(authorId: string, newName: string, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => {
    await PackageModel.find({
      authorId
    })
      .updateMany({
        $set: {
          authorName: newName
        }
      })
      .session(session)
      .exec();
  }, session);
}