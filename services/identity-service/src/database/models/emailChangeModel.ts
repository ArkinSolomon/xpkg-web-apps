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

/**
 * The data in this model represents a current email change request state.
 * 
 * @typedef {Object} EmailChangeData
 * @property {string} userId The id of the user that requested this email change.
 * @property {string} requestId The id of the email change request. Must match the data in the token.
 * @property {string} originalEmail The original email that is being replaced.
 * @property {string} [newEmail] The new email which is being changed.
 * @property {string} [newCodeHash] The hash of the code that the user must enter from their new email.
 * @property {Date} expiry The time at which this request expires.
 */
export type EmailChangeData = {
  userId: string;
  requestId: string;
  originalEmail: string;
  newEmail?: string;
  newCodeHash?: string;
  expiry: Date;
};

import { identifiers } from '@xpkg/validation';
import { DateTime } from 'luxon';
import mongoose, { Schema } from 'mongoose';

const emailChangeSchema = new Schema<EmailChangeData>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => identifiers.alphanumericNanoid(32)
  },
  originalEmail: {
    type: String,
    required: true,
    unique: true
  },
  newEmail: {
    type: String,
    required: false,
    unique: true
  },
  newCodeHash: {
    type: String,
    required: false
  },
  expiry: {
    type: Date,
    required: true,
    default: () => DateTime.now().plus({ hours: 1 }).toJSDate()
  }
}, {
  collection: 'email-change-requests'
});

const usersDB = mongoose.connection.useDb('users');
const EmailChangeModel = usersDB.model<EmailChangeData>('emailChangeRequest', emailChangeSchema);

emailChangeSchema.index({ originalEmail: 1, newEmail: 1 }, { unique: true });
usersDB.collection('email-change-requests').createIndex({
  expiry: 1
}, {
  expireAfterSeconds: 0
});

export default EmailChangeModel;