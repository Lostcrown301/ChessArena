import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { logger } from '../src/config/logger.js';
import { db } from '../src/db/client.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(currentDirectory, '../drizzle');

logger.info({ migrationsFolder }, 'Running Chess Arena database migrations');

// Neon HTTP migrations are applied statement-by-statement by Drizzle's migrator.
migrate(db, { migrationsFolder })
  .then(() => {
    logger.info('Chess Arena database migrations completed');
  })
  .catch((error) => {
    logger.error({ err: error }, 'Chess Arena database migrations failed');
    process.exit(1);
  });
