/*
 * Copyright (c) 2023. Arkin Solomon.
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
import UserModel from './models/userModel.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';

/**
 * Create a new user with a random identifier.
 * 
 * @async
 * @param {string} name The name of the user.
 * @param {string} email The email of the user (in lowercase).
 * @param {string} hash The hash of the users's password.
 * @returns {Promise<Document<UserData>>} A promise which resolves to the document of the new user.
 */
export async function createUser(name: string, email: string, hash: string) {
  const userId = nanoid(32);

  const userDoc = new UserModel({
    userId,
    name,
    email,
    hash,
  });
  await userDoc.save();

  return userDoc;
}

/**
 * Get an user's document from their email.
 * 
 * @async
 * @param {string} userEmail The email of the author to get.
 * @returns {Promise<Document<UserData>>} A promise which resolves to the mongoose document, or null if the user does not exist.
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