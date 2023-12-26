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
import { logger, atlasConnect } from '@xpkg/backend-util';
import bodyParser from 'body-parser';
import cors from 'cors';
import { customAlphabet } from 'nanoid';
import { pinoHttp } from 'pino-http';
import Express, { Request } from 'express';

if (!process.env.NODE_ENV) {
  logger.fatal('NODE_ENV not defined');
  process.exit(1);
}

const alphaNumericNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
const SERVER_ID = process.env.SERVER_ID ?? `identity-${process.env.NODE_ENV}-${alphaNumericNanoid(32)}`;
const serverIdHash = Bun.hash(SERVER_ID);

logger.info({
  NODE_ENV: process.env.NODE_ENV,
  serverId: SERVER_ID,
  serverIdHash
}, 'X-Pkg identity service initializing...');

process.on('unhandledRejection', err => {
  logger.error(err, 'Unhandled rejection');
});

process.on('uncaughtException', err => {
  logger.error(err, 'Uncaught exception');
});

await atlasConnect();

const app = Express();
app.use(bodyParser.json());
app.use(cors());

app.use(function (_, res, next) {
  res.setHeader('X-Powered-By', 'Express, X-Pkg contributors, and you :)');
  next();
});

let currentRequest = 0;
const maxRequest = 9999;
app.use(pinoHttp({
  logger,
  genReqId: function (_, res): string {
    if (currentRequest >= maxRequest)
      currentRequest = 0;

    const requestId = serverIdHash + Date.now().toString(16) + currentRequest.toString().padStart(4, '0') + alphaNumericNanoid(8);
    res.setHeader('X-Request-Id', requestId);
    ++currentRequest;
    return requestId;
  },
  serializers: {
    req: (req: Request) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip
    })
  }
}));

const authorizeRoutes = [
  '/oauth/authorize'
];

import authorization from './util/authorization.js';
app.use(authorizeRoutes, authorization);

import account from './routes/account.js';
import oauth from './routes/oauth.js';

app.use('/account/', account);
app.use('/oauth/', oauth);

const port = process.env.PORT || 4819;
app.listen(port, () => logger.info(`X-Pkg identity service listening on port ${port}`));