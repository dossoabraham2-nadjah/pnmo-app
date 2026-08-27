"use server";

import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./auth";
import { logAudit } from "./audit";
import { sendNotification } from "./notify";
import { consumeCur } from "./codes";
import { generateIncidentNumero } from "./ids";

async function getPharmacieId(userId: string): Promise<string> {
  const rows = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${userId}`;
  if (rows.length === 0) throw new Error("Pharmacie introuvable");
  return rows[0].id;
}

export async function lookupCodeAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PHARMACY") redirect("/connexion?role=PHARMACY");
  const pharmacieId = await getPharmacieId(session.userId);

  const code = String(formData.get("cur") || "").trim().toUpperCase();
  if (!code) redirect("/pharmacie/verifier?erreur=code_manquant");

  const rows = await db.sql`
    SELECT c.pec_id, c.statut AS code_statut, p.pharmacie_id
    FROM codes c JOIN prises_en_charge p ON p.id = c.pec_id
    WHERE c.valeur = ${code} AND c.type = 'CUR'
  `;
  if (rows.length === 0) {
    await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "verification_code", resultat: "echec", details: { code, raison: "inconnu" } });
    redirect("/pharmacie/verifier?erreur=inconnu");
  }
  const row = rows[0];
  if (row.pharmacie_id !== pharmacieId) {
    await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "verification_code", resultat: "echec", details: { code, raison: "mauvaise_pharmacie" } });
    redirect("/pharmacie/verifier?erreur=mauvaise_pharmacie");
  }
  if (row.code_statut !== "actif") {
    redirect(`/pharmacie/retrait/${row.pec_id}?code=${encodeURIComponent(code)}&statut=${row.code_statut}`);
  }
  redirect(`/pharmacie/retrait/${row.pec_id}?code=${encodeURIComponent(code)}`);
}

export async function confirmRetraitAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PHARMACY") redirect("/connexion?role=PHARMACY");
  const pharmacieId = await getPharmacieId(session.userId);

  const pecId = String(formData.get("pec_id") || "");
  const code = String(formData.get("code") || "");

  const result = await consumeCur(code, pharmacieId);

  if (!result.ok) {
    await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "tentative_retrait", entite: "prises_en_charge", entiteId: result.pecId, resultat: "echec", details: { raison: result.raison } });
    redirect(`/pharmacie/retrait/${pecId}?code=${encodeURIComponent(code)}&erreur=${result.raison}`);
  }

  const rows = await db.sql`
    SELECT p.numero_unique, s.user_id AS sponsor_user_id, s.id AS sponsor_id
    FROM prises_en_charge p JOIN sponsors s ON s.id = p.sponsor_id
    WHERE p.id = ${pecId}
  `;
  const pec = rows[0];

  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "validation_retrait", entite: "prises_en_charge", entiteId: pecId, resultat: "succes" });

  if (pec?.sponsor_user_id) {
    await sendNotification({
      destinataireUserId: pec.sponsor_user_id,
      destinataireLabel: "Sponsor",
      canal: "email",
      sujet: "Retrait effectué",
      contenu: `Les médicaments de la prise en charge ${pec.numero_unique} ont été retirés avec succès. Merci pour votre solidarité.`,
      pecId,
    });
  }

  redirect(`/pharmacie/retrait/${pecId}?succes=1`);
}

export async function refuserRetraitAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PHARMACY") redirect("/connexion?role=PHARMACY");
  const pharmacieId = await getPharmacieId(session.userId);

  const pecId = String(formData.get("pec_id") || "");
  const motif = String(formData.get("motif") || "");
  const code = String(formData.get("code") || "");

  const rows = await db.sql`SELECT * FROM prises_en_charge WHERE id = ${pecId} AND pharmacie_id = ${pharmacieId}`;
  const pec = rows[0];
  if (!pec) redirect("/pharmacie");
  if (pec.statut !== "en_attente_retrait") redirect(`/pharmacie/retrait/${pecId}`);

  await db.sql`UPDATE prises_en_charge SET statut = 'refusee', updated_at = now(), cloturee_at = now() WHERE id = ${pecId}`;
  await db.sql`UPDATE codes SET statut = 'annule' WHERE pec_id = ${pecId} AND statut = 'actif'`;

  const numero = generateIncidentNumero();
  await db.sql`
    INSERT INTO incidents (numero_unique, type, gravite, description, pec_id, created_by, statut)
    VALUES (${numero}, 'retrait_refuse', 'moyen', ${motif || "Retrait refusé par la pharmacie"}, ${pecId}, ${session.userId}, 'ouvert')
  `;

  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "refus_retrait", entite: "prises_en_charge", entiteId: pecId, resultat: "succes", details: { motif } });

  const sponsorRows = await db.sql`SELECT user_id FROM sponsors WHERE id = ${pec.sponsor_id}`;
  if (sponsorRows[0]) {
    await sendNotification({
      destinataireUserId: sponsorRows[0].user_id,
      destinataireLabel: "Sponsor",
      canal: "email",
      sujet: "Retrait refusé",
      contenu: `Le retrait de la prise en charge ${pec.numero_unique} a été refusé par la pharmacie. Motif : ${motif || "non précisé"}. Contactez l'assistance PNMO.`,
      pecId,
    });
  }

  redirect(`/pharmacie/retrait/${pecId}?code=${encodeURIComponent(code)}&refuse=1`);
}

export async function declareIndisponibiliteAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "PHARMACY") redirect("/connexion?role=PHARMACY");
  const pharmacieId = await getPharmacieId(session.userId);

  const motif = String(formData.get("motif") || "");
  const dateDebut = String(formData.get("date_debut") || "");
  const dateFin = String(formData.get("date_fin") || "") || null;

  if (!motif || !dateDebut) redirect("/pharmacie/indisponibilite?erreur=1");

  await db.sql`
    INSERT INTO pharmacy_indisponibilites (pharmacie_id, motif, date_debut, date_fin)
    VALUES (${pharmacieId}, ${motif}, ${dateDebut}, ${dateFin})
  `;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "declaration_indisponibilite", entite: "pharmacies", entiteId: pharmacieId, resultat: "succes", details: { motif, dateDebut, dateFin } });

  redirect("/pharmacie/indisponibilite?succes=1");
}
