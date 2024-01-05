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
import { logger, sendEmail } from '@xpkg/backend-util';
import { validators } from '@xpkg/validation';
import { Router, Response } from 'express';
import { body, query, matchedData, validationResult } from 'express-validator';
import { AuthorizedRequest } from '../../util/authorization.js';
import * as tokenDatabase from '../../database/tokenDatabase.js';
import * as userDatabase from '../../database/userDatabase.js';
import genericSessionFunction from '../../database/genericSessionFunction.js';
import { TokenScope } from '../../database/models/tokenModel.js';
import NoSuchRequestError from '../../errors/noSuchRequestError.js';
import XpkgError from '../../errors/xpkgError.js';

const route = Router();

route.post('/changeemail', async (req: AuthorizedRequest, res) => {
  try {
    await genericSessionFunction(async session => {
      const changeRequestId = await userDatabase.createEmailChangeRequest(req.user!.userId, req.user!.email, session);
      req.logger.setBindings({ changeRequestId });
      req.logger.trace('Created request id');

      const changeRequestToken = await tokenDatabase.createChangeRequestToken(req.user!.userId, changeRequestId, session);
      req.logger.debug({ changeRequestId }, 'Successfully created email change request and token, sending email');

      await session.commitTransaction();

      await sendEmail(req.user!.email, 'Email Change Request', `Hi ${req.user!.name},\n\nTo change your email, click the following link http://127.0.0.1:3000/changeemail?token=${changeRequestToken}. This link expires in one hour.`);
      res.sendStatus(204);
    });
  } catch (e) {
    req.logger.error(e);
    res.sendStatus(500);
  }
});

route.get('/changeemail/data',
  validators.isValidTokenFormat(query('token')),
  async (req: AuthorizedRequest, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.info(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { token } = matchedData(req) as { token: string; };
    try {
      await genericSessionFunction(async session => {
        const requestToken = await tokenDatabase.getToken(token, TokenScope.EmailChange, { session, deleteExpired: true });
        if (!requestToken || !requestToken.data) {
          req.logger.info('Invalid or expired token provided');
          return res.sendStatus(401);
        }
        await session.commitTransaction();

        req.logger.setBindings({ userId: requestToken.userId, requestId: requestToken.data });
        const data = await userDatabase.getEmailChangeRequestData(requestToken.userId, requestToken.data!);
        res
          .status(200)
          .json(data);
      });
    } catch (e) {
      if (e instanceof NoSuchRequestError) {
        req.logger.error(e, 'No such email change request found');

        // This is an error since this means a request token exists without a request
        res.sendStatus(500);
      } else if (e instanceof XpkgError) {
        req.logger.info(e, 'Can not redo step 1');
        res
          .status(400)
          .send('no_step_1');
      } else {
        req.logger.error(e);
        res.sendStatus(500);
      }
    }
  });

// Input new email and send code
route.post('/changeemail/step1',
  validators.isValidTokenFormat(body('token')),
  validators.isValidEmail(body('newEmail')),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.info(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { token, newEmail } = matchedData(req) as { token: string; newEmail: string; };
    try {
      await genericSessionFunction(async session => {
        const requestToken = await tokenDatabase.getToken(token, TokenScope.EmailChange, { session, deleteExpired: true });
        if (!requestToken || !requestToken.data) {
          req.logger.info('Invalid or expired token provided');
          return res.sendStatus(401);
        }
        req.logger.setBindings({ userId: requestToken.userId, requestId: requestToken.data });
        req.logger.trace('Token provided is valid, and data retrieved');

        const user = await userDatabase.getUserFromId(requestToken.userId);
        if (user.email === newEmail) {
          req.logger.info('User attempted to set new email to be same as old email');
          return res
            .status(400)
            .send('same_email');
        }

        const inUse = await userDatabase.emailExists(newEmail);
        if (inUse) {
          req.logger.info('User attempted to change email to one that is in use');
          return res
            .status(400)
            .send('in_use');
        }

        const code = await userDatabase.addNewEmailToChangeRequest(requestToken.userId, requestToken.data!, newEmail, session);
        await session.commitTransaction();

        req.logger.trace('Generated code for email change');
        await sendEmail(newEmail, 'Email verification code', `Hello ${user.name}, Here is the code to verify your email ${code}. It expires when the change request expires.`);
        res.sendStatus(204);
      });
    } catch (e) {
      if (e instanceof NoSuchRequestError) {
        req.logger.info(e, 'No such email change request found');
        res.sendStatus(500);
      } else if (e instanceof XpkgError) {
        req.logger.info(e, 'Can not redo step 1');
        res
          .status(400)
          .send('no_redo');
      } else {
        req.logger.error(e);
        res.sendStatus(500);
      }
    }
  });

// Input new email code
route.post('/changeemail/step2',
  validators.isValidTokenFormat(body('token')),
  body('code').isInt({
    min: 100000,
    max: 999999
  }).withMessage('no_code'),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.info(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { token, code } = matchedData(req) as { token: string; code: number; };
    try {
      await genericSessionFunction(async session => {
        const requestToken = await tokenDatabase.getToken(token, TokenScope.EmailChange, { session, deleteExpired: true });
        if (!requestToken || !requestToken.data) {
          req.logger.info('Invalid or expired token provided');
          return res.sendStatus(401);
        }
        req.logger.setBindings({ userId: requestToken.userId, requestId: requestToken.data });
        req.logger.trace('Token provided is valid, and data retrieved');

        const { valid: isCodeValid, originalEmail, newEmail, name } = await userDatabase.checkEmailChangeRequestCode(requestToken.userId, requestToken.data!, code, session);
        if (!isCodeValid) {
          req.logger.info('Invalid code recieved');
          return res
            .status(400)
            .send('invalid_code');
        }

        await tokenDatabase.deleteToken(requestToken.userId, requestToken.tokenId, session);
        await tokenDatabase.deleteXisTokens(requestToken.userId, session);
        await Promise.all([
          session.commitTransaction(),
          sendEmail(originalEmail!, 'X-Pkg Email Address Changed', `Hello ${name!},\n\nYour email has successfully been changed to ${newEmail}. X-Pkg communications will no longer be sent to this email.`),
          sendEmail(newEmail!, 'X-Pkg Email Address Changed', `Hello ${name!},\n\nThis is now your new email. X-Pkg communications will no longer be sent to your old email. This email address has already been verified.`)
        ]);
        logger.trace('Changed emails and sent notifications');
        res.sendStatus(204);
      });
    } catch (e) {
      if (e instanceof NoSuchRequestError) {
        req.logger.info(e, 'No such email change request found');
        res.sendStatus(500);
      } else if (e instanceof XpkgError) {
        req.logger.info(e, 'Step 1 is not complete');
        res
          .status(400)
          .send('no_step_1');
      } else {
        req.logger.error(e);
        res.sendStatus(500);
      }
    }
  });

route.post('/verify',
  validators.isValidTokenFormat(body('token')),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.info(`Bad request with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const { token } = matchedData(req) as { token: string; };

    genericSessionFunction(async session => {
      const requestToken = await tokenDatabase.getToken(token, TokenScope.EmailVerification, { session, deleteExpired: true, consume: true });
      if (!requestToken) {
        req.logger.info('Invalid or expired token provided');
        return res.sendStatus(401);
      }
      req.logger.trace('Email verification token consumed');

      await userDatabase.verifyEmail(requestToken.userId, session);
      await session.commitTransaction();

      req.logger.trace('User marked as verified in database, sending email...');
      await sendEmail(requestToken.data!, 'Thanks for verifying your email address!', 'Your email address has been successfully verified.');
      res.sendStatus(204);
    })
      .catch(e => {
        req.logger.error(e);
        res.sendStatus(500);
      });
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

export default route;

/**
 * Send a verification email to the user.
 * 
 * @async
 * @param {string} userId The id of the user to send the verification email to.
 * @param {string} name The name of the user.
 * @param {string} email The email of the user to send the verification email to.
 * @returns {Promise<void>} A promise which resolves when the operation completes successfully.
 */
export async function sendVerificationEmail(userId: string, name: string, email: string): Promise<void> {
  const verificationToken = await tokenDatabase.createEmailVerificationToken(userId, email);
  return sendEmail(email, 'Verify X-Pkg Email Address', `Hello ${name},\n\nVerify your email address by clicking the following link: http://127.0.0.1:3000/verify?token=${verificationToken}`);
}