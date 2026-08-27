import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, Button, Card, Field, PageHeader, Select } from "@/components/ui";
import { confirmPaymentAction } from "@/lib/actions-pec";

export const dynamic = "force-dynamic";

export default async function PaiementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion?role=SPONSOR");
  const { id } = await params;

  const sponsorRows = await db.sql`SELECT id FROM sponsors WHERE user_id = ${session.userId}`;
  const rows = await db.sql`
    SELECT p.*, b.nom AS be_nom, b.prenoms AS be_prenoms, ph.nom_commercial
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN pharmacies ph ON ph.id = p.pharmacie_id
    WHERE p.id = ${id} AND p.sponsor_id = ${sponsorRows[0].id}
  `;
  const pec = rows[0];
  if (!pec) redirect("/sponsor");
  if (pec.statut !== "en_attente_paiement") redirect(`/sponsor/pec/${id}`);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Paiement sécurisé" subtitle={`Prise en charge ${pec.numero_unique}`} />
      <Card>
        <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">Bénéficiaire</span><span className="font-medium">{pec.be_prenoms} {pec.be_nom}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Pharmacie</span><span className="font-medium">{pec.nom_commercial}</span></div>
          <div className="flex justify-between py-1 text-base"><span className="text-slate-600">Montant</span><span className="font-bold text-brand-dark">{Number(pec.montant).toLocaleString("fr-FR")} FCFA</span></div>
        </div>

        <Alert variant="info">
          Ce prototype simule l&apos;agrégateur Mobile Money (Orange Money, MTN Mobile Money, Moov Money, Wave). Aucun
          identifiant bancaire réel n&apos;est demandé ni conservé — conformément au CCFT.
        </Alert>

        <form action={confirmPaymentAction} className="mt-6 space-y-4">
          <input type="hidden" name="pec_id" value={pec.id} />
          <Field label="Moyen de paiement" htmlFor="moyen_paiement">
            <Select id="moyen_paiement" name="moyen_paiement" required>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_money">MTN Mobile Money</option>
              <option value="moov_money">Moov Money</option>
              <option value="wave">Wave</option>
            </Select>
          </Field>
          <div className="flex gap-3">
            <Button type="submit" name="outcome" value="valide" className="flex-1">
              Simuler un paiement réussi
            </Button>
            <Button type="submit" name="outcome" value="echoue" variant="secondary" className="flex-1">
              Simuler un échec
            </Button>
          </div>
        </form>

        <Link href="/sponsor" className="mt-4 block text-center text-sm text-slate-500 hover:underline">
          Annuler et revenir plus tard
        </Link>
      </Card>
    </div>
  );
}
