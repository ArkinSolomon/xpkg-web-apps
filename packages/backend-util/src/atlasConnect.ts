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
import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Automatically attempt to connect to MongoDB atlas, and fail if connection does not work.
 */
export default async function connect() {
  try {
    await mongoose.connect(`mongodb+srv://${process.env.MONGODB_IP}/?authSource=%24external&authMechanism=MONGODB-X509` as string, {
      tlsAllowInvalidCertificates: false,
      tlsCertificateKeyFile: process.env.MONGODB_KEY_PATH,
      authMechanism: 'MONGODB-X509',
      authSource: '$external'
    });
    logger.info('Connected to MongoDB Atlas');
  } catch (e) {
    logger.fatal(e, 'Could not connect to MongoDB Atlas');
    process.exit(1);
  }
}
