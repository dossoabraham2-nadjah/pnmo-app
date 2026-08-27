import { db } from "@/lib/db";
import { Card, PageHeader, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const [admins, pharmacies, sponsors, incidentsCritiques, montantTotal, retraits] = await Promise.all([
    db.sql`SELECT count(*)::int AS n FROM users WHERE role = 'ADMIN'`,
    db.sql`SELECT count(*)::int AS n FROM pharmacies`,
    db.sql`SELECT count(*)::int AS n FROM sponsors`,
    db.sql`SELECT count(*)::int AS n FROM incidents WHERE gravite IN ('eleve','critique') AND statut != 'cloture'`,
    db.sql`SELECT coalesce(sum(montant),0)::float AS total FROM paiements WHERE statut = 'valide'`,
    db.sql`SELECT count(*)::int AS n FROM prises_en_charge WHERE statut = 'retiree'`,
  ]);

  const operations = await db.sql`
    SELECT id, created_at, action, role, identifiant_unique, resultat, entite
    FROM audit_log ORDER BY created_at DESC LIMIT 20
  `;

  return (
    <div>
      <PageHeader title="Vision stratégique PNMO" subtitle="Gouvernance, sécurité et pilotage global de la plateforme" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Administrateurs" value={admins[0].n} />
        <StatCard label="Pharmacies partenaires" value={pharmacies[0].n} />
        <StatCard label="Sponsors" value={sponsors[0].n} />
        <StatCard label="Retraits effectués" value={retraits[0].n} />
        <StatCard label="Montant total financé" value={`${Number(montantTotal[0].total).toLocaleString("fr-FR")} FCFA`} />
        <StatCard label="Incidents graves ouverts" value={incidentsCritiques[0].n} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">20 dernières opérations stratégiques (journal d&apos;audit)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Acteur</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((o: { id: string; created_at: string; action: string; role: string | null; identifiant_unique: string | null; resultat: string }) => (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 text-xs text-slate-500">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{o.identifiant_unique ?? "—"} {o.role ? `(${o.role})` : ""}</td>
                  <td className="py-2.5 pr-4">{o.action.replaceAll("_", " ")}</td>
                  <td className="py-2.5"><StatusBadge status={o.resultat} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
