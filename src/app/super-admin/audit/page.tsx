import { db } from "@/lib/db";
import { Alert, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const entries = await db.sql`
    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200
  `;

  return (
    <div>
      <PageHeader title="Journal d'audit" subtitle="Écriture seule — consultation uniquement, y compris pour le Super Administrateur" />
      <div className="mb-4">
        <Alert variant="info">
          Ce journal ne peut être ni modifié ni supprimé, conformément à l&apos;exigence de traçabilité du CCFT.
          La consultation elle-même est journalisée.
        </Alert>
      </div>
      {entries.length === 0 ? (
        <EmptyState>Aucune entrée pour le moment.</EmptyState>
      ) : (
        <Card>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Acteur</th>
                  <th className="py-2 pr-4">Rôle</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Entité</th>
                  <th className="py-2">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: { id: number; created_at: string; identifiant_unique: string | null; role: string | null; action: string; entite: string | null; entite_id: string | null; resultat: string }) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 whitespace-nowrap text-xs text-slate-500">{new Date(e.created_at).toLocaleString("fr-FR")}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.identifiant_unique ?? "—"}</td>
                    <td className="py-2 pr-4 text-xs">{e.role ?? "—"}</td>
                    <td className="py-2 pr-4">{e.action.replaceAll("_", " ")}</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">{e.entite ?? ""}</td>
                    <td className="py-2"><StatusBadge status={e.resultat} /></td>
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
