import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const session = await getSession();
  if (!session) redirect("/connexion?role=SPONSOR");

  const sponsorRows = await db.sql`SELECT id FROM sponsors WHERE user_id = ${session.userId}`;
  const pecs = await db.sql`
    SELECT p.id, p.numero_unique, p.statut, p.montant, p.created_at, b.nom AS be_nom, b.prenoms AS be_prenoms, ph.nom_commercial
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN pharmacies ph ON ph.id = p.pharmacie_id
    WHERE p.sponsor_id = ${sponsorRows[0].id}
    ORDER BY p.created_at DESC
  `;

  return (
    <div>
      <PageHeader title="Mes prises en charge" subtitle={`${pecs.length} au total`} />
      {pecs.length === 0 ? (
        <EmptyState>Vous n&apos;avez encore créé aucune prise en charge.</EmptyState>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">N° PEC</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Bénéficiaire</th>
                  <th className="py-2 pr-4">Pharmacie</th>
                  <th className="py-2 pr-4">Montant</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pecs.map((r: { id: string; numero_unique: string; statut: string; montant: number; created_at: string; be_nom: string; be_prenoms: string; nom_commercial: string }) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-mono text-xs">{r.numero_unique}</td>
                    <td className="py-2.5 pr-4">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2.5 pr-4">{r.be_prenoms} {r.be_nom}</td>
                    <td className="py-2.5 pr-4">{r.nom_commercial}</td>
                    <td className="py-2.5 pr-4">{Number(r.montant).toLocaleString("fr-FR")} FCFA</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={r.statut} /></td>
                    <td className="py-2.5"><Link href={`/sponsor/pec/${r.id}`} className="text-brand hover:underline">Détails</Link></td>
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
