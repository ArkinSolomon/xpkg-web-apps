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
import { logger, verifyRecaptcha } from '@xpkg/backend-util';
import * as tokenDatabase from '../database/tokenDatabase.js';
import * as userDatabase from '../database/userDatabase.js';
import * as clientDatabase from '../database/clientDatabase.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';
import { AuthorizedRequest } from '../util/authorization.js';
import { validators } from '@xpkg/validation';
import email, { sendVerificationEmail } from './account/email.js';

const route = Router();

route.use('/email', email);

route.post('/create',
  validators.isValidEmail(body('email')),
  validators.isValidName(body('name')),
  validators.isValidPassword(body('password')),
  body('validation').notEmpty(),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Bad request with message: ${message}`);
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
        req.logger.trace('ReCAPTCHA validation failed');
        return res.sendStatus(418);
      }

      const isInUse = await userDatabase.nameOrEmailExists(name, email);

      if (isInUse) {
        req.logger.info(`Key already in use: ${isInUse}`);
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

      req.logger.setBindings({
        newUserId: user.userId
      });
      req.logger.trace('New author account registered in database');
      const token = await tokenDatabase.createXisToken(user.userId);
      await sendVerificationEmail(user.userId, user.name, user.email);

      res.json({ token });
      req.logger.info('New author account created');
    } catch (e) {
      req.logger.error(e);
      return res.sendStatus(500);
    }
  });

route.post('/login',
  validators.isValidEmail(body('email')),
  validators.isValidPassword(body('password')),
  body('validation').notEmpty(),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { email, password, validation } = matchedData(req);

    try {
      if (!validation || !(await verifyRecaptcha(validation, req.ip || 'unknown', 'login', 0))) {
        req.logger.info('ReCAPTCHA validation failed');
        return res.sendStatus(418);
      }

      const user = await userDatabase.getUserFromEmail(email);

      req.logger.setBindings({ userId: user.userId });

      const isValid = await Bun.password.verify(password, user.hash);
      if (!isValid) {
        req.logger.info('Wrong password');
        return res.sendStatus(401);
      }

      req.logger.trace('Login credentials valid');
      const token = await tokenDatabase.createXisToken(user.userId);
      req.logger.info('Successful login, token generated');

      res.json({ token });
    } catch (e) {
      if (e instanceof NoSuchAccountError) {
        req.logger.info('No account with email');
        return res.sendStatus(401);
      }

      req.logger.error(e);
      res.sendStatus(500);
    }
  });
  
route.get('/userdata', async (req: AuthorizedRequest, res) => {
  try {
    let oauthClients: Awaited<ReturnType<typeof clientDatabase.getUserClients>> = [];
    if (req.user!.isDeveloper) 
      oauthClients = await clientDatabase.getUserClients(req.user!.userId);

    res
      .status(200)
      .json({
        name: req.user!.name,
        created: req.user!.created.toISOString(),
        email: req.user!.email,
        emailVerified: req.user!.emailVerified,
        userId: req.user!.userId,
        profilePicture: req.user!.profilePicUrl,
        isDeveloper: req.user!.isDeveloper,
        nameChangeDate: req.user!.nameChangeDate.toISOString(),
        oauthClients,
        limits: req.user!.limits
      });
  } catch (e) {
    req.logger.error(e);
    if (e instanceof NoSuchAccountError)
      res.sendStatus(400);
    else
      res.sendStatus(500);

  }
});

route.patch('/resetpfp', async (req: AuthorizedRequest, res) => {
  try {
    await userDatabase.resetUserPfp(req.user!.email, req.user!.profilePicUrl);
    req.logger.trace('Updated user\'s profile picture to use Gravatar');
    res.sendStatus(204);
  } catch (e) {
    req.logger.error(e);
    res.sendStatus(500);
  }
});

route.patch('/name',
  validators.isValidName(body('newName')),
  async (req: AuthorizedRequest, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { newName } = matchedData(req) as { newName: string; };

    if (req.user!.nameChangeDate.getTime() + 30 * 24 * 60 * 60 > Date.now()) {
      req.logger.trace('Can not change name, it has been less than 30 days');
      return res
        .status(400)
        .send('too_soon');
    }

    if (req.user!.name === newName)
      return res
        .status(400)
        .send('no_change');

    try {
      await userDatabase.changeName(req.user!.userId, newName);
      req.logger.trace({
        userId: req.user!.userId,
        name: req.user!.name,
        newName
      }, 'Changed name successfully');

      res.sendStatus(204);
    } catch (e) {
      logger.error(e);
      res.sendStatus(500);
    }
  });

export default route;