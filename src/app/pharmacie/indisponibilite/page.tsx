import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { declareIndisponibiliteAction } from "@/lib/actions-pharmacie";

export const dynamic = "force-dynamic";

export default async function IndisponibilitePage({
  searchParams,
}: {
  searchParams: Promise<{ succes?: string; erreur?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion?role=PHARMACY");
  const sp = await searchParams;

  const pharmRows = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${session.userId}`;
  const historique = await db.sql`
    SELECT * FROM pharmacy_indisponibilites WHERE pharmacie_id = ${pharmRows[0].id} ORDER BY created_at DESC LIMIT 10
  `;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Signaler une indisponibilité" subtitle="Inventaire, rupture, travaux, incident technique, fermeture temporaire..." />
      {sp.succes && <div className="mb-4"><Alert variant="success">Indisponibilité enregistrée. Les administrateurs en sont informés.</Alert></div>}
      {sp.erreur && <div className="mb-4"><Alert variant="error">Merci de renseigner le motif et la date de début.</Alert></div>}
      <Card>
        <form action={declareIndisponibiliteAction} className="space-y-4">
          <Field label="Motif" htmlFor="motif">
            <Textarea id="motif" name="motif" rows={3} required placeholder="Ex : rupture de stock temporaire sur certains produits" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date de début" htmlFor="date_debut"><Input id="date_debut" name="date_debut" type="date" required /></Field>
            <Field label="Date de fin (si connue)" htmlFor="date_fin"><Input id="date_fin" name="date_fin" type="date" /></Field>
          </div>
          <Button type="submit" className="w-full">Signaler</Button>
        </form>
      </Card>

      {historique.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Historique</h2>
          <ul className="space-y-3 text-sm">
            {historique.map((h: { id: string; motif: string; date_debut: string; date_fin: string | null }) => (
              <li key={h.id} className="border-b border-slate-100 pb-2">
                <p>{h.motif}</p>
                <p className="text-xs text-slate-500">
                  Du {new Date(h.date_debut).toLocaleDateString("fr-FR")}
                  {h.date_fin ? ` au ${new Date(h.date_fin).toLocaleDateString("fr-FR")}` : " — durée indéterminée"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
