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
import { Router } from 'express';
import { body, matchedData, validationResult } from 'express-validator';
import { validators } from '@xpkg/validation';
import { logger, verifyRecaptcha } from '@xpkg/backend-util';
import * as tokenDatabase from '../database/tokenDatabase.js';
import * as userDatabase from '../database/userDatabase.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';
import { AuthorizedRequest } from '../util/authorization.js';

const route = Router();

route.post('/create',
  validators.isValidEmail(body('email')),
  validators.isValidName(body('name')),
  validators.isValidPassword(body('password')),
  body('validation').notEmpty(),
  async (req, res) => {
    const routeLogger = logger.child({
      ip: req.ip,
      route: '/account/create',
      requestId: req.id
    });

    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      routeLogger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { email, password, name, validation } = matchedData(req) as {
      email: string;
      password: string;
      name: string;
      validation: string;
    };

    try {
      if (!validation || !(await verifyRecaptcha(validation, req.ip || 'unknown', 'create', 0))) {
        routeLogger.trace('ReCAPTCHA validation failed');
        return res.sendStatus(418);
      }

      const isInUse = await userDatabase.nameOrEmailExists(name, email);

      if (isInUse) {
        routeLogger.info(`Key already in use: ${isInUse}`);
        return res
          .status(403)
          .send(isInUse);
      }

      const hash = await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 12
      });
      const user = await userDatabase.createUser(
        name,
        email,
        hash
      );

      routeLogger.setBindings({
        newUserId: user.userId
      });
      routeLogger.trace('New author account registered in database');
      const token = await tokenDatabase.createXisToken(user.userId);

      res.json({ token });
      routeLogger.info('New author account created');
    } catch (e) {
      routeLogger.error(e);
      return res.sendStatus(500);
    }
  });

route.post('/login',
  validators.isValidEmail(body('email')),
  validators.isValidPassword(body('password')),
  body('validation').notEmpty(),
  async (req, res) => {
    const routeLogger = logger.child({
      ip: req.ip,
      route: '/account/login',
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

    const { email, password, validation } = matchedData(req);

    try {
      if (!validation || !(await verifyRecaptcha(validation, req.ip || 'unknown', 'login', 0))) {
        routeLogger.info('ReCAPTCHA validation failed');
        return res.sendStatus(418);
      }

      const user = await userDatabase.getUserFromEmail(email);

      routeLogger.setBindings({ userId: user.userId });

      const isValid = await Bun.password.verify(password, user.hash);
      if (!isValid) {
        routeLogger.info('Wrong password');
        return res.sendStatus(401);
      }

      routeLogger.trace('Login credentials valid');
      const token = await tokenDatabase.createXisToken(user.userId);
      routeLogger.info('Successful login, token generated');

      res.json({ token });
    } catch (e) {
      if (e instanceof NoSuchAccountError) {
        routeLogger.info('No account with email');
        return res.sendStatus(401);
      }

      routeLogger.error(e);
      res.sendStatus(500);
    }
  });

route.post('/tokenvalidate', (req: AuthorizedRequest, res) => {
  const routeLogger = logger.child({
    ip: req.ip,
    route: '/account/tokenvalidate',
    requestId: req.id,
  });

  // Since this route is protected by middleware, if it gets to this point, the user has already been authorized
  routeLogger.info({ userId: req.user?.userId ?? '<NO USER ID>' }, 'Token is valid for this user!');
  return res.sendStatus(204);
});

route.get('/userdata', async (req: AuthorizedRequest, res) => {
  const routeLogger = logger.child({
    ip: req.ip,
    route: '/account/userdata',
    requestId: req.id,
  });

  try {
    res
      .status(200)
      .json({
        name: req.user!.name,
        created: req.user!.created.toISOString(),
        email: req.user!.email,
        emailVerified: req.user!.emailVerified,
        userId: req.user!.userId,
        profilePicture: req.user!.profilePicUrl,
        isDeveloper: req.user!.settings.isDeveloper,
        nameChangeDate: req.user!.nameChangeDate.toISOString()
      });
  } catch (e) {
    routeLogger.error(e);
    if (e instanceof NoSuchAccountError) {
      res.sendStatus(400);
    } else {
      res.sendStatus(500);
    }
  }
});

route.patch('/resetpfp', async (req: AuthorizedRequest, res) => {
  const routeLogger = logger.child({
    ip: req.ip,
    route: '/account/resetpfp',
    requestId: req.id,
  });

  routeLogger.trace('Updated user\'s profile picture to use Gravatar');

  try {
    await userDatabase.resetUserPfp(req.user!.email, req.user!.profilePicUrl);
    res.sendStatus(204);
  } catch (e) {
    routeLogger.error(e);
    res.sendStatus(500);
  }
});

export default route;