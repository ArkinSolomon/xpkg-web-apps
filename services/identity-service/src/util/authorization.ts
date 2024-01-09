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

/**
 * A request with the user that made the request identified by their token.
 * 
 * @interface AuthorizedRequest
 * @extends {Request}
 * @property {Omit<UserData, 'hash'>} [user] The user that made the request.
 */
export interface AuthorizedRequest extends Request {
  user?: Omit<UserData, 'hash'>;
}

import { Request, Response, NextFunction } from 'express';
import { validateXisToken } from '../database/tokenDatabase.js';
import { UserData } from '../database/models/userModel.js';
import { getUserFromId } from '../database/userDatabase.js';
import { isValidTokenFormat } from '@xpkg/validation/src/validators.js';
import { header } from 'express-validator';

export default async function (req: AuthorizedRequest, res: Response, next: NextFunction) {
  const result = await isValidTokenFormat(header('authorization')).run({
    headers: {
      authorization: req.headers.authorization ?? req.cookies.token
    }
  });

  if (!result.isEmpty()) {
    req.logger.trace('Invalid authorization header or token cookie format, message: ' + result.array()[0].msg);
    return res.sendStatus(401);
  }

  try {
    const userId = await validateXisToken(req.headers.authorization ?? req.cookies.token);
    if (!userId) {
      req.logger.trace('Invalid token provided');
      return res.sendStatus(401);
    }

    req.logger.setBindings({
      userId
    });
    req.logger.trace('User authorized');
    (req as AuthorizedRequest).user = await getUserFromId(userId);
    req.logger.trace('Got user information from database');
    next();
  } catch (e) {
    req.logger.error(e);
    res.sendStatus(500);
  }
}