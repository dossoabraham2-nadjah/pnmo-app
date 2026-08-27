"use server";

import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./auth";
import { logAudit } from "./audit";

export async function updateIncidentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPERADMIN"].includes(session.role)) redirect("/connexion");

  const incidentId = String(formData.get("incident_id") || "");
  const action = String(formData.get("action") || "");
  const resolution = String(formData.get("resolution") || "");

  if (action === "prendre_en_charge") {
    await db.sql`UPDATE incidents SET statut = 'en_cours' WHERE id = ${incidentId}`;
  } else if (action === "cloturer") {
    await db.sql`UPDATE incidents SET statut = 'cloture', resolution = ${resolution}, resolved_at = now() WHERE id = ${incidentId}`;
  }

  await logAudit({
    userId: session.userId,
    role: session.role,
    identifiant: session.identifiant,
    action: `incident_${action}`,
    entite: "incidents",
    entiteId: incidentId,
    resultat: "succes",
  });

  redirect("/admin/incidents");
}

export async function createIncidentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPERADMIN"].includes(session.role)) redirect("/connexion");

  const { generateIncidentNumero } = await import("./ids");
  const numero = generateIncidentNumero();
  const type = String(formData.get("type") || "autre");
  const gravite = String(formData.get("gravite") || "faible");
  const description = String(formData.get("description") || "");

  if (!description) redirect("/admin/incidents?erreur=1");

  await db.sql`
    INSERT INTO incidents (numero_unique, type, gravite, description, created_by, statut)
    VALUES (${numero}, ${type}, ${gravite}, ${description}, ${session.userId}, 'ouvert')
  `;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "creation_incident", entite: "incidents", resultat: "succes", details: { numero } });

  redirect("/admin/incidents");
}
