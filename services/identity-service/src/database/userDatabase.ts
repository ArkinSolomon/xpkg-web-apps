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

import { nanoid } from 'nanoid';
import UserModel, { UserData } from './models/userModel.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';
import { HydratedDocument } from 'mongoose';
import { hash } from 'hasha';
import EmailChangeModel, { EmailChangeData } from './models/emailChangeModel.js';
import { ClientSession } from 'mongoose';
import genericSessionFunction from './genericSessionFunction.js';
import NoSuchRequestError from '../errors/noSuchRequestError.js';
import XpkgError from '../errors/xpkgError.js';
import { numericNanoid } from '@xpkg/validation/src/identifiers.js';

/**
 * Create a new user with a random identifier.
 * 
 * @async
 * @param {string} name The name of the user.
 * @param {string} email The email of the user (in lowercase).
 * @param {string} passwordHash The hash of the users's password.
 * @returns {Promise<Document<UserData>>} A promise which resolves to the document of the new user.
 */
export async function createUser(name: string, email: string, passwordHash: string) {
  const userId = nanoid(32);
  const userDoc = new UserModel({
    userId,
    name,
    email,
    hash: passwordHash,
    profilePicUrl: await generateGravatarUrl(email)
  });

  await userDoc.save();

  return userDoc;
}

/**
 * Get a user from their id. Does not include the user's password hash.
 * 
 * @async
 * @param {string} userId The id of the user to get.
 * @returns {Promise<HydratedDocument<Omit<UserData, 'hash'>>>} A promise which resolves to the user's data, without their hash.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given user id.
 */
export async function getUserFromId(userId: string) {
  const user = await UserModel.findOne({
    userId
  })
    .select({
      hash: 0
    })
    .exec();
  if (!user)
    throw new NoSuchAccountError('userId', userId);

  return user as HydratedDocument<Omit<UserData, 'hash'>>;
}

/**
 * Get an user's document from their email.
 * 
 * @async
 * @param {string} userEmail The email of the author to get.
 * @returns {Promise<HydratedDocument<UserData>>} A promise which resolves to the mongoose document, or null if the user does not exist.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given email.
 */
export async function getUserFromEmail(email: string) {
  const user = await UserModel.findOne({
    email
  })
    .exec();
  if (!user)
    throw new NoSuchAccountError('email', email);

  return user;
}

/**
 * Check if a user exists with a given email.
 * 
 * @async
 * @param {string} email The email to check for existence. Does not convert to lowercase.
 * @returns {Promise<boolean>} A promise which resolves to true if the email is already in use.
 */
export async function emailExists(email: string): Promise<boolean> {
  return !!await UserModel.exists({ email }).exec();
}

/**
 * Check if an user already exists with a given name.
 * 
 * @async
 * @param {string} name The name to check for existence. Converts to lowercase.
 * @returns {Promise<boolean>} A promise which resolves to true if the name is already in use.
 */
export async function nameExists(name: string): Promise<boolean> {
  return !!await UserModel.exists({
    name: {
      $regex: new RegExp(`^${name}$`, 'i')
    }
  }).exec();
}

/**
 * Check if an user already exists with a given name or with a given email.
 * 
 * @async
 * @param {string} name The name to check for existence. Converts to lowercase.
 * @param {string} email The email to check for existence. Does not convert to lowercase.
 * @returns {Promise<'email'|'name'|null>} A promise which resolves to 'email' if the email is in use, 'name' if the name is in use, or null if neither are in use.
 */
export async function nameOrEmailExists(name: string, email: string): Promise<'email' | 'name' | null> {
  const foundUser = await UserModel.findOne({
    $or: [
      { email },
      {
        name: {
          $regex: new RegExp(`^${name}$`, 'i')
        }
      }
    ]
  }).exec();

  if (!foundUser)
    return null;
  return email === foundUser.email ? 'email' : 'name';
}

/**
 * Reset a user's profile picture to their Gravatar URL.
 * 
 * @async
 * @param {string} email The email of the user who's profile picture to reset.
 * @param {string} [currentUrl] The current profile picture url of the author to have an early check.
 * @returns {Promise} A promise which resolves if the operation completes successfully.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given email. 
 */
export async function resetUserPfp(email: string, currentUrl?: string): Promise<void> {
  const url = await generateGravatarUrl(email);
  if (url === currentUrl)
    return;

  const updated = await UserModel.updateOne({
    email
  }, {
    $set: {
      profilePicUrl: url
    }
  }, { upsert: false })
    .exec();

  if (!updated.modifiedCount)
    throw new NoSuchAccountError('email', email);

}

/**
 * Change the name of a user.
 * 
 * @async
 * @param {string} userId The id of the user who's name to update.
 * @param {string} newName The new name of the user.
 * @returns {Promise} A promise which resolves if the operation completes successfully.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given user id. 
 */
export async function changeName(userId: string, newName: string): Promise<void> {
  const updated = await UserModel.updateOne({
    userId
  }, {
    $set: {
      name: newName,
      nameChangeDate: new Date()
    }
  }, { upsert: false })
    .exec();

  if (!updated.modifiedCount)
    throw new NoSuchAccountError('userId', userId);

}

/**
 * Set a user's email to be verified.
 * 
 * @async
 * @param {string} userId The id of the user who's verification status to update.
 * @returns {Promise} A promise which resolves if the operation completes successfully.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given user id. 
 */
export async function verifyEmail(userId: string, session?: ClientSession): Promise<void> {
  return genericSessionFunction(async session => {
    const updated = await UserModel.updateOne({
      userId
    }, {
      $set: {
        emailVerified: true
      }
    }, { upsert: false })
      .session(session)
      .exec();

    if (!updated.matchedCount)
      throw new NoSuchAccountError('userId', userId);
  }, session);
}

/**
 * Create a new email change request, and overwrite any existing requests.
 * 
 * @async
 * @param {string} userId The user who made this request.
 * @param {string} oldEmail The old email that is being changed.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<string>} A promise which resolves to the change request's id.
 */
export async function createEmailChangeRequest(userId: string, originalEmail: string, session?: ClientSession): Promise<string> {
  return genericSessionFunction(async session => {
    await EmailChangeModel.deleteMany({
      userId
    }, { session });

    const newRequest = new EmailChangeModel({
      userId,
      originalEmail
    });
    newRequest.save({ session });

    return newRequest.requestId;
  }, session);
}

/**
 * Get the data for an email change request.
 * 
 * @async
 * @param {string} userId The id of the user that this request belongs to.
 * @param {string} requestId The id of the request.
 * @returns {Promise<EmailChangeData>} A promise which resolves to the request data.
 * @throws {NoSuchRequestError} If no request exists with the given user id and request id. 
 */
export async function getEmailChangeRequestData(userId: string, requestId: string): Promise<Omit<EmailChangeData, 'newCodeHash'>> {
  const data = await EmailChangeModel.findOne({
    userId,
    requestId
  })
    .select({
      _id: 0,
      newCodeHash: 0,
      expiry: 0
    })
    .lean()
    .exec();

  if (!data)
    throw new NoSuchRequestError(requestId);

  return data;
}

/**
 * Add the new email to a user's change request.
 * 
 * @async
 * @param {string} userId The id of the user that wants to change their email.
 * @param {string} requestId The change request id.
 * @param {string} newEmail The new email of the user.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<string>} A promise which resolves to the new code required by the user.
 * @throws {NoSuchRequestError} If no request exists with the given user id and request id.
 * @throws {XpkgError} If a new email has already been assigned.
 */
export async function addNewEmailToChangeRequest(userId: string, requestId: string, newEmail: string, session?: ClientSession): Promise<string> {
  return genericSessionFunction(async session => {
    const requestDoc = await EmailChangeModel.findOne({ userId, requestId }).exec();
    if (!requestDoc)
      throw new NoSuchRequestError(requestId);

    if (requestDoc.newEmail || requestDoc.newCodeHash)
      throw new XpkgError('Step already completed once');

    const code = numericNanoid(6);
    const codeHash = await Bun.password.hash(code, 'bcrypt');

    requestDoc.newEmail = newEmail;
    requestDoc.newCodeHash = codeHash;
    await requestDoc.save({ session });

    return code;
  }, session);
}

/**
 * Change the email of a user to their request if the provided code is valid. A database write only occurs if the code is valid, and no error is thrown.
 * 
 * @async
 * @param {string} userId The id of the user that wants to change their email.
 * @param {string} requestId The change request id.
 * @param {number} code The code to validate which is sent to the new email.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<{ valid: boolean; originalEmail?: string; newEmail?: string; name?: string; }>} A promise which resolves to true if the code is valid, or false if the code is invalid. Also returns the original email, new email, and the user's name if the code is valid. This is to prevent duplicate database queries. Throws if there is an error, or the request can not be found.
 * @throws {NoSuchRequestError} If no request exists with the given user id and request id. 
 * @throws {XpkgError} If step 1 is not completed first.
 */
export async function checkEmailChangeRequestCode(userId: string, requestId: string, code: number, session?: ClientSession): Promise<{
  valid: boolean;
  originalEmail?: string;
  newEmail?: string;
  name?: string;
}> {
  return genericSessionFunction(async session => {
    const requestDoc = await EmailChangeModel.findOne({ userId, requestId }).exec();
    if (!requestDoc)
      throw new NoSuchRequestError(requestId);

    if (!requestDoc.newEmail || !requestDoc.newCodeHash)
      throw new XpkgError('Step 1 not completed');

    const isCodeValid = await Bun.password.verify(code.toString(), requestDoc.newCodeHash, 'bcrypt');
    if (!isCodeValid)
      return {
        valid: false
      };

    const user = await getUserFromId(userId);
    await requestDoc.deleteOne({ session });

    user.emailVerified = true;
    user.email = requestDoc.newEmail;
    await user.save({ session });
    return {
      valid: true,
      originalEmail: requestDoc.originalEmail,
      newEmail: requestDoc.newEmail,
      name: user.name
    };
  }, session);
}

/**
 * Generate a Gravatar URL.
 * 
 * @async
 * @param {string} email The email for the Gravatar URL.
 * @returns {Promise<string>} A promise which resolves to the Gravatar URL.
 */
async function generateGravatarUrl(email: string): Promise<string> {
  const emailHash = await hash(email, { algorithm: 'sha256' });
  return `https://gravatar.com/avatar/${emailHash}?d=identicon`;
}