import { randomBytes, randomInt } from "crypto";

function randomDigits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += randomInt(0, 10).toString();
  return s;
}

/** Identifiants uniques par profil, ex: SP-482913, PH-118204 */
export function generateUserIdentifiant(role: "SPONSOR" | "PHARMACY" | "ADMIN" | "SUPERADMIN"): string {
  const prefix = { SPONSOR: "SP", PHARMACY: "PH", ADMIN: "AD", SUPERADMIN: "SA" }[role];
  return `${prefix}-${randomDigits(6)}`;
}

export function generateBeneficiaireId(): string {
  return `BE-${randomDigits(6)}`;
}

export function generatePecNumero(): string {
  const y = new Date().getFullYear();
  return `PEC-${y}-${randomDigits(6)}`;
}

export function generateIncidentNumero(): string {
  const y = new Date().getFullYear();
  return `INC-${y}-${randomDigits(6)}`;
}

export function generatePaiementReference(): string {
  return `PAY-${Date.now().toString(36).toUpperCase()}-${randomDigits(4)}`;
}

/**
 * Code Unique de Commande / Retrait — généré par un générateur cryptographiquement
 * sûr, non prévisible, à usage unique (Exigence CCFT n°14).
 */
export function generateSecureCode(prefix: "CUC" | "CUR"): string {
  const bytes = randomBytes(8);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}
