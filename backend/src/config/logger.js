import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.logLevel,
  // Pretty logs are kept development-only so production logs remain structured JSON.
  transport:
    env.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});
