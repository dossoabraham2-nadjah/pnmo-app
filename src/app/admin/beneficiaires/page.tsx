import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminBeneficiairesPage() {
  const beneficiaires = await db.sql`
    SELECT b.id, b.identifiant_unique, b.nom, b.prenoms, b.ville, b.telephone,
      u.identifiant_unique AS sponsor_identifiant,
      (SELECT count(*) FROM prises_en_charge WHERE beneficiaire_id = b.id)::int AS nb_pec
    FROM beneficiaires b
    JOIN sponsors s ON s.id = b.sponsor_createur_id
    JOIN users u ON u.id = s.user_id
    ORDER BY b.created_at DESC
  `;

  return (
    <div>
      <PageHeader title="Bénéficiaires" subtitle={`${beneficiaires.length} bénéficiaire(s) enregistré(s) — consultation seule`} />
      {beneficiaires.length === 0 ? (
        <EmptyState>Aucun bénéficiaire enregistré.</EmptyState>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Identifiant</th>
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Ville</th>
                  <th className="py-2 pr-4">Sponsor créateur</th>
                  <th className="py-2">PEC reçues</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaires.map((b: { id: string; identifiant_unique: string; nom: string; prenoms: string; ville: string; sponsor_identifiant: string; nb_pec: number }) => (
                  <tr key={b.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-mono text-xs">{b.identifiant_unique}</td>
                    <td className="py-2.5 pr-4">{b.prenoms} {b.nom}</td>
                    <td className="py-2.5 pr-4">{b.ville}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{b.sponsor_identifiant}</td>
                    <td className="py-2.5">{b.nb_pec}</td>
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
