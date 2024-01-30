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
import { Router } from 'express';
import { getClient } from '../database/clientDatabase.js';
import { AuthorizedRequest } from '../util/authorization.js';
import { isValidClientId, isValidOAuthScope } from '../util/validators.js';
import { matchedData, validationResult, query, header, body } from 'express-validator';
import { DateTime } from 'luxon';
import { generateCode, verifyCode } from '../database/codeDatabase.js';
import queryString from 'query-string';
import { validators } from '@xpkg/validation';
import * as tokenDatabase from '../database/tokenDatabase.js';
import genericSessionFunction from '../database/genericSessionFunction.js';
import { getUserFromId } from '../database/userDatabase.js';
import { TokenType } from '../database/models/tokenModel.js';
import { DEVELOPER_PORTAL_CLIENT_ID } from '@xpkg/auth-util';

const route = Router();

route.post('/authorize',
  isValidClientId(query('client_id')),
  isValidOAuthScope(query('scope')),
  query('state').isLength({ min: 1, max: 64 }).withMessage('bad_state').optional(),
  query('redirect_uri').isString().trim().notEmpty().isURL().withMessage('bad_redirect').customSanitizer(uri => uri.endsWith('/') ? uri.slice(0, -1) : uri),
  query('response_type').trim().notEmpty().bail().custom(v => ['code', 'token', 'id_token'].includes(v)).withMessage('bad_response'),
  query('expires_in').default(2592000).isInt({ min: 0, max: 31536000 }).withMessage('bad_expiry'),
  query('code_challenge').isString().toLowerCase().isLength({ min: 64, max: 64 }).notEmpty().withMessage('bad_challenge'),
  query('code_challenge_method').isString().custom(v => v === 'S256').withMessage('bad_code_method'),
  async (req: AuthorizedRequest, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const mapped = result.mapped();
      if (mapped['scope']) {
        req.logger.trace(`Invalid scope in request, with message: ${mapped['scope'].msg}`);
        return res
          .status(400)
          .send('invalid_scope');
      }

      const message = result.array()[0].msg;
      req.logger.trace(`Bad request with message: ${message}`);
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

    req.logger.setBindings({
      clientId, redirectUri
    });
    try {
      const client = await getClient(clientId);
      if (!client) {
        req.logger.info('Invalid client id (not found in database)');
        return res
          .status(400)
          .send('invalid_request');
      }

      if ((permissionsNumber | client.permissionsNumber) !== client.permissionsNumber) {
        req.logger.info('Invalid scopes provided');
        return res
          .status(400)
          .send('invalid_request');
      }

      if (!client.redirectURIs.includes(redirectUri)) {
        req.logger.info('Invalid redirect URI');
        return res
          .status(400)
          .send('invalid_request');
      }

      const tokenExpiry = DateTime.now().plus({ seconds: expiresIn }).toJSDate();
      if (responseType === 'id_token') {
        req.logger.error('id_token not implemented');
        return res
          .status(400)
          .send('unsupported_response_type');
      } else if (responseType === 'code') {
        const code = await generateCode(client.clientId, req.user!.userId, permissionsNumber, tokenExpiry, codeChallenge, redirectUri);
        const qStringParams = {
          code,
          state
        };
        return res.redirect(redirectUri + '?' + queryString.stringify(qStringParams));

        // } else if (responseType === 'token') {

      } else {
        req.logger.error(`UNKNOWN RESPONSE_TYPE: ${responseType} not implemented.`);
        return res.sendStatus(500);
      }
    } catch (e) {
      req.logger.error(e);
      res.sendStatus(500);
    }
  });

route.post('/token',
  isValidClientId(body('client_id')),
  body('client_secret').optional().isString().isLength({ min: 83, max: 83 }).custom(s => s.startsWith('xpkg_secret_')).withMessage('bad_secret').customSanitizer(s => s.replace(/^xpkg_secret_/, '')),
  body('grant_type').isString().custom(v => v === 'authorization_code').withMessage('bad_grant_type'),
  body('code').isString().isLength({ min: 32, max: 32 }).withMessage('bad_code'),
  body('redirect_uri').isString().notEmpty().withMessage('bad_redirect'),
  body('code_verifier').isString().isLength({ min: 8, max: 64 }).notEmpty().withMessage('bad_verifier'),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .json({
          error: 'invalid_request'
        });
    }

    const {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    } = matchedData(req) as {
      client_id: string;
      client_secret?: string;
      code: string;
      redirect_uri: string;
      code_verifier: string;
    };
    
    try {
      req.logger.setBindings({ clientId });

      const client = await getClient(clientId);
      if (!client) {
        req.logger.info('Provided client does not exist');
        return res
          .status(400)
          .json({
            error: 'invalid_client'
          });
      }

      if (client.currentUsers + 1 >= client.quota) {
        req.logger.info('Provided client has exceeded user quota');
        return res
          .status(400)
          .json({
            error: 'invalid_grant'
          });
      }

      if (client.isSecure) {
        if (!clientSecret) {
          req.logger.info('Client is secure but no secret provided');
          return res
            .status(400)
            .json({
              error: 'invalid_client'
            });
        }
    
        const isSecretValid = await Bun.password.verify(clientSecret!, client.secretHash, 'bcrypt');
        if (!isSecretValid) {
          req.logger.info('Client secret is invalid');
          return res
            .status(400)
            .json({
              error: 'invalid_client'
            });
        }
      } else
        req.logger.trace('Issuing token to non-secure client');

      genericSessionFunction(async session => {
        const codeData = await verifyCode(clientId, code, codeVerifier, redirectUri, session);
        if (!codeData) {
          req.logger.info('Invalid code provided');
          return res
            .status(400)
            .json({
              error: 'invalid_request'
            });
        }

        const user = await getUserFromId(codeData.userId);
        req.logger.setBindings({ userId: user.userId });

        const existingToken = await tokenDatabase.userHasToken(user.userId, clientId);
        const expireSeconds = DateTime.fromJSDate(codeData.tokenExpiry).diffNow('seconds');
        let token;
        if (!existingToken)
          token = await tokenDatabase.createToken(user.userId, client.clientId, client.name, TokenType.OAuth, codeData.permissionsNumber, expireSeconds, { session });
        else
          token = await tokenDatabase.regenerateToken(user.userId, existingToken.tokenId, codeData.tokenExpiry, session);

        if (clientId === DEVELOPER_PORTAL_CLIENT_ID && !user.isDeveloper) {
          req.logger.info('User enrolling in X-Pkg developer program for the first time');
          user.isDeveloper = true;
          await user.save({ session });
        }
        client.currentUsers += 1;
        await client.save({ session });
        await session.commitTransaction();

        res
          .status(200)
          .json({
            access_token: token,
            token_type: 'bearer',
            expires_in: expireSeconds.as('seconds')
          });
      });
    } catch (e) {
      req.logger.error(e);
      res.sendStatus(500);
    }
  });

route.get('/consentinformation',
  isValidClientId(query('client_id')),
  async (req: AuthorizedRequest, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { client_id: clientId } = matchedData(req) as {
      client_id: string;
    };

    req.logger.setBindings({
      clientId
    });
    const client = await getClient(clientId);
    if (!client) {
      req.logger.info('Invalid client id (not found in database)');
      return res
        .status(400)
        .send('invalid_client_id');
    }

    const autoConsent = clientId === DEVELOPER_PORTAL_CLIENT_ID && req.user!.isDeveloper;
    const information = {
      clientId,
      clientName: client.name,
      clientIcon: client.icon,
      clientDescription: client.description,
      userName: req.user!.name,
      userPicture: req.user!.profilePicUrl,
      autoConsent
    };

    req.logger.trace('Retrieved consent request information');
    res
      .status(200)
      .json(information);
  });

route.post('/tokenvalidate',
  validators.isValidTokenFormat(header('authorization')),
  isValidOAuthScope(body('scopes')),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Invalid token with message: ${message}`);
      return res.sendStatus(401);
    }

    const { authorization: token, scopes: permissionsNumber } = matchedData(req) as {
      authorization: string;
      scopes: bigint;
  };

    try {
      const tokenData = await tokenDatabase.validateToken(token, { deleteExpired: true });

      if (!tokenData)
        return res.sendStatus(401);

      if ((tokenData.permissionsNumber & permissionsNumber) !== permissionsNumber)
        res.sendStatus(401);
      res.sendStatus(204);
    } catch (e) {
      req.logger.error(e);
      res.sendStatus(500);
    }
  });

export default route;