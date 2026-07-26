import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

export function createDatabaseConnection(databaseUrl = env.databaseUrl) {
  // We use pg.Pool instead of the stateless neon fetch client
  // to support full interactive transactions.
  const pool = new Pool({
    connectionString: databaseUrl,
    // Provide a sensible default pool configuration
    max: 20, // max number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const database = drizzle(pool, { schema });

  return {
    db: database,
    pool, // Export the pool so we can cleanly close it on app shutdown
  };
}

export const databaseConnection = createDatabaseConnection();
export const db = databaseConnection.db;
