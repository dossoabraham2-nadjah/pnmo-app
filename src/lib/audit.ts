import { db } from "./db";
import type { Role } from "./db";

interface AuditParams {
  userId?: string | null;
  role?: Role | null;
  identifiant?: string | null;
  action: string;
  entite?: string;
  entiteId?: string;
  resultat: "succes" | "echec";
  details?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Journal d'audit — écriture seule, jamais modifié ni supprimé, y compris par
 * le Super Administrateur (Exigence CCFT n°20).
 */
export async function logAudit(params: AuditParams) {
  await db.sql`
    INSERT INTO audit_log (user_id, role, identifiant_unique, action, entite, entite_id, resultat, details, ip)
    VALUES (
      ${params.userId ?? null},
      ${params.role ?? null},
      ${params.identifiant ?? null},
      ${params.action},
      ${params.entite ?? null},
      ${params.entiteId ?? null},
      ${params.resultat},
      ${params.details ? JSON.stringify(params.details) : null},
      ${params.ip ?? null}
    )
  `;
}
