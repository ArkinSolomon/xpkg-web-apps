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
 * The different settings that a user can have.
 * 
 * @typedef {Object} UserSettings
 * @property {string} userId The id of the user.
 * @property {boolean} isDeveloper True if the user is a developer.
 */
export type UserSettings = {
  userId: string;
  isDeveloper: boolean;
}

import mongoose, { Schema } from 'mongoose';

const userSettingsSchema = new Schema<UserSettings>({
  userId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  isDeveloper: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  collection: 'settings'
});

const usersDB = mongoose.connection.useDb('users');
const UserSettingsModel = usersDB.model<UserSettings>('userSettings', userSettingsSchema);
export default UserSettingsModel;