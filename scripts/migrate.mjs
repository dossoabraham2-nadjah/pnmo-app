// Applies SQL migrations from netlify/database/migrations/<NNN_slug>/migration.sql
// in lexicographic order, tracking what's already applied in a _migrations table.
// Works against any Postgres reachable via DATABASE_URL (Render, Neon, etc.).
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "netlify", "database", "migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await pool.query(`SELECT name FROM _migrations`)).rows.map((r) => r.name)
  );

  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    if (applied.has(dir)) {
      console.log(`- ${dir} déjà appliquée`);
      continue;
    }
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    const sqlText = readFileSync(sqlPath, "utf8");
    console.log(`+ Application de ${dir}...`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sqlText);
      await client.query(`INSERT INTO _migrations (name) VALUES ($1)`, [dir]);
      await client.query("COMMIT");
      console.log(`  OK`);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(`  ÉCHEC de ${dir}:`, e.message);
      await pool.end();
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log("Migrations à jour.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
