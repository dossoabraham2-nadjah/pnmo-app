import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button, Card, PageHeader, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PharmacieDashboard() {
  const session = await getSession();
  if (!session) redirect("/connexion?role=PHARMACY");

  const pharmRows = await db.sql`SELECT * FROM pharmacies WHERE user_id = ${session.userId}`;
  const pharmacie = pharmRows[0];

  const stats = await db.sql`
    SELECT statut, count(*)::int AS n FROM prises_en_charge WHERE pharmacie_id = ${pharmacie.id} GROUP BY statut
  `;
  const statMap = Object.fromEntries(stats.map((r: { statut: string; n: number }) => [r.statut, r.n]));

  const enAttente = await db.sql`
    SELECT p.id, p.numero_unique, p.montant, p.created_at, b.nom AS be_nom, b.prenoms AS be_prenoms
    FROM prises_en_charge p JOIN beneficiaires b ON b.id = p.beneficiaire_id
    WHERE p.pharmacie_id = ${pharmacie.id} AND p.statut = 'en_attente_retrait'
    ORDER BY p.created_at ASC
  `;

  const dernieres = await db.sql`
    SELECT p.id, p.numero_unique, p.statut, p.updated_at, b.nom AS be_nom, b.prenoms AS be_prenoms
    FROM prises_en_charge p JOIN beneficiaires b ON b.id = p.beneficiaire_id
    WHERE p.pharmacie_id = ${pharmacie.id}
    ORDER BY p.updated_at DESC LIMIT 10
  `;

  return (
    <div>
      <PageHeader
        title={pharmacie.nom_commercial}
        subtitle={`${pharmacie.identifiant_unique} — statut réseau : ${pharmacie.statut}`}
        action={<Link href="/pharmacie/verifier"><Button>Vérifier un code de retrait</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Commandes en attente" value={statMap["en_attente_retrait"] ?? 0} />
        <StatCard label="Retraits effectués" value={statMap["retiree"] ?? 0} />
        <StatCard label="Retraits refusés" value={statMap["refusee"] ?? 0} />
        <StatCard label="Total reçu" value={Object.values(statMap).reduce((a: number, b) => a + (b as number), 0)} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">Commandes en attente de retrait</h2>
        {enAttente.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune commande en attente actuellement.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enAttente.map((r: { id: string; numero_unique: string; montant: number; be_nom: string; be_prenoms: string; created_at: string }) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-mono text-xs text-slate-400">{r.numero_unique}</p>
                  <p className="font-medium">{r.be_prenoms} {r.be_nom}</p>
                </div>
                <span className="text-slate-500">{Number(r.montant).toLocaleString("fr-FR")} FCFA</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">10 dernières activités</h2>
        {dernieres.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune activité pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {dernieres.map((r: { id: string; numero_unique: string; statut: string; be_nom: string; be_prenoms: string; updated_at: string }) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-mono text-xs text-slate-400">{r.numero_unique}</p>
                  <p>{r.be_prenoms} {r.be_nom}</p>
                </div>
                <StatusBadge status={r.statut} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
