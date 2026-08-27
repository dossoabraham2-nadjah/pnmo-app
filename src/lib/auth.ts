import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, Role } from "./db";

const SESSION_COOKIE = "pnmo_session";
const secretKey = process.env.SESSION_SECRET || "pnmo-dev-secret-change-in-production-please";
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  role: Role;
  identifiant: string;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireRole(roles: Role[]): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) return null;
  return session;
}

/** Verrouillage automatique après échecs répétés (CCFT Ch.18/20). */
export async function registerFailedLogin(userId: string) {
  const maxAttemptsRows = await db.sql`SELECT valeur FROM system_params WHERE cle = 'max_tentatives_connexion'`;
  const lockMinutesRows = await db.sql`SELECT valeur FROM system_params WHERE cle = 'duree_verrouillage_minutes'`;
  const maxAttempts = Number(maxAttemptsRows[0]?.valeur ?? 5);
  const lockMinutes = Number(lockMinutesRows[0]?.valeur ?? 15);

  const rows = await db.sql`
    UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = now()
    WHERE id = ${userId}
    RETURNING failed_login_attempts
  `;
  const attempts = rows[0]?.failed_login_attempts ?? 0;
  if (attempts >= maxAttempts) {
    await db.sql`
      UPDATE users SET locked_until = now() + (${lockMinutes} || ' minutes')::interval
      WHERE id = ${userId}
    `;
  }
}

export async function resetFailedLogin(userId: string) {
  await db.sql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ${userId}`;
}
