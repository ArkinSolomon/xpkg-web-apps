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
 * The data for a single OAuth client.
 * 
 * @typedef {Object} ClientData
 * @property {string} clientId The id of the client.
 * @property {string} secretHash The hash of the client secret.
 * @property {string} userId The id of the user that created the client.
 * @property {string} name The client name.
 * @property {string} description The description of the client.
 * @property {string} icon The location of the client icon.
 * @property {string[]} redirectURIs The possible URIs to which the client may redirect.
 * @property {bigint} permissionsNumber The permission number that this client MAY request.
 * @property {Date} created When the client was created.
 * @property {Date} secretRegenerated When the client secret was regenerated.
 */
export type ClientData = {
  clientId: string;
  secretHash: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  redirectURIs: string[];
  permissionsNumber: bigint;
  created: Date;
  secretRegenerated: Date;
};

import mongoose, { Schema } from 'mongoose';

const clientSchema = new Schema<ClientData>({
  clientId: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  secretHash: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  redirectURIs: {
    type: [String],
    required: true
  },
  permissionsNumber: {
    type: BigInt,
    required: true
  },
}, {
  collection: 'clients'
});

const clientsDB = mongoose.connection.useDb('clients');
const ClientModel = clientsDB.model<ClientData>('client', clientSchema);

export default ClientModel;