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
import { Router } from 'express';
import { body, matchedData, validationResult } from 'express-validator';
import { validators } from '@xpkg/validation';
import {logger, verifyRecaptcha} from '@xpkg/backend-util';
import * as tokenDatabase from '../database/tokenDatabase.js';
import * as userDatabase from '../database/userDatabase.js';
import NoSuchAccountError from '../errors/noSuchAccountError.js';

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
      routeLogger.trace(`Validation failed with message: ${message}`);
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
      if (!(await verifyRecaptcha(validation, req.ip || 'unknown'))) {
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
      const token = tokenDatabase.createXISToken(user.userId);

      routeLogger.trace('Generated auth and verification tokens');

      // author.sendEmail('Welcome to X-Pkg', `Welcome to X-Pkg!\n\nTo start uploading packages or resources to the portal, you need to verify your email first: http://localhost:3001/verify/${verificationToken} (this link expires in 24 hours).`);
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
      logger.info(`Request failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { email, password, validation } = matchedData(req);

    try {
      if (!(await verifyRecaptcha(validation, req.ip || 'unknown'))) {
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
      const token = await tokenDatabase.createXISToken(user.userId);
      routeLogger.info('Successful login, token generated');

      res.json({ token });

      // await author.sendEmail('New Login', `There was a new login to your X-Pkg account from ${req.ip}`);
    } catch (e) {
      if (e instanceof NoSuchAccountError) {
        routeLogger.info('No account with email');
        return res.sendStatus(401);
      }

      routeLogger.error(e);
      res.sendStatus(500);
    }
  });

// route.post('/verify/:verificationToken',
//   param('verificationToken').trim().notEmpty(),
//   body('validation').trim().notEmpty(),
//   async (req, res) => {

//     const result = validationResult(req);
//     if (!result.isEmpty()) {
//       logger.info('Request body field validation failed');
//       return res.sendStatus(400);
//     }

//     const { verificationToken, validation } = matchedData(req);

//     const routeLogger = logger.child({
//       ip: req.ip,
//       route: '/auth/verify/:verificationToken',
//       id: req.id
//     });

//     const isTokenValid = await verifyRecaptcha(validation, req.ip as string);
//     if (!isTokenValid) {
//       routeLogger.info('Could not validate reCAPTCHA token');
//       return res.sendStatus(418);
//     }

//     let authorId;
//     try {
//       const payload = await decode(verificationToken, process.env.EMAIL_VERIFY_SECRET as string) as AccountValidationPayload;
//       authorId = payload.id;
//     } catch {
//       routeLogger.info(`Invalid token in verification request from ${req.ip}`);
//       return res.sendStatus(401);
//     }

//     routeLogger.setBindings({
//       authorId
//     });

//     try {
//       const isVerified = await authorDatabase.isVerified(authorId);
//       if (isVerified) {
//         routeLogger.info('Author already verified, can not reverify');
//         return res.sendStatus(403);
//       }

//       routeLogger.trace('Will attempt to set the verification status of the author to true');
//       await authorDatabase.verify(authorId);
//       routeLogger.info('Verification status changed');
//       res.sendStatus(204);
//     } catch (e) {
//       routeLogger.error(e);
//       res.sendStatus(500);
//     }
//   });

export default route;