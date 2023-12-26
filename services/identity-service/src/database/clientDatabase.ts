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
import ClientModel, { ClientData } from './models/clientModel.js';
import { customAlphabet } from 'nanoid';

const numericNanoid = customAlphabet('0123456789');
const alphanumericNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');

// ps = proprietary service
export const XIS_CLIENT_ID = 'xpkg_ps_000000000000000000000000000000000000000000000000';

const DEFAULT_CLIENT_ICON = 'https://placehold.co/1024/jpg';

/**
 * Create a new client and register it on the database.
 * 
 * @async
 * @param {string} userId The id of the user that is creating the client.
 * @param {string} name The name of the client.
 * @param {string} description The description of the client.
 * @param {string} defaultRedirect The default redirect URI
 * @returns {Promise<[string, string]>} A promise which resolves to a tuple with the first value being the client id, and the second value being the full client secret.
 */
export async function createClient(userId: string, name: string, description: string, defaultRedirect: string): Promise<[string, string]> {
  const clientId = 'xpkg_id_' + numericNanoid(48);
  const clientSecret = alphanumericNanoid(71);
  const fullClientSecret = 'xpkg_secret_' + clientSecret;

  const secretHash = await Bun.password.hash(clientSecret, {
    algorithm: 'bcrypt',
    cost: 12
  });
  const created = new Date();

  await ClientModel.create({
    clientId,
    secretHash,
    userId,
    name,
    description,
    icon: DEFAULT_CLIENT_ICON,
    redirectURIs: [defaultRedirect],
    permissionsNumber: 0n,
    created,
    secretRegenerated: created
  });

  return [clientId, fullClientSecret];
}

/**
 * Get the data of a client.
 * 
 * @param {string} clientId The id of the client to get.
 * @returns Returns a leaned object of the client data, or null if no such client exists with the given id.
 */
export async function getClient(clientId: string): Promise<ClientData | null> {
  return ClientModel
    .findOne({ clientId })
    .select({ _id: 0 })
    .lean()
    .exec();
}