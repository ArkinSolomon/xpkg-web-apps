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
import { validators } from '@xpkg/validation';
import { header, matchedData, validationResult } from 'express-validator';
import { validateToken } from '../database/tokenDatabase.js';
import * as userDatabase from '../database/userDatabase.js';
import { TokenScope, hasAnyPermission } from '@xpkg/auth-util';

const route = Router();

route.get('/personalinformation', validators.isValidTokenFormat(header('authorization')), async (req, res) => { 
  const result = validationResult(req);
  if (!result.isEmpty()) {
    req.logger.info(`Authorization header validation failed with message: ${result.array()[0].msg}`);
    return res.sendStatus(401);
  }

  const { authorization: token } = matchedData(req) as { authorization: string; };
  const tokenData = await validateToken(token);
  if (!tokenData) {
    req.logger.info('Could not validate user\'s token');
    return res.sendStatus(401);
  }

  if (!hasAnyPermission(tokenData.permissionsNumber, TokenScope.DeveloperPortal, TokenScope.Store, TokenScope.Forum, TokenScope.IdentityViewAuthorEmail)) {
    req.logger.info('Token does not have sufficient permission to view user\'s email');
    return res.sendStatus(401);
  }
  const userData = await userDatabase.getUserFromId(tokenData.userId);

  res
    .status(200)
    .json({
      userId: userData.userId,
      userEmail: userData.email,
      emailVerified: userData.emailVerified,
      name: userData.name
    });
});

export default route;