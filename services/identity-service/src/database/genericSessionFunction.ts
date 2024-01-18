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
 * @callback
 * @template T
 * @function GenericSessionCallback
 * @param {ClientSession} session The session used for all Mongoose operations within the callback.
 * @returns {Promise<T>} A promise that resolves to the value which is returned from the callback's calling function.
 */
export interface GenericSessionCallback<T> {
  (session: ClientSession): Promise<T>;
}

import { startSession, ClientSession } from 'mongoose';

/**
 * Wrap a function in a session, and inherit an outer session if provided. Note that the callback provided may commit or abort the transaction (though it is preferable to throw to abort), but it should NEVER end the session.
 * 
 * @async
 * @template T The return type of the callback.
 * @param {GenericSessionCallback} callback The function to run within the session.
 * @param {ClientSession} [session] The optionally provided session to inherit. If not provided, a new one is created and ended internally.
 * @returns {T} A promise which resolves to the output of the function. Rejects if an error occurs with the transaction, or within callback.
 */
export default async function <T>(callback: GenericSessionCallback<T>, session?: ClientSession): Promise<T> {
  const hasProvidedSession = !!session;
  session ??= await startSession();
  if (!hasProvidedSession)
    session.startTransaction();

  try {
    const returnValue = await callback(session);
    if (!hasProvidedSession && session.transaction.isActive && !session.hasEnded)
      await session.commitTransaction();

    return returnValue;
  } catch (e) {
    if (!hasProvidedSession && session.transaction.isActive && !session.hasEnded)
      await session.abortTransaction();
    throw e;
  } finally {
    if (!hasProvidedSession && !session.hasEnded) 
      session.endSession();
  }
}