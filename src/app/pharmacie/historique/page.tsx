import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PharmacieHistoriquePage() {
  const session = await getSession();
  if (!session) redirect("/connexion?role=PHARMACY");

  const pharmRows = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${session.userId}`;
  const pecs = await db.sql`
    SELECT p.id, p.numero_unique, p.statut, p.montant, p.updated_at, b.nom AS be_nom, b.prenoms AS be_prenoms
    FROM prises_en_charge p JOIN beneficiaires b ON b.id = p.beneficiaire_id
    WHERE p.pharmacie_id = ${pharmRows[0].id} AND p.statut NOT IN ('en_attente_paiement','paiement_echoue')
    ORDER BY p.updated_at DESC
  `;

  return (
    <div>
      <PageHeader title="Historique des retraits" subtitle={`${pecs.length} opération(s)`} />
      {pecs.length === 0 ? (
        <EmptyState>Aucune opération enregistrée pour le moment.</EmptyState>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">N° PEC</th>
                  <th className="py-2 pr-4">Bénéficiaire</th>
                  <th className="py-2 pr-4">Montant</th>
                  <th className="py-2 pr-4">Dernière mise à jour</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pecs.map((r: { id: string; numero_unique: string; statut: string; montant: number; updated_at: string; be_nom: string; be_prenoms: string }) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-mono text-xs">{r.numero_unique}</td>
                    <td className="py-2.5 pr-4">{r.be_prenoms} {r.be_nom}</td>
                    <td className="py-2.5 pr-4">{Number(r.montant).toLocaleString("fr-FR")} FCFA</td>
                    <td className="py-2.5 pr-4">{new Date(r.updated_at).toLocaleString("fr-FR")}</td>
                    <td className="py-2.5"><StatusBadge status={r.statut} /></td>
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
