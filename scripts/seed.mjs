// Seed de comptes de démo pour PNMO — exécuté une fois après provisioning DB.
// Usage: node scripts/seed.mjs
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function sql(strings, ...values) {
  let text = "";
  strings.forEach((chunk, i) => {
    text += chunk;
    if (i < values.length) text += `$${i + 1}`;
  });
  const result = await pool.query(text, values);
  return result.rows;
}
const db = { sql };

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function upsertUser({ role, identifiant, email, telephone, password }) {
  const existing = await db.sql`SELECT id FROM users WHERE identifiant_unique = ${identifiant}`;
  if (existing.length > 0) {
    console.log(`- ${identifiant} existe déjà, ignoré`);
    return existing[0].id;
  }
  const password_hash = await hash(password);
  const rows = await db.sql`
    INSERT INTO users (role, identifiant_unique, email, telephone, password_hash, must_change_password)
    VALUES (${role}, ${identifiant}, ${email}, ${telephone}, ${password_hash}, false)
    RETURNING id
  `;
  console.log(`+ ${identifiant} (${role}) créé — mot de passe: ${password}`);
  return rows[0].id;
}

async function main() {
  console.log("Seed PNMO — comptes de démonstration\n");

  // Super Admin
  const superAdminId = await upsertUser({
    role: "SUPERADMIN",
    identifiant: "SA-000001",
    email: "superadmin@pnmo.demo",
    telephone: "+2250700000001",
    password: "SuperAdmin@2026",
  });

  // Admin
  await upsertUser({
    role: "ADMIN",
    identifiant: "AD-000001",
    email: "admin@pnmo.demo",
    telephone: "+2250700000002",
    password: "Admin@2026",
  });

  // Pharmacie
  const pharmUserId = await upsertUser({
    role: "PHARMACY",
    identifiant: "PH-000001",
    email: "pharmacie.plateau@pnmo.demo",
    telephone: "+2250700000003",
    password: "Pharmacie@2026",
  });
  const pharmExisting = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${pharmUserId}`;
  if (pharmExisting.length === 0) {
    await db.sql`
      INSERT INTO pharmacies (user_id, identifiant_unique, nom_commercial, pharmacien_titulaire, adresse, commune, ville, region, statut)
      VALUES (${pharmUserId}, 'PH-000001', 'Pharmacie du Plateau', 'Dr. Koffi N''Guessan', 'Avenue Chardy, Plateau', 'Plateau', 'Abidjan', 'Lagunes', 'active')
    `;
    console.log("+ Fiche Pharmacie du Plateau créée");
  }

  // Deuxième pharmacie
  const pharmUserId2 = await upsertUser({
    role: "PHARMACY",
    identifiant: "PH-000002",
    email: "pharmacie.cocody@pnmo.demo",
    telephone: "+2250700000004",
    password: "Pharmacie@2026",
  });
  const pharmExisting2 = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${pharmUserId2}`;
  if (pharmExisting2.length === 0) {
    await db.sql`
      INSERT INTO pharmacies (user_id, identifiant_unique, nom_commercial, pharmacien_titulaire, adresse, commune, ville, region, statut)
      VALUES (${pharmUserId2}, 'PH-000002', 'Pharmacie Les Palmiers', 'Dr. Aya Bamba', 'Boulevard Latrille, Cocody', 'Cocody', 'Abidjan', 'Lagunes', 'active')
    `;
    console.log("+ Fiche Pharmacie Les Palmiers créée");
  }

  // Sponsor
  const sponsorUserId = await upsertUser({
    role: "SPONSOR",
    identifiant: "SP-000001",
    email: "sponsor.demo@pnmo.demo",
    telephone: "+2250700000005",
    password: "Sponsor@2026",
  });
  const sponsorExisting = await db.sql`SELECT id FROM sponsors WHERE user_id = ${sponsorUserId}`;
  let sponsorId;
  if (sponsorExisting.length === 0) {
    const rows = await db.sql`
      INSERT INTO sponsors (user_id, type, nom, prenoms, date_naissance, sexe, nationalite, piece_type, piece_numero, profession, adresse, ville, pays)
      VALUES (${sponsorUserId}, 'physique', 'Kouassi', 'Jean-Baptiste', '1985-04-12', 'M', 'Ivoirienne', 'CNI', 'CI0012345678', 'Ingénieur', 'Rue des Jardins, Marcory', 'Abidjan', 'Côte d''Ivoire')
      RETURNING id
    `;
    sponsorId = rows[0].id;
    console.log("+ Fiche Sponsor démo créée");
  } else {
    sponsorId = sponsorExisting[0].id;
  }

  // Bénéficiaire démo
  const beneExisting = await db.sql`SELECT id FROM beneficiaires WHERE identifiant_unique = 'BE-000001'`;
  if (beneExisting.length === 0) {
    await db.sql`
      INSERT INTO beneficiaires (identifiant_unique, sponsor_createur_id, nom, prenoms, sexe, date_naissance, nationalite, telephone, adresse, ville, pays, lien_sponsor)
      VALUES ('BE-000001', ${sponsorId}, 'Kouassi', 'Adjoua Marie', 'F', '1958-09-03', 'Ivoirienne', '+2250700000006', 'Rue des Jardins, Marcory', 'Abidjan', 'Côte d''Ivoire', 'Mère')
    `;
    console.log("+ Bénéficiaire démo créé (BE-000001)");
  }

  console.log("\nSeed terminé.");
  console.log("\nComptes de test:");
  console.log("  Super Admin : SA-000001 / SuperAdmin@2026");
  console.log("  Admin       : AD-000001 / Admin@2026");
  console.log("  Pharmacie 1 : PH-000001 / Pharmacie@2026 (Pharmacie du Plateau)");
  console.log("  Pharmacie 2 : PH-000002 / Pharmacie@2026 (Pharmacie Les Palmiers)");
  console.log("  Sponsor     : SP-000001 / Sponsor@2026");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
