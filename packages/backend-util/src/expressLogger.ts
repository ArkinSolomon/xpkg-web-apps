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

declare global {
  namespace Express {

    /**
     * An extension of Express's default request to allow supporting data and the logger.
     * 
     * @interface Request
     * @namespace Express
     * @property {Logger} logger The logger of the request.
     * @property {string} id The identifier of the request.
     * @property {number} startTime The time at which the request was made, from the Unix epoch using {@link Performance#now}.
     */
    interface Request {
      logger: Logger;
      id: string;
      startTime: number;
    }
  }
}

import logger from './logger.js';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';

/**
 * Create a middleware to log the request recieved and status code of the route, as well attach a logger to the function.
 * 
 * @param {() => string} genRequestId A function which generates the id of the request.
 * @returns A new middleware function.
 */
export default function (genRequestId: () => string) {
  return function (req: Request, res: Response, next: NextFunction) {
    req.startTime = performance.now();
    req.id = genRequestId();
    res.setHeader('X-Request-Id', req.id);
    req.logger = logger.child({
      url: req.url.split(/[#?]/)[0],
      requestId: req.id,
      ip: req.ip
    });

    req.logger.info({ method: req.method }, 'Recieved HTTP request');
    res.once('finish', () => {
      req.logger.info({
        responseTimeMs: performance.now() - req.startTime,
        statusCode: res.statusCode,
        etag: res.getHeader('etag')
      }, 'Request complete');
    });
    
    next();
  };
}