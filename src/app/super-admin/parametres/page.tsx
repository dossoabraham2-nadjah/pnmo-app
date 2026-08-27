import { Alert, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { runManualBackupAction, updateSystemParamAction } from "@/lib/actions-superadmin";

export const dynamic = "force-dynamic";

const paramLabels: Record<string, { label: string; hint: string }> = {
  cur_validite_heures: { label: "Durée de validité du Code Unique de Retrait (heures)", hint: "Point ouvert R-02 du cahier des charges — délai avant expiration automatique du CUR." },
  max_tentatives_connexion: { label: "Nombre maximal de tentatives de connexion", hint: "Au-delà, le compte est verrouillé temporairement." },
  duree_verrouillage_minutes: { label: "Durée de verrouillage après échecs (minutes)", hint: "" },
};

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ sauvegarde?: string }>;
}) {
  const sp = await searchParams;
  const params = await db.sql`SELECT * FROM system_params ORDER BY cle`;

  return (
    <div>
      <PageHeader title="Paramètres généraux et stratégiques" subtitle="Réservé au Super Administrateur" />
      {sp.sauvegarde && <div className="mb-4"><Alert variant="success">Sauvegarde manuelle déclenchée et journalisée.</Alert></div>}

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-slate-900">Paramètres système</h2>
        <div className="space-y-5">
          {params.map((p: { cle: string; valeur: string; updated_at: string }) => (
            <form key={p.cle} action={updateSystemParamAction} className="flex flex-wrap items-end gap-3 border-b border-slate-100 pb-4 last:border-0">
              <input type="hidden" name="cle" value={p.cle} />
              <div className="flex-1 min-w-[240px]">
                <Field label={paramLabels[p.cle]?.label ?? p.cle} htmlFor={`val-${p.cle}`} hint={paramLabels[p.cle]?.hint}>
                  <Input id={`val-${p.cle}`} name="valeur" defaultValue={p.valeur} />
                </Field>
              </div>
              <Button type="submit" variant="secondary">Enregistrer</Button>
            </form>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Sauvegardes</h2>
        <p className="mb-3 text-sm text-slate-500">
          En production, l&apos;hébergeur assure des sauvegardes automatiques quotidiennes de la base de données.
          Ce bouton simule le déclenchement d&apos;une sauvegarde manuelle et l&apos;enregistre dans le journal d&apos;audit.
        </p>
        <form action={runManualBackupAction}>
          <Button type="submit" variant="secondary">Lancer une sauvegarde manuelle</Button>
        </form>
      </Card>
    </div>
  );
}
