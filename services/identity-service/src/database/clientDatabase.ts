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
import genericSessionFunction from './genericSessionFunction.js';
import ClientModel, { ClientData } from './models/clientModel.js';
import { customAlphabet } from 'nanoid';
import { ClientSession, HydratedDocument } from 'mongoose';

const numericNanoid = customAlphabet('0123456789');
const alphanumericNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');

const DEFAULT_CLIENT_ICON = 'https://placehold.co/1024/jpg';

/**
 * Create a new client and register it on the database.
 * 
 * @async
 * @param {string} userId The id of the user that is creating the client.
 * @param {string} name The name of the client.
 * @param {string} description The description of the client.
 * @param {string} defaultRedirect The default redirect URI.
 * @param {boolean} isSecret True if the client should have a secret.
 * @param {ClientSession} [session] An optional session to chain multiple requests to be atomic.
 * @returns {Promise<[string, string | null]>} A promise which resolves to a tuple with the first value being the client id, and the second value being the full client secret, or null if the client is not secure
 * \.
 */
export async function createClient(userId: string, name: string, description: string, defaultRedirect: string, isSecure: boolean, session?: ClientSession): Promise<[string, string | null]> {
  const clientId = 'xpkg_id_' + numericNanoid(48);

  let clientSecret: string | null = null,
    fullClientSecret: string | null = null,
    secretHash: string | null = null;
  if (!isSecure) {
    clientSecret = alphanumericNanoid(71);
    fullClientSecret = 'xpkg_secret_' + clientSecret;
    secretHash = await Bun.password.hash(clientSecret, {
      algorithm: 'bcrypt',
      cost: 12
    });
  }

  const created = new Date();

  return await genericSessionFunction(async session => {
    await ClientModel.create({
      clientId,
      secretHash: secretHash ?? '',
      userId,
      name,
      description,
      icon: DEFAULT_CLIENT_ICON,
      redirectURIs: [defaultRedirect],
      permissionsNumber: 0n,
      isSecure,
      created,
      secretRegenerated: created
    }, {
      session
    });
  
    return [clientId, fullClientSecret];
  }, session);
}

/**
 * Get the data of a client.
 * 
 * @async
 * @param {string} clientId The id of the client to get.
 * @returns {Promise<HydratedDocument<ClientData>|null>} Returns a leaned object of the client data, or null if no such client exists with the given id.
 */
export async function getClient(clientId: string): Promise<HydratedDocument<ClientData> | null> {
  return ClientModel
    .findOne({ clientId })
    .select({ _id: 0 })
    .exec();
}

/**
 * Get all user clients.
 * 
 * @async
 * @param {string} userId The id of the user who's clients to get.
 * @returns {Promise<Omit<ClientData, 'secretHash'>[]>} A promise which resolves to all of the user's created clients.
 */
export async function getUserClients(userId: string): Promise<Omit<ClientData, 'secretHash'>[]> {
  return ClientModel
    .find({ userId })
    .select({
      _id: 0,
      secretHash: 0
    })
    .lean()
    .exec();
}