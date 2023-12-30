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

/**
 * The data stored about an account of an X-Pkg user.
 * 
 * @typedef {Object} UserData
 * @property {string} userId The identifier of the account.
 * @property {string} created When the user was created.
 * @property {string} email The email address of the account user.
 * @property {string} name The account owner's display name.
 * @property {string} hash The account owner's password hash.
 * @property {boolean} emailVerified True if the email address associated with this account.
 * @property {Date} nameChangeDate The date at which the user's name was last changed.
 * @property {string} profilePicUrl The user's profile picture.
 */
export type UserData = {
  userId: string;
  created: Date;
  email: string;
  name: string;
  hash: string;
  emailVerified: boolean;
  profilePicUrl: string;
  nameChangeDate: Date;
  settings: UserSettings;
};

/**
 * The different settings that a user can have.
 * 
 * @typedef {Object} UserSettings
 * @property {boolean} isDeveloper True if the user is a developer.
 */
export type UserSettings = {
  isDeveloper: boolean;
}

import mongoose, { Schema } from 'mongoose';

const userSettingsSchema = new Schema<UserSettings>({
  isDeveloper: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  _id: false
});

const userSchema = new Schema<UserData>({
  userId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  created: {
    type: Date,
    required: true,
    default: Date.now
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  hash: {
    type: String,
    required: true
  },
  emailVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  profilePicUrl: {
    type: String,
    required: true,
    default: 'https://placehold.co/1f222a/png'
  },
  nameChangeDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  settings: {
    type: userSettingsSchema,
    required: true,
    default: () => ({})
  }
}, {
  collection: 'users'
});

const usersDB = mongoose.connection.useDb('users');
const UserModel = usersDB.model<UserData>('user', userSchema);

export default UserModel;