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

import AuthorModel from './models/authorModel.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';
import { ClientSession } from 'mongoose';
import { genericSessionFunction } from '@xpkg/backend-util';

/**
 * Create a new author. Also initialize session randomly.
 * 
 * @async
 * @param {string} authorId The id of the author to create.
 * @param {string} authorName The name of the author.
 * @param {string} authorEmail The name of the author.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves when the author has been created successfully.
 */
export async function createAuthor(authorId: string, authorName: string, authorEmail: string, session?: ClientSession) {
  genericSessionFunction(async session => {
    const authorDoc = new AuthorModel({
      authorId,
      authorName,
      authorEmail
    });
    await authorDoc.save({ session });
  
    return authorDoc;
  }, session);
}

/**
 * Get the Mongoose document of an author by their id.
 * 
 * @param {string} authorId The id of the author to get the Mongoose document of.
 * @returns {Promise} The Mongoose document of the author.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given id.
 */
export async function getAuthorDoc(authorId: string) {
  const author = await AuthorModel.findOne({
    authorId
  })
    .exec();
  
  if (!author)
    throw new NoSuchAccountError('authorId', authorId);
  
  return author;
}

/**
 * Set the amount of storage the author has used. Does not check if the author is allowed to use that much storage.
 * 
 * @async
 * @param {string} authorId The id of the author who's used storage to set.
 * @param {bigint} size The amount of storage to set as used, in bytes.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<void>} A promise which resolves when the database has been updated with the new used storage.
 * @throws {NoSuchAccountError} Error thrown if an author does not exist with the given id. 
 */
export async function setUsedStorage(authorId: string, size: bigint, session?: ClientSession): Promise<void> { 
  genericSessionFunction(async session => {
    const result = await AuthorModel.updateOne({
      authorId
    }, {
      usedStorage: size
    })
      .session(session)
      .exec();
  
    if (result.modifiedCount == 0)
      throw new NoSuchAccountError('authorId', authorId);
  }, session);
}

/**
 * Set the amount of total storage the author has. 
 * 
 * @async
 * @param {string} authorId The id of the author who's storage to set.
 * @param {bigint} size The total storage the author has, in bytes.
 * @returns {Promise<void>} A promise which resolves when the storage has been set.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @throws {NoSuchAccountError} Error thrown if an author does not exist with the given id. 
 */
export async function setTotalStorage(authorId: string, size: bigint, session?: ClientSession): Promise<void> {
  genericSessionFunction(async session => { 
    const result = await AuthorModel.updateOne({
      authorId
    }, {
      totalStorage: size
    })
      .session(session)
      .exec();
  
    if (result.modifiedCount == 0)
      throw new NoSuchAccountError('authorId', authorId);
  }, session);
}