/**
 * migrationRunner.js — Lightweight versioned SQL migration runner for Core & Modules.
 * Tracks applied versions and SHA-256 checksums in `schema_migrations` without external ORM bloat.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const computeChecksum = (sql) =>
  crypto.createHash('sha256').update(String(sql).replace(/\r\n/g, '\n')).digest('hex');

const ensureMigrationsTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      scope      TEXT NOT NULL,
      version    TEXT NOT NULL,
      checksum   TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (scope, version)
    );
  `);
};

const listMigrationPairs = (migrationsDir) => {
  if (!fs.existsSync(migrationsDir)) return [];
  const files = fs.readdirSync(migrationsDir).sort();
  return files
    .filter((f) => f.endsWith('.up.sql'))
    .map((upFile) => {
      const version = upFile.slice(0, -'.up.sql'.length);
      const downFile = `${version}.down.sql`;
      return {
        version,
        upPath: path.join(migrationsDir, upFile),
        downPath: path.join(migrationsDir, downFile),
      };
    });
};

/**
 * Applies pending `.up.sql` migrations for the specified scope ('core' or 'module:<id>').
 * @param {{ db: { query: Function }, scope: string, migrationsDir: string }} opts
 */
export const runMigrations = async ({ db, scope, migrationsDir }) => {
  await ensureMigrationsTable(db);
  const pairs = listMigrationPairs(migrationsDir);

  const existingRes = await db.query(
    `SELECT version, checksum FROM schema_migrations WHERE scope = $1 ORDER BY version ASC`,
    [scope]
  );
  const appliedMap = new Map(existingRes.rows.map((r) => [r.version, r.checksum]));

  const applied = [];
  const skipped = [];

  for (const item of pairs) {
    const upSql = fs.readFileSync(item.upPath, 'utf8');
    const checksum = computeChecksum(upSql);

    if (appliedMap.has(item.version)) {
      skipped.push(item.version);
      continue;
    }

    await db.query(upSql);
    await db.query(
      `INSERT INTO schema_migrations (scope, version, checksum, applied_at) VALUES ($1, $2, $3, NOW())`,
      [scope, item.version, checksum]
    );
    applied.push(item.version);
  }

  return { scope, applied, skipped };
};

/**
 * Rolls back the most recently applied migration for the specified scope using `.down.sql`.
 * @param {{ db: { query: Function }, scope: string, migrationsDir: string }} opts
 */
export const rollbackLastMigration = async ({ db, scope, migrationsDir }) => {
  await ensureMigrationsTable(db);
  const existingRes = await db.query(
    `SELECT version, checksum FROM schema_migrations WHERE scope = $1 ORDER BY version ASC`,
    [scope]
  );
  if (existingRes.rows.length === 0) {
    return { scope, rolledBack: null };
  }

  const latest = existingRes.rows[existingRes.rows.length - 1].version;
  const downPath = path.join(migrationsDir, `${latest}.down.sql`);
  if (!fs.existsSync(downPath)) {
    throw new Error(`Missing rollback script: ${downPath}`);
  }

  const downSql = fs.readFileSync(downPath, 'utf8');
  await db.query(downSql);
  await db.query(`DELETE FROM schema_migrations WHERE scope = $1 AND version = $2`, [
    scope,
    latest,
  ]);

  return { scope, rolledBack: latest };
};
