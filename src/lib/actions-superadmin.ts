"use server";

import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession, hashPassword } from "./auth";
import { logAudit } from "./audit";
import { generateUserIdentifiant } from "./ids";

function randomTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + "!1";
}

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") redirect("/connexion?role=SUPERADMIN");
  return session;
}

export async function createAdminAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const telephone = String(formData.get("telephone") || "").trim();
  if (!email) redirect("/super-admin/administrateurs?erreur=validation");

  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) redirect("/super-admin/administrateurs?erreur=email_existe");

  let identifiant = "";
  for (let i = 0; i < 5; i++) {
    identifiant = generateUserIdentifiant("ADMIN");
    const exists = await db.sql`SELECT 1 FROM users WHERE identifiant_unique = ${identifiant}`;
    if (exists.length === 0) break;
  }
  const tempPassword = randomTempPassword();
  const password_hash = await hashPassword(tempPassword);

  await db.sql`
    INSERT INTO users (role, identifiant_unique, email, telephone, password_hash, must_change_password)
    VALUES ('ADMIN', ${identifiant}, ${email}, ${telephone}, ${password_hash}, true)
  `;

  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "creation_administrateur", entite: "users", resultat: "succes", details: { identifiant, email } });

  redirect(`/super-admin/administrateurs?cree=${identifiant}:${tempPassword}`);
}

export async function toggleUserStatusAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const userId = String(formData.get("user_id") || "");
  const nextStatut = String(formData.get("next_statut") || "") as "active" | "suspendu";
  const redirectTo = String(formData.get("redirect_to") || "/super-admin/administrateurs");

  await db.sql`UPDATE users SET statut = ${nextStatut}, updated_at = now() WHERE id = ${userId}`;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: nextStatut === "suspendu" ? "suspension_compte" : "reactivation_compte", entite: "users", entiteId: userId, resultat: "succes" });

  redirect(redirectTo);
}

export async function createPharmacieAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const nomCommercial = String(formData.get("nom_commercial") || "").trim();
  if (!email || !nomCommercial) redirect("/super-admin/pharmacies?erreur=validation");

  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) redirect("/super-admin/pharmacies?erreur=email_existe");

  let identifiant = "";
  for (let i = 0; i < 5; i++) {
    identifiant = generateUserIdentifiant("PHARMACY");
    const exists = await db.sql`SELECT 1 FROM users WHERE identifiant_unique = ${identifiant}`;
    if (exists.length === 0) break;
  }
  const tempPassword = randomTempPassword();
  const password_hash = await hashPassword(tempPassword);

  const userRows = await db.sql`
    INSERT INTO users (role, identifiant_unique, email, telephone, password_hash, must_change_password)
    VALUES ('PHARMACY', ${identifiant}, ${email}, ${String(formData.get("telephone") || "")}, ${password_hash}, true)
    RETURNING id
  `;
  await db.sql`
    INSERT INTO pharmacies (user_id, identifiant_unique, nom_commercial, pharmacien_titulaire, adresse, commune, ville, region, statut)
    VALUES (
      ${userRows[0].id}, ${identifiant}, ${nomCommercial}, ${String(formData.get("pharmacien_titulaire") || "")},
      ${String(formData.get("adresse") || "")}, ${String(formData.get("commune") || "")}, ${String(formData.get("ville") || "Abidjan")},
      ${String(formData.get("region") || "")}, 'pilote'
    )
  `;

  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "creation_pharmacie", entite: "pharmacies", resultat: "succes", details: { identifiant, nomCommercial } });

  redirect(`/super-admin/pharmacies?cree=${identifiant}:${tempPassword}`);
}

export async function updatePharmacieStatutAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const pharmacieId = String(formData.get("pharmacie_id") || "");
  const statut = String(formData.get("statut") || "");

  await db.sql`UPDATE pharmacies SET statut = ${statut} WHERE id = ${pharmacieId}`;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "modification_statut_pharmacie", entite: "pharmacies", entiteId: pharmacieId, resultat: "succes", details: { statut } });

  redirect("/super-admin/pharmacies");
}

export async function updateSystemParamAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const cle = String(formData.get("cle") || "");
  const valeur = String(formData.get("valeur") || "");
  if (!cle) redirect("/super-admin/parametres");

  await db.sql`
    UPDATE system_params SET valeur = ${valeur}, updated_at = now(), updated_by = ${session.userId} WHERE cle = ${cle}
  `;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "modification_parametre", entite: "system_params", entiteId: cle, resultat: "succes", details: { valeur } });

  redirect("/super-admin/parametres");
}

export async function runManualBackupAction(): Promise<void> {
  const session = await requireSuperAdmin();
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "sauvegarde_manuelle", resultat: "succes", details: { note: "Sauvegarde manuelle simulée dans ce prototype — l'hébergeur de production assure les sauvegardes automatiques réelles." } });
  redirect("/super-admin/parametres?sauvegarde=1");
}
