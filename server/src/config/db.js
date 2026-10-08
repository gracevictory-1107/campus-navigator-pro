import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const useMemory = !process.env.DATABASE_URL || process.env.DB_DRIVER === 'memory';

let pool;
let driverName;

if (useMemory) {
  // ----- In-memory PostgreSQL fallback (pg-mem) -----
  // Lets the backend run and be demonstrated without a local Postgres
  // install. The exact same parameterized SQL is used as on real Postgres.
  const { newDb } = await import('pg-mem');
  const db = newDb({ autoCreateForeignKeyIndices: true });
  const pg = db.adapters.createPg();
  pool = new pg.Pool();
  await pool.query(schemaSql);
  driverName = 'pg-mem (in-memory)';
} else {
  // ----- Real PostgreSQL -----
  const pg = await import('pg');
  pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(schemaSql);
  driverName = 'pg (PostgreSQL)';
}

/**
 * Run a parameterized query. Always pass user input via params
 * ($1, $2, ...) - never string-concatenate SQL.
 */
export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function getDriverName() {
  return driverName;
}

export default pool;
