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

/**
 * The data that can exit the server for the author.
 * 
 * @typedef {Object} AuthorData 
 * @property {string} authorId The id of the author.
 * @property {string} authorName The name of the author.
 * @property {string} authorEmail The email of the author.
 * @property {boolean} emailVerified True if the author's email has been verified.
 * @property {bigint} usedStorage The amount of storage the author has used (bytes).
 * @property {bigint} totalStorage The total amount of storage that the author has (bytes).
 * @property {boolean} authorBanned True if the author has been banned from publishing packages.
 * @property {string} [banReason] An optional ban reason for the author.
 */
export type AuthorData = {
  authorId: string;
  authorName: string;
  authorEmail: string;
  emailVerified: boolean;
  usedStorage: bigint;
  totalStorage: bigint;
  authorBanned: boolean;
  banReason?: string;
};

import mongoose, { Schema } from 'mongoose';

const authorSchema = new Schema<AuthorData>({
  authorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  authorName: {
    type: String,
    required: true,
    unique: true
  },
  authorEmail: {
    type: String,
    required: true,
    unique: true
  },
  emailVerified: {
    type: Boolean,
    required: true
  },
  usedStorage: {
    type: BigInt,
    default: 0n,
    required: true
  },
  totalStorage: {
    type: BigInt,
    default: 536870912n,
    required: true
  },
  authorBanned: {
    type: Boolean,
    required: true,
    default: false
  },
  banReason: {
    type: String,
    required: false
  }
}, {
  collection: 'authors'
});

const authorsDB = mongoose.connection.useDb('registry');
const AuthorModel = authorsDB.model<AuthorData>('author', authorSchema);

export default AuthorModel;
