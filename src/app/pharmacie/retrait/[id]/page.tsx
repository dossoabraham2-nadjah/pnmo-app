import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, Button, Card, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { confirmRetraitAction, refuserRetraitAction } from "@/lib/actions-pharmacie";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  code_inconnu: "Code inconnu.",
  mauvaise_pharmacie: "Ce code n'est pas destiné à votre pharmacie.",
  deja_utilise: "Ce code a déjà été utilisé pour un retrait.",
  annule: "Ce code a été annulé.",
  expire: "Ce code a expiré.",
  pec_non_disponible: "Cette prise en charge n'est plus disponible pour retrait.",
};

export default async function RetraitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string; erreur?: string; succes?: string; refuse?: string; statut?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion?role=PHARMACY");
  const { id } = await params;
  const sp = await searchParams;

  const pharmRows = await db.sql`SELECT id FROM pharmacies WHERE user_id = ${session.userId}`;
  const rows = await db.sql`
    SELECT p.*, b.nom AS be_nom, b.prenoms AS be_prenoms, b.identifiant_unique AS be_identifiant, b.date_naissance AS be_naissance,
           s.type AS sponsor_type
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN sponsors s ON s.id = p.sponsor_id
    WHERE p.id = ${id} AND p.pharmacie_id = ${pharmRows[0].id}
  `;
  const pec = rows[0];
  if (!pec) redirect("/pharmacie");

  const codes = await db.sql`SELECT type, valeur, statut FROM codes WHERE pec_id = ${id}`;
  const cur = codes.find((c: { type: string }) => c.type === "CUR");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Prise en charge ${pec.numero_unique}`} action={<StatusBadge status={pec.statut} />} />

      {sp.succes && <div className="mb-4"><Alert variant="success">Retrait confirmé avec succès. La prise en charge est clôturée.</Alert></div>}
      {sp.refuse && <div className="mb-4"><Alert variant="warning">Retrait refusé et incident enregistré.</Alert></div>}
      {sp.erreur && <div className="mb-4"><Alert variant="error">{errorMessages[sp.erreur] ?? "Erreur lors de la vérification."}</Alert></div>}

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Bénéficiaire</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Nom complet</dt>
          <dd className="font-medium">{pec.be_prenoms} {pec.be_nom}</dd>
          <dt className="text-slate-500">Identifiant PNMO</dt>
          <dd>{pec.be_identifiant}</dd>
          {pec.be_naissance && (<><dt className="text-slate-500">Date de naissance</dt><dd>{new Date(pec.be_naissance).toLocaleDateString("fr-FR")}</dd></>)}
          <dt className="text-slate-500">Ordonnance</dt>
          <dd>{pec.ordonnance_reference}</dd>
          <dt className="text-slate-500">Montant financé</dt>
          <dd className="font-semibold">{Number(pec.montant).toLocaleString("fr-FR")} FCFA</dd>
          {pec.mandataire_nom && (<><dt className="text-slate-500">Retrait par mandataire</dt><dd>{pec.mandataire_prenoms} {pec.mandataire_nom} ({pec.mandataire_lien})</dd></>)}
        </dl>
      </Card>

      {pec.statut === "en_attente_retrait" && sp.code && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Vérification avant délivrance</h2>
          <p className="mb-4 text-xs text-slate-500">
            Conformément au CCFT, la délivrance exige la présentation simultanée de l&apos;ordonnance originale,
            d&apos;une pièce d&apos;identité valide, et de ce Code Unique de Retrait actif.
          </p>
          <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
            Code présenté : <span className="font-mono font-bold">{sp.code}</span> — statut : {cur?.statut ?? "?"}
          </div>
          <form action={confirmRetraitAction} className="flex gap-3">
            <input type="hidden" name="pec_id" value={id} />
            <input type="hidden" name="code" value={sp.code} />
            <Button type="submit" className="flex-1">Confirmer la délivrance et le retrait</Button>
          </form>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-red-600">Refuser la délivrance</summary>
            <form action={refuserRetraitAction} className="mt-3 space-y-3">
              <input type="hidden" name="pec_id" value={id} />
              <input type="hidden" name="code" value={sp.code} />
              <Field label="Motif du refus" htmlFor="motif">
                <Textarea id="motif" name="motif" rows={2} placeholder="Ordonnance non conforme, pièce d'identité absente, tentative de fraude..." required />
              </Field>
              <Button type="submit" variant="danger">Confirmer le refus</Button>
            </form>
          </details>
        </Card>
      )}

      <Link href="/pharmacie" className="mt-6 block text-center text-sm text-slate-500 hover:underline">
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}
