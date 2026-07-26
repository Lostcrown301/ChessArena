import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../config/env.js';
import * as schema from './schema.js';

export function createDatabaseConnection(databaseUrl = env.databaseUrl) {
  const sql = neon(databaseUrl);
  const database = drizzle(sql, { schema });

  return {
    db: database,
    sql,
  };
}

export const databaseConnection = createDatabaseConnection();
export const db = databaseConnection.db;
