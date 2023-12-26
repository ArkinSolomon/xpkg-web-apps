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

/**
 * A request with the user that made the request identified by their token.
 * 
 * @interface AuthorizedRequest
 * @property {Omit<UserData, 'hash'>} [user] The user that made the request.
 */
export interface AuthorizedRequest extends Request {
  user?: Omit<UserData, 'hash'>;
}

import { Request, Response, NextFunction } from 'express';
import { validateXisToken } from '../database/tokenDatabase.js';
import { UserData } from '../database/models/userModel.js';
import { getUserFromId } from '../database/userDatabase.js';
import { logger } from '@xpkg/backend-util';

export default async function (req: AuthorizedRequest, res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    logger.trace({ ip: req.ip, requestId: req.id, }, 'No authorization header provided');
    return res.sendStatus(401);
  }

  const userId = await validateXisToken(req.headers.authorization!);
  if (!userId) {
    logger.trace({ ip: req.ip, requestId: req.id }, 'Invalid token provided');
    return res.sendStatus(401);
  }

  logger.trace({ ip: req.ip, requestId: req.id, userId }, 'User authorized');
  (req as AuthorizedRequest).user = await getUserFromId(userId);
  next();
}