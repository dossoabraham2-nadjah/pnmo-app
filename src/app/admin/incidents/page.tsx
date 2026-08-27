import { Alert, Button, Card, EmptyState, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { db } from "@/lib/db";
import { createIncidentAction, updateIncidentAction } from "@/lib/actions-admin";

export const dynamic = "force-dynamic";

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const incidents = await db.sql`
    SELECT i.*, p.numero_unique AS pec_numero
    FROM incidents i
    LEFT JOIN prises_en_charge p ON p.id = i.pec_id
    ORDER BY (i.statut != 'cloture') DESC, i.created_at DESC
    LIMIT 50
  `;

  return (
    <div>
      <PageHeader title="Gestion des incidents" subtitle="Anomalies, exceptions et incidents — dont cybersécurité" />
      {sp.erreur && <div className="mb-4"><Alert variant="error">Merci de renseigner une description.</Alert></div>}

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">Enregistrer un incident</h2>
        <form action={createIncidentAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Type" htmlFor="type">
            <Select id="type" name="type" defaultValue="autre">
              <option value="sponsor">Lié à un Sponsor</option>
              <option value="beneficiaire">Lié à un Bénéficiaire</option>
              <option value="pharmacie">Lié à une Pharmacie</option>
              <option value="retrait">Lié à un retrait</option>
              <option value="technique">Technique</option>
              <option value="cybersecurite">Cybersécurité</option>
              <option value="autre">Autre</option>
            </Select>
          </Field>
          <Field label="Gravité" htmlFor="gravite">
            <Select id="gravite" name="gravite" defaultValue="faible">
              <option value="faible">Faible</option>
              <option value="moyen">Moyen</option>
              <option value="eleve">Élevé</option>
              <option value="critique">Critique</option>
            </Select>
          </Field>
          <div className="sm:col-span-3">
            <Field label="Description" htmlFor="description">
              <Textarea id="description" name="description" rows={2} required />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Button type="submit">Enregistrer l&apos;incident</Button>
          </div>
        </form>
      </Card>

      {incidents.length === 0 ? (
        <EmptyState>Aucun incident enregistré.</EmptyState>
      ) : (
        <div className="space-y-3">
          {incidents.map((i: { id: string; numero_unique: string; type: string; gravite: string; statut: string; description: string; pec_numero: string | null; resolution: string | null; created_at: string }) => (
            <Card key={i.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-slate-400">{i.numero_unique}</span>
                  {i.pec_numero && <span className="ml-2 text-xs text-slate-400">— PEC {i.pec_numero}</span>}
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={i.gravite} />
                  <StatusBadge status={i.statut} />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700">{i.description}</p>
              {i.resolution && <p className="mt-1 text-xs text-slate-500">Résolution : {i.resolution}</p>}
              {i.statut !== "cloture" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {i.statut === "ouvert" && (
                    <form action={updateIncidentAction}>
                      <input type="hidden" name="incident_id" value={i.id} />
                      <input type="hidden" name="action" value="prendre_en_charge" />
                      <Button type="submit" variant="secondary">Prendre en charge</Button>
                    </form>
                  )}
                  <form action={updateIncidentAction} className="flex flex-1 items-center gap-2">
                    <input type="hidden" name="incident_id" value={i.id} />
                    <input type="hidden" name="action" value="cloturer" />
                    <input
                      name="resolution"
                      placeholder="Résolution apportée..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    />
                    <Button type="submit" variant="ghost">Clôturer</Button>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
