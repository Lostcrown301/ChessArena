import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { logger } from '../src/config/logger.js';
import { db, databaseConnection } from '../src/db/connection.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(currentDirectory, '../drizzle');

logger.info({ migrationsFolder }, 'Running Chess Arena database migrations');

// Postgres migrations are applied by Drizzle's migrator.
migrate(db, { migrationsFolder })
  .then(() => {
    logger.info('Chess Arena database migrations completed');
    return databaseConnection.pool.end();
  })
  .catch((error) => {
    logger.error({ err: error }, 'Chess Arena database migrations failed');
    process.exit(1);
  });
