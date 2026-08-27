import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  const sponsors = await db.sql`
    SELECT s.id, s.type, s.nom, s.prenoms, s.raison_sociale, s.ville, u.identifiant_unique, u.email, u.telephone, u.statut, u.created_at,
      (SELECT count(*) FROM prises_en_charge WHERE sponsor_id = s.id)::int AS nb_pec
    FROM sponsors s JOIN users u ON u.id = s.user_id
    ORDER BY u.created_at DESC
  `;

  return (
    <div>
      <PageHeader title="Sponsors" subtitle={`${sponsors.length} compte(s) — consultation seule`} />
      {sponsors.length === 0 ? (
        <EmptyState>Aucun Sponsor enregistré.</EmptyState>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Identifiant</th>
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Ville</th>
                  <th className="py-2 pr-4">PEC créées</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s: { id: string; type: string; nom: string; prenoms: string; raison_sociale: string; ville: string; identifiant_unique: string; email: string; telephone: string; statut: string; nb_pec: number }) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.identifiant_unique}</td>
                    <td className="py-2.5 pr-4">{s.type === "morale" ? s.raison_sociale : `${s.prenoms} ${s.nom}`}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">{s.email}<br />{s.telephone}</td>
                    <td className="py-2.5 pr-4">{s.ville}</td>
                    <td className="py-2.5 pr-4">{s.nb_pec}</td>
                    <td className="py-2.5"><StatusBadge status={s.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
