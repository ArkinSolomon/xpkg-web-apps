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
import { logger, sendEmail, verifyRecaptcha } from '@xpkg/backend-util';
import * as tokenDatabase from '../database/tokenDatabase.js';
import * as userDatabase from '../database/userDatabase.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';
import { AuthorizedRequest } from '../util/authorization.js';
import { isValidEmail, isValidName, isValidTokenFormat } from '@xpkg/validation/src/validators.js';
import { XIS_CLIENT_ID } from '../database/clientDatabase.js';
import { alphaNanoid } from '@xpkg/validation/src/identifiers.js';
import { TokenScope, TokenType } from '../database/models/tokenModel.js';
import { createPermissionsNumber } from '../util/permissionNumberUtil.js';

const route = Router();

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

route.post('/tokenvalidate', (req: AuthorizedRequest, res) => {
  // Since this route is protected by middleware, if it gets to this point, the user has already been authorized
  req.logger.info({ userId: req.user?.userId ?? '<NO USER ID>' }, 'Token is valid for this user!');
  return res.sendStatus(204);
});

route.get('/userdata', async (req: AuthorizedRequest, res) => {
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
    req.logger.error(e);
    if (e instanceof NoSuchAccountError) 
      res.sendStatus(400);
    else 
      res.sendStatus(500);
    
  }
});

route.post('/verify', isValidTokenFormat(body('token')), async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result.array()[0].msg;
    req.logger.info(`Bad request with message: ${message}`);
    return res
      .status(400)
      .send(message);
  }

  const { token } = matchedData(req) as { token: string; };
  const consumedToken = await tokenDatabase.consumeActionToken(token);
  if (!consumedToken) {
    req.logger.info('Invalid or expired token provided');
    return res.sendStatus(401);
  } 
  req.logger.trace('Email verification token consumed');

  try {
    await userDatabase.verifyEmail(consumedToken.userId);
    req.logger.trace('User marked as verified in database, sending email...');
    await sendEmail(consumedToken.data!, 'Thanks for verifying your email address!', 'Your email address has been successfully verified.');
    res.sendStatus(204);
  } catch (e) {
    req.logger.error(e);
    res.sendStatus(500);
  }
});

route.post('/resend', async (req: AuthorizedRequest, res) => {
  if (req.user!.emailVerified) {
    req.logger.info('Can not resend verification email, already verified');
    return res.sendStatus(400);
  }

  try {
    await sendVerificationEmail(req.user!.userId, req.user!.name, req.user!.email);
    req.logger.trace('Resent verification email');
    return res.sendStatus(204);
  } catch (e) {
    req.logger.error(e);
    return res.sendStatus(500);
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

route.patch('/name', isValidName(body('newName')), async (req: AuthorizedRequest, res) => {
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

route.patch('/email', isValidEmail(body('newEmail')), async (req: AuthorizedRequest, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result.array()[0].msg;
    req.logger.trace(`Bad request with message: ${message}`);
    return res
      .status(400)
      .send(message);
  }

  const { newEmail } = matchedData(req) as { newEmail: string; };

  try {
    await userDatabase.changeEmail(req.user!.userId, newEmail);
    req.logger.trace({
      userId: req.user!.userId
    }, 'Changed email successfully');

    res.sendStatus(204);
  } catch (e) {
    logger.error(e);
    res.sendStatus(500);
  }
});

/**
 * Send a verification email to the user.
 * 
 * @async
 * @param {string} userId The id of the user to send the verification email to.
 * @param {string} name The name of the user.
 * @param {string} email The email of the user to send the verification email to.
 * @returns {Promise<void>} A promise which resolves when the operation completes successfully.
 */
async function sendVerificationEmail(userId: string, name: string, email: string): Promise<void> {
  const verificationToken = await tokenDatabase.createEmailVerificationToken(userId, email);
  return sendEmail(email, 'Verify X-Pkg Email Address', `Hello ${name},\n\nVerify your email address by clicking the following link: http://127.0.0.1:3000/verify?token=${verificationToken}`);
}

export default route;