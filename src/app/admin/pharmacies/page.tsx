import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPharmaciesPage() {
  const pharmacies = await db.sql`
    SELECT p.*, (SELECT count(*) FROM prises_en_charge WHERE pharmacie_id = p.id)::int AS nb_pec
    FROM pharmacies p ORDER BY p.created_at DESC
  `;

  return (
    <div>
      <PageHeader title="Pharmacies Partenaires" subtitle={`${pharmacies.length} pharmacie(s) — consultation seule (gestion réservée au Super Administrateur)`} />
      {pharmacies.length === 0 ? (
        <EmptyState>Aucune pharmacie enregistrée.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pharmacies.map((p: { id: string; identifiant_unique: string; nom_commercial: string; adresse: string; commune: string | null; ville: string; statut: string; nb_pec: number }) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-slate-400">{p.identifiant_unique}</p>
                  <h3 className="font-semibold text-slate-900">{p.nom_commercial}</h3>
                </div>
                <StatusBadge status={p.statut} />
              </div>
              <p className="mt-2 text-sm text-slate-500">{p.adresse}{p.commune ? `, ${p.commune}` : ""}, {p.ville}</p>
              <p className="mt-2 text-xs text-slate-400">{p.nb_pec} prise(s) en charge reçue(s)</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
