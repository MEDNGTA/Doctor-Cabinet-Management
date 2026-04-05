import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Cache the postgres client on globalThis to reuse across hot reloads in dev
const globalForDb = globalThis as unknown as { pgClient: ReturnType<typeof postgres> | undefined };

const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL, {
  max: 10,              // connection pool size
  idle_timeout: 20,     // close idle connections after 20s
  connect_timeout: 10,  // fail fast on connection issues
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
