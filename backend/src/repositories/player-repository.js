import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { players } from '../db/schema.js';

export async function createPlayer({ id, displayName }, database = db) {
  const values = id ? { id, displayName } : { displayName };
  const [player] = await database.insert(players).values(values).returning();
  return player;
}

export async function findPlayerById(id, database = db) {
  const [player] = await database.select().from(players).where(eq(players.id, id)).limit(1);
  return player ?? null;
}

export async function listPlayers({ limit = 50, offset = 0 } = {}, database = db) {
  return database
    .select()
    .from(players)
    .orderBy(asc(players.createdAt), asc(players.displayName))
    .limit(limit)
    .offset(offset);
}
