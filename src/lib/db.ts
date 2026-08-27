import { Pool } from "pg";

export type Role = "SPONSOR" | "PHARMACY" | "ADMIN" | "SUPERADMIN";

export interface UserRow {
  id: string;
  role: Role;
  identifiant_unique: string;
  email: string | null;
  telephone: string | null;
  password_hash: string;
  statut: "active" | "suspendu";
  must_change_password: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
}

// Lazily-created connection pool, keyed off DATABASE_URL. Lazy so importing
// this module at build time (Next.js page-data collection touches every
// route) never fails just because no DB env var is configured yet.
let _pool: Pool | null = null;
function pool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Configure it in your hosting provider's environment variables."
      );
    }
    _pool = new Pool({
      connectionString,
      // Most managed Postgres providers (Render, Neon, etc.) require TLS but
      // present a certificate that isn't in Node's default trust store from
      // inside the app's own runtime; this matches the common relaxed-TLS
      // setting recommended by those providers for app-side connections.
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return _pool;
}

/**
 * Minimal tagged-template SQL helper, API-compatible with the subset of
 * `@netlify/database`'s `db.sql` used throughout this codebase: interpolated
 * values become parameterized placeholders, and the call resolves to an
 * array of row objects.
 *
 * Typed as `any` on purpose: query row shapes are annotated individually at
 * each call site, and a generic index-signature return type doesn't
 * structurally satisfy those specific shapes without a duplicate cast at
 * every call site (see git history for the longer explanation).
 */
async function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<any> {
  let text = "";
  strings.forEach((chunk, i) => {
    text += chunk;
    if (i < values.length) text += `$${i + 1}`;
  });
  const result = await pool().query(text, values);
  return result.rows;
}

export const db: { sql: any; pool: Pool } = {
  sql,
  get pool() {
    return pool();
  },
};
