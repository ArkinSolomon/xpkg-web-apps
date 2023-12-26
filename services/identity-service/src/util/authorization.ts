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

export default async function (req: AuthorizedRequest, res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    res.sendStatus(401);
    return;
  }

  const userId = await validateXisToken(req.headers.authorization!);
  if (!userId) {
    res.sendStatus(401);
    return;
  }

  (req as AuthorizedRequest).user = await getUserFromId(userId);
  next();
}