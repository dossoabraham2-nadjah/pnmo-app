"use server";

import { redirect } from "next/navigation";
import { db, Role } from "./db";
import { getSession, hashPassword, verifyPassword } from "./auth";
import { logAudit } from "./audit";

const spaceHome: Record<Role, string> = {
  SPONSOR: "/sponsor",
  PHARMACY: "/pharmacie",
  ADMIN: "/admin",
  SUPERADMIN: "/super-admin",
};

export async function changePasswordAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const current = String(formData.get("current_password") || "");
  const next = String(formData.get("new_password") || "");
  const confirm = String(formData.get("new_password_confirm") || "");

  const rows = await db.sql`SELECT * FROM users WHERE id = ${session.userId}`;
  const user = rows[0];
  if (!user) redirect("/connexion");

  const validCurrent = await verifyPassword(current, user.password_hash);
  if (!validCurrent || next.length < 8 || next !== confirm) {
    redirect("/changer-mot-de-passe?erreur=1");
  }

  const newHash = await hashPassword(next);
  await db.sql`UPDATE users SET password_hash = ${newHash}, must_change_password = false, updated_at = now() WHERE id = ${session.userId}`;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "changement_mot_de_passe", resultat: "succes" });

  redirect(spaceHome[session.role]);
}
