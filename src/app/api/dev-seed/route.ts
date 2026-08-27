import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// One-time setup endpoint: creates the demo accounts for testing.
// Protected by a token so it can't be triggered by a random visitor.
// Safe to call more than once (existing accounts are left untouched).
// Visit: /api/dev-seed?token=<SESSION_SECRET>

async function upsertUser(params: {
  role: "SPONSOR" | "PHARMACY" | "ADMIN" | "SUPERADMIN";
  identifiant: string;
  email: string;
  telephone: string;
  password: string;
}) {
  const { role, identifiant, email, telephone, password } = params;
  const existing = await db.sql`SELECT id FROM users WHERE identifiant_unique = ${identifiant}`;
  if (existing.length > 0) {
    return { id: existing[0].id, created: false };
  }
  const password_hash = await bcrypt.hash(password, 10);
  const rows = await db.sql`
    INSERT INTO users (role, identifiant_unique, email, telephone, password_hash, must_change_password)
    VALUES (${role}, ${identifiant}, ${email}, ${telephone}, ${password_hash}, false)
    RETURNING id
  `;
  return { id: rows[0].id, created: true };
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!process.env.SESSION_SECRET || token !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const log: string[] = [];

  const superAdmin = await upsertUser({
    role: "SUPERADMIN",
    identifiant: "SA-000001",
    email: "superadmin@pnmo.demo",
    telephone: "+2250700000001",
    password: "SuperAdmin@2026",
  });
  log.push(`SuperAdmin SA-000001: ${superAdmin.created ? "créé" : "déjà présent"}`);

  const admin = await upsertUser({
    role: "ADMIN",
    identifiant: "AD-000001",
    email: "admin@pnmo.demo",
    telephone: "+2250700000002",
    password: "Admin@2026",
  });
  log.push(`Admin AD-000001: ${admin.created ? "créé" : "déjà présent"}`);

  const pharm1 = await upsertUser({
    role: "PHARMACY",
    identifiant: "PH-000001",
    email: "pharmacie.plateau@pnmo.demo",
    telephone: "+2250700000003",
    password: "Pharmacie@2026",
  });
  const pharm1Existing = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${pharm1.id}`;
  if (pharm1Existing.length === 0) {
    await db.sql`
      INSERT INTO pharmacies (user_id, identifiant_unique, nom_commercial, pharmacien_titulaire, adresse, commune, ville, region, statut)
      VALUES (${pharm1.id}, 'PH-000001', 'Pharmacie du Plateau', 'Dr. Koffi N''Guessan', 'Avenue Chardy, Plateau', 'Plateau', 'Abidjan', 'Lagunes', 'active')
    `;
    log.push("Fiche Pharmacie du Plateau: créée");
  } else {
    log.push("Fiche Pharmacie du Plateau: déjà présente");
  }

  const pharm2 = await upsertUser({
    role: "PHARMACY",
    identifiant: "PH-000002",
    email: "pharmacie.cocody@pnmo.demo",
    telephone: "+2250700000004",
    password: "Pharmacie@2026",
  });
  const pharm2Existing = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${pharm2.id}`;
  if (pharm2Existing.length === 0) {
    await db.sql`
      INSERT INTO pharmacies (user_id, identifiant_unique, nom_commercial, pharmacien_titulaire, adresse, commune, ville, region, statut)
      VALUES (${pharm2.id}, 'PH-000002', 'Pharmacie Les Palmiers', 'Dr. Aya Bamba', 'Boulevard Latrille, Cocody', 'Cocody', 'Abidjan', 'Lagunes', 'active')
    `;
    log.push("Fiche Pharmacie Les Palmiers: créée");
  } else {
    log.push("Fiche Pharmacie Les Palmiers: déjà présente");
  }

  const sponsorUser = await upsertUser({
    role: "SPONSOR",
    identifiant: "SP-000001",
    email: "sponsor.demo@pnmo.demo",
    telephone: "+2250700000005",
    password: "Sponsor@2026",
  });
  const sponsorExisting = await db.sql`SELECT id FROM sponsors WHERE user_id = ${sponsorUser.id}`;
  let sponsorId: string;
  if (sponsorExisting.length === 0) {
    const rows = await db.sql`
      INSERT INTO sponsors (user_id, type, nom, prenoms, date_naissance, sexe, nationalite, piece_type, piece_numero, profession, adresse, ville, pays)
      VALUES (${sponsorUser.id}, 'physique', 'Kouassi', 'Jean-Baptiste', '1985-04-12', 'M', 'Ivoirienne', 'CNI', 'CI0012345678', 'Ingénieur', 'Rue des Jardins, Marcory', 'Abidjan', 'Côte d''Ivoire')
      RETURNING id
    `;
    sponsorId = rows[0].id;
    log.push("Fiche Sponsor démo: créée");
  } else {
    sponsorId = sponsorExisting[0].id;
    log.push("Fiche Sponsor démo: déjà présente");
  }

  const beneExisting = await db.sql`SELECT id FROM beneficiaires WHERE identifiant_unique = 'BE-000001'`;
  if (beneExisting.length === 0) {
    await db.sql`
      INSERT INTO beneficiaires (identifiant_unique, sponsor_createur_id, nom, prenoms, sexe, date_naissance, nationalite, telephone, adresse, ville, pays, lien_sponsor)
      VALUES ('BE-000001', ${sponsorId}, 'Kouassi', 'Adjoua Marie', 'F', '1958-09-03', 'Ivoirienne', '+2250700000006', 'Rue des Jardins, Marcory', 'Abidjan', 'Côte d''Ivoire', 'Mère')
    `;
    log.push("Bénéficiaire démo BE-000001: créé");
  } else {
    log.push("Bénéficiaire démo BE-000001: déjà présent");
  }

  return NextResponse.json({ ok: true, log });
}
