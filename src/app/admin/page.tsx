import Link from "next/link";
import { db } from "@/lib/db";
import { Card, PageHeader, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [sponsorsCount, beneficiairesCount, pharmaciesCount, incidentsOuverts, pecEnCours, retraitsEffectues] = await Promise.all([
    db.sql`SELECT count(*)::int AS n FROM sponsors`,
    db.sql`SELECT count(*)::int AS n FROM beneficiaires`,
    db.sql`SELECT count(*)::int AS n FROM pharmacies WHERE statut IN ('active','pilote')`,
    db.sql`SELECT count(*)::int AS n FROM incidents WHERE statut != 'cloture'`,
    db.sql`SELECT count(*)::int AS n FROM prises_en_charge WHERE statut IN ('en_attente_paiement','en_attente_retrait')`,
    db.sql`SELECT count(*)::int AS n FROM prises_en_charge WHERE statut = 'retiree'`,
  ]);

  const dernieres = await db.sql`
    SELECT p.numero_unique, p.statut, p.montant, p.created_at, b.nom AS be_nom, b.prenoms AS be_prenoms, ph.nom_commercial
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN pharmacies ph ON ph.id = p.pharmacie_id
    ORDER BY p.created_at DESC LIMIT 10
  `;

  const incidents = await db.sql`
    SELECT numero_unique, type, gravite, statut, created_at FROM incidents WHERE statut != 'cloture' ORDER BY created_at DESC LIMIT 5
  `;

  return (
    <div>
      <PageHeader title="Tableau de bord Administrateur" subtitle="Vue opérationnelle de la plateforme PNMO" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Sponsors actifs" value={sponsorsCount[0].n} />
        <StatCard label="Bénéficiaires enregistrés" value={beneficiairesCount[0].n} />
        <StatCard label="Pharmacies actives" value={pharmaciesCount[0].n} />
        <StatCard label="PEC en cours" value={pecEnCours[0].n} />
        <StatCard label="Retraits effectués" value={retraitsEffectues[0].n} />
        <StatCard label="Incidents ouverts" value={incidentsOuverts[0].n} />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Incidents non clôturés</h2>
          <Link href="/admin/incidents" className="text-sm text-brand hover:underline">Voir tout</Link>
        </div>
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun incident ouvert.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {incidents.map((i: { numero_unique: string; type: string; gravite: string; statut: string }) => (
              <li key={i.numero_unique} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs text-slate-400">{i.numero_unique}</span>
                <span>{i.type.replaceAll("_", " ")}</span>
                <StatusBadge status={i.gravite} />
                <StatusBadge status={i.statut} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">Dernières opérations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">N° PEC</th>
                <th className="py-2 pr-4">Bénéficiaire</th>
                <th className="py-2 pr-4">Pharmacie</th>
                <th className="py-2 pr-4">Montant</th>
                <th className="py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {dernieres.map((r: { numero_unique: string; statut: string; montant: number; be_nom: string; be_prenoms: string; nom_commercial: string }) => (
                <tr key={r.numero_unique} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-mono text-xs">{r.numero_unique}</td>
                  <td className="py-2.5 pr-4">{r.be_prenoms} {r.be_nom}</td>
                  <td className="py-2.5 pr-4">{r.nom_commercial}</td>
                  <td className="py-2.5 pr-4">{Number(r.montant).toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-2.5"><StatusBadge status={r.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
