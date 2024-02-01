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

import { matchedData, param, query, validationResult, header } from 'express-validator';
import { Version } from '@xpkg/versioning';
import { validators } from '@xpkg/validation';
import { Router } from 'express';
import { dateToUTCHour } from '../util/dateUtil.js';
import * as packageDatabase from '../database/packageDatabase.js';
import * as analyticsDatabase from '../database/analyticsDatabase.js';
import NoSuchPackageError from '../errors/noSuchPackageError.js';
import { TokenScope, isTokenValidAny } from '@xpkg/auth-util';

const route = Router();

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

route.get('/:packageId/:packageVersion',
  validators.isPartialPackageId(param('packageId')),
  validators.asVersion(param('packageVersion')),
  query('after').trim().notEmpty().isInt({
    min: 1672531200000 // Sun, 01 Jan 2023 00:00:00 GMT
  }).toInt().withMessage('bad_after_date'),
  query('before').trim().notEmpty().isInt({
    min: 1672531260000 // Sun, 01 Jan 2023 00:01:00 GMT
  }).toInt().optional().withMessage('bad_before_date'),
  validators.isValidTokenFormat(header('authorization')),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const message = result.array()[0].msg;
      req.logger.trace(`Validation failed with message: ${message}`);
      return res
        .status(400)
        .send(message);
    }

    const validatedFields = matchedData(req) as {
      packageVersion: Version;
      packageId: string;
      after?: number;
      before?: number;
      authorization: string;
    };
    const { packageId, packageVersion, authorization: token } = validatedFields;

    const isTokenValid = await isTokenValidAny(token, TokenScope.DeveloperPortal, TokenScope.RegistryViewAnalytics);
    if (!isTokenValid) {
      req.logger.info('Insufficient permission to get analytics');
      return res.sendStatus(401);
    }
    const authorId = isTokenValid;

    let after = new Date(validatedFields.after ?? Date.now() - ONE_DAY_MS);
    let before = validatedFields.before ? new Date(validatedFields.before) : new Date(after.getTime() + ONE_DAY_MS);

    after = dateToUTCHour(after);
    before = dateToUTCHour(before);

    if (after > before) {
      req.logger.trace('After date is after before date (bad_date_combo)');
      return res
        .status(400)
        .send('bad_date_combo');
    }

    const difference = before.valueOf() - after.valueOf();
    if (difference < ONE_HOUR_MS) {
      req.logger.info({
        difference: `${difference}ms`
      }, 'Time difference is less than one hour (short_diff)');
      return res
        .status(400)
        .send('short_diff');
    }

    if (before.valueOf() - after.valueOf() > THIRTY_DAYS_MS) {
      req.logger.info({
        difference: `${difference}ms`
      }, 'Time difference is greater than 30 days (long_diff)');
      return res
        .status(400)
        .send('long_diff');
    }

    req.logger.setBindings({
      after: after.toUTCString(),
      before: before.toUTCString()
    });

    try {
      const [packageData] = await Promise.all([
        packageDatabase.getPackageData(packageId),
        packageDatabase.getVersionData(packageId, packageVersion)
      ]);

      if (packageData.authorId !== authorId) {
        req.logger.info('Author does not own package');
        return res.sendStatus(401);
      }

      const analytics = await analyticsDatabase.getVersionAnalyticsData(packageId, packageVersion, after, before);
      req.logger.trace('Got analytics');

      res
        .status(200)
        .json(analytics);
    } catch (e) {
      if (e instanceof NoSuchPackageError) {
        req.logger.info(e, 'Attempted to get version data for non-existent package');
        return res.sendStatus(401);
      }

      req.logger.error(e);
      return res.sendStatus(500);
    }
  });

export default route;