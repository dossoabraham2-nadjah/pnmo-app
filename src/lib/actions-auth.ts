"use server";

import { redirect } from "next/navigation";
import { db, Role } from "./db";
import {
  createSession,
  destroySession,
  hashPassword,
  registerFailedLogin,
  resetFailedLogin,
  verifyPassword,
} from "./auth";
import { logAudit } from "./audit";
import { generateBeneficiaireId, generateUserIdentifiant } from "./ids";

const spaceHome: Record<Role, string> = {
  SPONSOR: "/sponsor",
  PHARMACY: "/pharmacie",
  ADMIN: "/admin",
  SUPERADMIN: "/super-admin",
};

export async function loginAction(formData: FormData): Promise<void> {
  const identifiant = String(formData.get("identifiant") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as Role;

  const rows = await db.sql`
    SELECT * FROM users
    WHERE (identifiant_unique = ${identifiant} OR email = ${identifiant}) AND role = ${role}
  `;
  const user = rows[0];

  if (!user) {
    await logAudit({ action: "connexion", role, resultat: "echec", details: { identifiant, raison: "utilisateur_inconnu" } });
    redirect(`/connexion?role=${role}&erreur=identifiants`);
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    await logAudit({ userId: user.id, role, identifiant: user.identifiant_unique, action: "connexion", resultat: "echec", details: { raison: "compte_verrouille" } });
    redirect(`/connexion?role=${role}&erreur=verrouille`);
  }

  if (user.statut === "suspendu") {
    await logAudit({ userId: user.id, role, identifiant: user.identifiant_unique, action: "connexion", resultat: "echec", details: { raison: "compte_suspendu" } });
    redirect(`/connexion?role=${role}&erreur=suspendu`);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await registerFailedLogin(user.id);
    await logAudit({ userId: user.id, role, identifiant: user.identifiant_unique, action: "connexion", resultat: "echec", details: { raison: "mot_de_passe_invalide" } });
    redirect(`/connexion?role=${role}&erreur=identifiants`);
  }

  await resetFailedLogin(user.id);
  await createSession({ userId: user.id, role: user.role, identifiant: user.identifiant_unique });
  await logAudit({ userId: user.id, role, identifiant: user.identifiant_unique, action: "connexion", resultat: "succes" });

  if (user.must_change_password) {
    redirect("/changer-mot-de-passe");
  }
  redirect(spaceHome[user.role as Role]);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function registerSponsorAction(formData: FormData): Promise<void> {
  const type = String(formData.get("type") || "physique") as "physique" | "morale";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const telephone = String(formData.get("telephone") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("password_confirm") || "");

  if (!email || !password || password.length < 8) {
    redirect("/inscription?erreur=validation");
  }
  if (password !== passwordConfirm) {
    redirect("/inscription?erreur=mdp_differents");
  }

  const existing = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    redirect("/inscription?erreur=email_existe");
  }

  let identifiant = "";
  for (let i = 0; i < 5; i++) {
    identifiant = generateUserIdentifiant("SPONSOR");
    const exists = await db.sql`SELECT 1 FROM users WHERE identifiant_unique = ${identifiant}`;
    if (exists.length === 0) break;
  }

  const password_hash = await hashPassword(password);
  const userRows = await db.sql`
    INSERT INTO users (role, identifiant_unique, email, telephone, password_hash)
    VALUES ('SPONSOR', ${identifiant}, ${email}, ${telephone}, ${password_hash})
    RETURNING id
  `;
  const userId = userRows[0].id;

  if (type === "physique") {
    await db.sql`
      INSERT INTO sponsors (user_id, type, nom, prenoms, date_naissance, sexe, nationalite, piece_type, piece_numero, profession, adresse, ville, pays)
      VALUES (
        ${userId}, 'physique',
        ${String(formData.get("nom") || "")}, ${String(formData.get("prenoms") || "")},
        ${String(formData.get("date_naissance") || "") || null}, ${String(formData.get("sexe") || "")},
        ${String(formData.get("nationalite") || "Ivoirienne")}, ${String(formData.get("piece_type") || "")},
        ${String(formData.get("piece_numero") || "")}, ${String(formData.get("profession") || "")},
        ${String(formData.get("adresse") || "")}, ${String(formData.get("ville") || "")}, ${String(formData.get("pays") || "Côte d'Ivoire")}
      )
    `;
  } else {
    await db.sql`
      INSERT INTO sponsors (user_id, type, raison_sociale, forme_juridique, rccm, cc, representant_legal, representant_fonction, adresse, ville, pays)
      VALUES (
        ${userId}, 'morale',
        ${String(formData.get("raison_sociale") || "")}, ${String(formData.get("forme_juridique") || "")},
        ${String(formData.get("rccm") || "")}, ${String(formData.get("cc") || "")},
        ${String(formData.get("representant_legal") || "")}, ${String(formData.get("representant_fonction") || "")},
        ${String(formData.get("adresse") || "")}, ${String(formData.get("ville") || "")}, ${String(formData.get("pays") || "Côte d'Ivoire")}
      )
    `;
  }

  await logAudit({ userId, role: "SPONSOR", identifiant, action: "creation_compte", entite: "users", entiteId: userId, resultat: "succes" });
  await createSession({ userId, role: "SPONSOR", identifiant });
  redirect("/sponsor");
}

export async function ensureBeneficiaireIdentifiant(): Promise<string> {
  let identifiant = "";
  for (let i = 0; i < 5; i++) {
    identifiant = generateBeneficiaireId();
    const exists = await db.sql`SELECT 1 FROM beneficiaires WHERE identifiant_unique = ${identifiant}`;
    if (exists.length === 0) break;
  }
  return identifiant;
}
