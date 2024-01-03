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
 * Change a user's email and reset them to being unverified.
 * 
 * @async
 * @param {string} userId The id of the user who's email to update.
 * @param {string} newEmail The new email of the user.
 * @returns {Promise} A promise which resolves if the operation completes successfully.
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given user id. 
 */
export async function changeEmail(userId: string, newEmail: string): Promise<void> {
  const updated = await UserModel.updateOne({
    userId
  }, {
    $set: {
      email: newEmail,
      emailVerified: false
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
 * @throws {NoSuchAccountError} Error thrown if no account exists with the given user id. 
 */
export async function verifyEmail(userId: string): Promise<void> {
  const updated = await UserModel.updateOne({
    userId
  }, {
    $set: {
      emailVerified: true
    }
  }, { upsert: false })
    .exec();

  if (!updated.matchedCount) 
    throw new NoSuchAccountError('userId', userId);
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
  return 'https://gravatar.com/avatar/' + emailHash;
} 