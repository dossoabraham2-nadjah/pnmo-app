import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { cancelPecAction } from "@/lib/actions-pec";

export const dynamic = "force-dynamic";

export default async function PecDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion?role=SPONSOR");
  const { id } = await params;

  const sponsorRows = await db.sql`SELECT id FROM sponsors WHERE user_id = ${session.userId}`;
  const rows = await db.sql`
    SELECT p.*, b.nom AS be_nom, b.prenoms AS be_prenoms, b.identifiant_unique AS be_identifiant, b.telephone AS be_telephone,
           ph.nom_commercial, ph.adresse, ph.ville
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN pharmacies ph ON ph.id = p.pharmacie_id
    WHERE p.id = ${id} AND p.sponsor_id = ${sponsorRows[0].id}
  `;
  const pec = rows[0];
  if (!pec) redirect("/sponsor");

  const codes = await db.sql`SELECT type, valeur, statut, expire_at, used_at FROM codes WHERE pec_id = ${id} ORDER BY type`;
  const paiements = await db.sql`SELECT * FROM paiements WHERE pec_id = ${id} ORDER BY created_at DESC`;

  const cur = codes.find((c: { type: string }) => c.type === "CUR");
  const cuc = codes.find((c: { type: string }) => c.type === "CUC");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Prise en charge ${pec.numero_unique}`} action={<StatusBadge status={pec.statut} />} />

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Résumé</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Bénéficiaire</dt>
          <dd>{pec.be_prenoms} {pec.be_nom} ({pec.be_identifiant})</dd>
          <dt className="text-slate-500">Pharmacie</dt>
          <dd>{pec.nom_commercial} — {pec.adresse}, {pec.ville}</dd>
          <dt className="text-slate-500">Ordonnance</dt>
          <dd>{pec.ordonnance_reference}</dd>
          <dt className="text-slate-500">Montant</dt>
          <dd className="font-semibold">{Number(pec.montant).toLocaleString("fr-FR")} FCFA</dd>
          <dt className="text-slate-500">Créée le</dt>
          <dd>{new Date(pec.created_at).toLocaleString("fr-FR")}</dd>
          {pec.mandataire_nom && (
            <>
              <dt className="text-slate-500">Personne mandatée</dt>
              <dd>{pec.mandataire_prenoms} {pec.mandataire_nom}</dd>
            </>
          )}
        </dl>

        {pec.statut === "en_attente_paiement" && (
          <div className="mt-5 flex gap-3">
            <Link href={`/sponsor/pec/${id}/paiement`}><Button>Procéder au paiement</Button></Link>
            <form action={cancelPecAction}>
              <input type="hidden" name="pec_id" value={id} />
              <Button variant="secondary" type="submit">Annuler cette demande</Button>
            </form>
          </div>
        )}
        {pec.statut === "paiement_echoue" && (
          <div className="mt-5">
            <Alert variant="error">Le dernier paiement a échoué.</Alert>
            <div className="mt-3 flex gap-3">
              <Link href={`/sponsor/pec/${id}/paiement`}><Button>Réessayer le paiement</Button></Link>
              <form action={cancelPecAction}>
                <input type="hidden" name="pec_id" value={id} />
                <Button variant="secondary" type="submit">Annuler cette demande</Button>
              </form>
            </div>
          </div>
        )}
      </Card>

      {(cuc || cur) && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Codes de sécurité</h2>
          <p className="mb-3 text-xs text-slate-500">
            Ces codes ont également été transmis au bénéficiaire par SMS. Le Code Unique de Retrait est
            à usage unique et devient inactif après le retrait.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {cuc && (
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Code Unique de Commande</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900">{cuc.valeur}</p>
                <StatusBadge status={cuc.statut} />
              </div>
            )}
            {cur && (
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Code Unique de Retrait</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900">{cur.valeur}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={cur.statut} />
                  {cur.expire_at && cur.statut === "actif" && (
                    <span className="text-xs text-slate-500">expire le {new Date(cur.expire_at).toLocaleString("fr-FR")}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {paiements.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Historique des paiements</h2>
          <ul className="space-y-2 text-sm">
            {paiements.map((pay: { id: string; reference_unique: string; moyen_paiement: string; statut: string; created_at: string }) => (
              <li key={pay.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-mono text-xs text-slate-500">{pay.reference_unique}</span>
                <span>{pay.moyen_paiement.replaceAll("_", " ")}</span>
                <StatusBadge status={pay.statut} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Link href="/sponsor/historique" className="mt-6 block text-center text-sm text-brand hover:underline">
        ← Retour à l&apos;historique
      </Link>
    </div>
  );
}
