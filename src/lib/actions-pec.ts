"use server";

import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./auth";
import { logAudit } from "./audit";
import { sendNotification } from "./notify";
import { generateCodesForPec } from "./codes";
import { ensureBeneficiaireIdentifiant } from "./actions-auth";
import { generatePaiementReference, generatePecNumero } from "./ids";

async function getSponsorId(userId: string): Promise<string> {
  const rows = await db.sql`SELECT id FROM sponsors WHERE user_id = ${userId}`;
  if (rows.length === 0) throw new Error("Sponsor introuvable");
  return rows[0].id;
}

export async function createPecAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "SPONSOR") redirect("/connexion?role=SPONSOR");
  const sponsorId = await getSponsorId(session.userId);

  const beneficiaireMode = String(formData.get("beneficiaire_mode") || "existant");
  let beneficiaireId = String(formData.get("beneficiaire_id") || "");

  if (beneficiaireMode === "nouveau") {
    const nom = String(formData.get("be_nom") || "").trim();
    const prenoms = String(formData.get("be_prenoms") || "").trim();
    if (!nom || !prenoms) redirect("/sponsor/nouvelle-pec?erreur=beneficiaire");

    // Anti-doublon simple : même nom+prénoms+date de naissance déjà créé par ce Sponsor
    const dateNaissance = String(formData.get("be_date_naissance") || "") || null;
    const doublon = await db.sql`
      SELECT id FROM beneficiaires
      WHERE sponsor_createur_id = ${sponsorId} AND lower(nom) = lower(${nom}) AND lower(prenoms) = lower(${prenoms})
        AND (date_naissance = ${dateNaissance}::date OR (${dateNaissance}::date IS NULL))
    `;
    if (doublon.length > 0) {
      beneficiaireId = doublon[0].id;
    } else {
      const identifiant = await ensureBeneficiaireIdentifiant();
      const rows = await db.sql`
        INSERT INTO beneficiaires (identifiant_unique, sponsor_createur_id, nom, prenoms, sexe, date_naissance, nationalite, telephone, adresse, ville, pays, lien_sponsor)
        VALUES (
          ${identifiant}, ${sponsorId}, ${nom}, ${prenoms}, ${String(formData.get("be_sexe") || "")},
          ${dateNaissance}, ${String(formData.get("be_nationalite") || "Ivoirienne")},
          ${String(formData.get("be_telephone") || "")}, ${String(formData.get("be_adresse") || "")},
          ${String(formData.get("be_ville") || "")}, ${String(formData.get("be_pays") || "Côte d'Ivoire")},
          ${String(formData.get("be_lien") || "")}
        )
        RETURNING id
      `;
      beneficiaireId = rows[0].id;
      await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "creation_beneficiaire", entite: "beneficiaires", entiteId: beneficiaireId, resultat: "succes" });
    }
  } else {
    if (!beneficiaireId) redirect("/sponsor/nouvelle-pec?erreur=beneficiaire");
    const owned = await db.sql`SELECT id FROM beneficiaires WHERE id = ${beneficiaireId} AND sponsor_createur_id = ${sponsorId}`;
    if (owned.length === 0) redirect("/sponsor/nouvelle-pec?erreur=beneficiaire");
  }

  const pharmacieId = String(formData.get("pharmacie_id") || "");
  const pharmacie = await db.sql`SELECT id, statut FROM pharmacies WHERE id = ${pharmacieId}`;
  if (pharmacie.length === 0 || !["active", "pilote"].includes(pharmacie[0].statut)) {
    redirect("/sponsor/nouvelle-pec?erreur=pharmacie");
  }

  const montant = Number(formData.get("montant") || 0);
  const ordonnanceReference = String(formData.get("ordonnance_reference") || "").trim();
  if (!montant || montant <= 0 || !ordonnanceReference) {
    redirect("/sponsor/nouvelle-pec?erreur=validation");
  }

  const mandataireNom = String(formData.get("mandataire_nom") || "").trim();

  const numero = generatePecNumero();
  const pecRows = await db.sql`
    INSERT INTO prises_en_charge (
      numero_unique, sponsor_id, beneficiaire_id, pharmacie_id,
      mandataire_nom, mandataire_prenoms, mandataire_date_naissance, mandataire_piece_type, mandataire_piece_numero, mandataire_telephone, mandataire_lien,
      ordonnance_reference, ordonnance_description, montant, observations, statut
    ) VALUES (
      ${numero}, ${sponsorId}, ${beneficiaireId}, ${pharmacieId},
      ${mandataireNom || null}, ${String(formData.get("mandataire_prenoms") || "") || null},
      ${String(formData.get("mandataire_date_naissance") || "") || null}, ${String(formData.get("mandataire_piece_type") || "") || null},
      ${String(formData.get("mandataire_piece_numero") || "") || null}, ${String(formData.get("mandataire_telephone") || "") || null},
      ${String(formData.get("mandataire_lien") || "") || null},
      ${ordonnanceReference}, ${String(formData.get("ordonnance_description") || "")}, ${montant},
      ${String(formData.get("observations") || "")}, 'en_attente_paiement'
    )
    RETURNING id
  `;
  const pecId = pecRows[0].id;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "creation_pec", entite: "prises_en_charge", entiteId: pecId, resultat: "succes", details: { numero } });

  redirect(`/sponsor/pec/${pecId}/paiement`);
}

export async function confirmPaymentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "SPONSOR") redirect("/connexion?role=SPONSOR");

  const pecId = String(formData.get("pec_id") || "");
  const moyen = String(formData.get("moyen_paiement") || "orange_money");
  const outcome = String(formData.get("outcome") || "valide"); // valide | echoue — simulateur

  const sponsorId = await getSponsorId(session.userId);
  const pecRows = await db.sql`
    SELECT p.*, b.nom AS be_nom, b.prenoms AS be_prenoms, b.telephone AS be_telephone, ph.nom_commercial, ph.adresse, ph.ville, ph.user_id AS pharmacie_user_id
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN pharmacies ph ON ph.id = p.pharmacie_id
    WHERE p.id = ${pecId} AND p.sponsor_id = ${sponsorId}
  `;
  const pec = pecRows[0];
  if (!pec) redirect("/sponsor");
  if (pec.statut !== "en_attente_paiement") redirect(`/sponsor/pec/${pecId}`);

  const reference = generatePaiementReference();

  if (outcome === "echoue") {
    await db.sql`
      INSERT INTO paiements (pec_id, reference_unique, montant, moyen_paiement, statut)
      VALUES (${pecId}, ${reference}, ${pec.montant}, ${moyen}, 'echoue')
    `;
    await db.sql`UPDATE prises_en_charge SET statut = 'paiement_echoue', updated_at = now() WHERE id = ${pecId}`;
    await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "paiement_echoue", entite: "prises_en_charge", entiteId: pecId, resultat: "echec", details: { reference, moyen } });
    await sendNotification({
      destinataireUserId: session.userId,
      destinataireLabel: session.identifiant,
      canal: "email",
      sujet: "Échec de paiement PNMO",
      contenu: `Le paiement de la prise en charge ${pec.numero_unique} a échoué. Vous pouvez réessayer depuis votre espace Sponsor.`,
      pecId,
    });
    redirect(`/sponsor/pec/${pecId}`);
  }

  await db.sql`
    INSERT INTO paiements (pec_id, reference_unique, montant, moyen_paiement, statut, validated_at)
    VALUES (${pecId}, ${reference}, ${pec.montant}, ${moyen}, 'valide', now())
  `;
  await db.sql`UPDATE prises_en_charge SET statut = 'en_attente_retrait', updated_at = now() WHERE id = ${pecId}`;
  const { cuc, cur } = await generateCodesForPec(pecId);

  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "paiement_valide", entite: "prises_en_charge", entiteId: pecId, resultat: "succes", details: { reference, moyen } });
  await logAudit({ action: "generation_codes", entite: "prises_en_charge", entiteId: pecId, resultat: "succes", details: { cuc, cur } });

  await sendNotification({
    destinataireUserId: session.userId,
    destinataireLabel: session.identifiant,
    canal: "email",
    sujet: "Paiement confirmé — Reçu PNMO",
    contenu: `Paiement de ${pec.montant} FCFA confirmé pour la prise en charge ${pec.numero_unique}. Référence: ${reference}. Code Unique de Commande: ${cuc}.`,
    pecId,
  });
  await sendNotification({
    destinataireUserId: null,
    destinataireLabel: `${pec.be_prenoms} ${pec.be_nom} (${pec.be_telephone || "sans téléphone"})`,
    canal: "sms",
    sujet: "Prise en charge disponible",
    contenu: `Bonjour ${pec.be_prenoms}, une prise en charge PNMO vous attend à ${pec.nom_commercial} (${pec.adresse}, ${pec.ville}). Présentez votre ordonnance, une pièce d'identité et le code: ${cur}.`,
    pecId,
  });
  if (pec.pharmacie_user_id) {
    await sendNotification({
      destinataireUserId: pec.pharmacie_user_id,
      destinataireLabel: pec.nom_commercial,
      canal: "email",
      sujet: "Nouvelle prise en charge PNMO",
      contenu: `Nouvelle prise en charge ${pec.numero_unique} en attente de retrait. Bénéficiaire: ${pec.be_prenoms} ${pec.be_nom}.`,
      pecId,
    });
  }

  redirect(`/sponsor/pec/${pecId}`);
}

export async function cancelPecAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "SPONSOR") redirect("/connexion?role=SPONSOR");
  const pecId = String(formData.get("pec_id") || "");
  const sponsorId = await getSponsorId(session.userId);

  const rows = await db.sql`SELECT statut FROM prises_en_charge WHERE id = ${pecId} AND sponsor_id = ${sponsorId}`;
  if (rows.length === 0) redirect("/sponsor");
  if (!["en_attente_paiement", "paiement_echoue"].includes(rows[0].statut)) {
    redirect(`/sponsor/pec/${pecId}`);
  }

  await db.sql`UPDATE prises_en_charge SET statut = 'annulee', updated_at = now(), cloturee_at = now() WHERE id = ${pecId}`;
  await logAudit({ userId: session.userId, role: session.role, identifiant: session.identifiant, action: "annulation_pec", entite: "prises_en_charge", entiteId: pecId, resultat: "succes" });
  redirect(`/sponsor/pec/${pecId}`);
}
