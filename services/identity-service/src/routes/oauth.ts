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
import { Logger } from 'pino';
import { Response, Router, response } from 'express';
import { logger } from '@xpkg/backend-util';
import { getClient } from '../database/clientDatabase.js';
import { AuthorizedRequest } from '../util/authorization.js';
import { isValidClientId, isValidOAuthScope } from '../util/validators.js';
import { matchedData, validationResult, query } from 'express-validator';
import { UserData } from '../database/models/userModel.js';
import { ClientData } from '../database/models/clientModel.js';
import { DateTime } from 'luxon';
import { generateCode } from '../database/codeDatabase.js';
import queryString from 'query-string';

const route = Router();

route.post('/authorize',
  isValidClientId(query('client_id')),
  isValidOAuthScope(query('scope')),
  query('state').isLength({ min: 1, max: 64 }).withMessage('bad_state').optional(),
  query('redirect_uri').isString().trim().notEmpty().isURL().withMessage('bad_redirect').customSanitizer(uri => uri.endsWith('/') ? uri.slice(0, -1) : uri),
  query('response_type').trim().notEmpty().bail().custom(v => ['code', 'token', 'id_token'].includes(v)).withMessage('bad_response'),
  query('expires_in').isInt({ min: 0, max: 31536000 }).withMessage('bad_expiry').default(2592000),
  query('code_challenge').isString().notEmpty().withMessage('bad_challenge'),
  query('code_challenge_method').isString().custom(v => v === 'S256').withMessage('bad_code_method'),
  async (req: AuthorizedRequest, res) => {
    const routeLogger = logger.child({
      ip: req.ip,
      route: '/account/authorize',
      requestId: req.id,
    });

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const mapped = result.mapped();
      if (mapped['scope']) {
        routeLogger.trace(`Invalid scope in request, with message: ${mapped['scope']}`);
        return res
          .status(400)
          .send('invalid_scope');
      }

      const message = result.array()[0].msg;
      routeLogger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send('invalid_request');
    }

    const {
      client_id: clientId,
      scope: permissionsNumber,
      state,
      redirect_uri: redirectUri,
      response_type: responseType,
      expires_in: expiresIn,
      code_challenge: codeChallenge
    } = matchedData(req) as {
      client_id: string;
      scope: bigint;
      state: string;
      redirect_uri: string;
      response_type: 'code' | 'token' | 'id_token';
      expires_in: number;
      code_challenge: string;
    };

    routeLogger.setBindings({
      clientId, redirectUri
    });
    const client = await getClient(clientId);
    if (!client) {
      routeLogger.info('Invalid client id (not found in database)');
      return res
        .status(400)
        .send('invalid_request');
    }

    if (!client.redirectURIs.includes(redirectUri)) {
      routeLogger.info('Invalid redirect URI');
      return res
        .status(400)
        .send('invalid_request');
    }

    const tokenExpiry = DateTime.now().plus({ seconds: expiresIn }).toJSDate();
    if (responseType === 'id_token') {
      routeLogger.warn('id_token not implemented');
      return res
        .status(400)
        .send('unsupported_response_type');
    } else if (responseType === 'code') {
      const code = generateCode(client.clientId, req.user!.userId, permissionsNumber, tokenExpiry, codeChallenge);
      const qStringParams = {
        code, state
      };
      return res.redirect(redirectUri + queryString.stringify(qStringParams));

      // } else if (responseType === 'token') {

    } else {
      routeLogger.error(`UNKNOWN RESPONSE_TYPE: ${responseType} not implemented.`);
      return res.sendStatus(500);
    }
  });

route.get('/consentinformation',
  isValidClientId(query('client_id')),
  async (req: AuthorizedRequest, res) => {
    const routeLogger = logger.child({
      ip: req.ip,
      route: '/account/authorize',
      requestId: req.id,
    });

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { client_id: clientId } = matchedData(req) as {
      client_id: string;
    };

    routeLogger.setBindings({
      clientId
    });
    const client = await getClient(clientId);
    if (!client) {
      routeLogger.info('Invalid client id (not found in database)');
      return res
        .status(400)
        .send('invalid_client_id');
    }

    const information = {
      clientName: client.name,
      clientIcon: client.icon,
      clientDescription: client.description,
      userName: req.user!.name,
      userPicture: req.user!.profilePicUrl
    };

    logger.trace(information, 'Retrieved consent request information');
    res
      .status(200)
      .json(information);
  });

export default route;