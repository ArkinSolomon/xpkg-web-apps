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
import { pino } from 'pino';

let level;
if (process.env.LOG_LEVEL) 
  level = process.env.LOG_LEVEL;
else 
  level = process.env.NODE_ENV === 'production' ? 'info' : 'trace';

const logger = pino({ level });

export default logger;