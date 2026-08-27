import { db } from "./db";
import { generateSecureCode } from "./ids";

/**
 * Génère le Code Unique de Commande (CUC) puis le Code Unique de Retrait (CUR)
 * pour une PEC, immédiatement après validation du paiement (Exigence CCFT n°14).
 * Chaque code est unique, non prévisible, à usage unique, et lié à une seule PEC.
 */
export async function generateCodesForPec(pecId: string) {
  const heuresRows = await db.sql`SELECT valeur FROM system_params WHERE cle = 'cur_validite_heures'`;
  const validiteHeures = Number(heuresRows[0]?.valeur ?? 72);

  let cuc = "";
  for (let i = 0; i < 5; i++) {
    cuc = generateSecureCode("CUC");
    const exists = await db.sql`SELECT 1 FROM codes WHERE valeur = ${cuc}`;
    if (exists.length === 0) break;
  }
  await db.sql`
    INSERT INTO codes (pec_id, type, valeur, statut)
    VALUES (${pecId}, 'CUC', ${cuc}, 'actif')
  `;

  let cur = "";
  for (let i = 0; i < 5; i++) {
    cur = generateSecureCode("CUR");
    const exists = await db.sql`SELECT 1 FROM codes WHERE valeur = ${cur}`;
    if (exists.length === 0) break;
  }
  await db.sql`
    INSERT INTO codes (pec_id, type, valeur, statut, expire_at)
    VALUES (${pecId}, 'CUR', ${cur}, 'actif', now() + (${validiteHeures} || ' hours')::interval)
  `;

  return { cuc, cur };
}

/**
 * Consomme un CUR de façon atomique : verrouillage ligne (FOR UPDATE) pour
 * empêcher toute double-utilisation en cas d'accès simultané.
 */
export async function consumeCur(valeur: string, pharmacieId: string) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `SELECT c.id, c.statut, c.expire_at, c.pec_id, p.pharmacie_id, p.statut AS pec_statut
       FROM codes c JOIN prises_en_charge p ON p.id = c.pec_id
       WHERE c.valeur = $1 AND c.type = 'CUR'
       FOR UPDATE`,
      [valeur]
    );
    if (res.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false as const, raison: "code_inconnu" };
    }
    const row = res.rows[0];
    if (row.pharmacie_id !== pharmacieId) {
      await client.query("ROLLBACK");
      return { ok: false as const, raison: "mauvaise_pharmacie", pecId: row.pec_id };
    }
    if (row.statut === "utilise") {
      await client.query("ROLLBACK");
      return { ok: false as const, raison: "deja_utilise", pecId: row.pec_id };
    }
    if (row.statut === "annule") {
      await client.query("ROLLBACK");
      return { ok: false as const, raison: "annule", pecId: row.pec_id };
    }
    if (row.expire_at && new Date(row.expire_at).getTime() < Date.now()) {
      await client.query(`UPDATE codes SET statut = 'expire' WHERE id = $1`, [row.id]);
      await client.query("COMMIT");
      return { ok: false as const, raison: "expire", pecId: row.pec_id };
    }
    if (row.pec_statut !== "en_attente_retrait") {
      await client.query("ROLLBACK");
      return { ok: false as const, raison: "pec_non_disponible", pecId: row.pec_id };
    }

    await client.query(
      `UPDATE codes SET statut = 'utilise', used_at = now(), used_by_pharmacie_id = $1 WHERE id = $2`,
      [pharmacieId, row.id]
    );
    await client.query(
      `UPDATE codes SET statut = 'utilise' WHERE pec_id = $1 AND type = 'CUC' AND statut = 'actif'`,
      [row.pec_id]
    );
    await client.query(
      `UPDATE prises_en_charge SET statut = 'retiree', updated_at = now(), cloturee_at = now() WHERE id = $1`,
      [row.pec_id]
    );
    await client.query("COMMIT");
    return { ok: true as const, pecId: row.pec_id as string };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
