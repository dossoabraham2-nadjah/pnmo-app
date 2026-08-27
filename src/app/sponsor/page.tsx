import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, Button, Card, PageHeader, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SponsorDashboard() {
  const session = await getSession();
  if (!session) redirect("/connexion?role=SPONSOR");

  const sponsorRows = await db.sql`SELECT * FROM sponsors WHERE user_id = ${session.userId}`;
  const sponsor = sponsorRows[0];

  const stats = await db.sql`
    SELECT statut, count(*)::int AS n FROM prises_en_charge WHERE sponsor_id = ${sponsor.id} GROUP BY statut
  `;
  const statMap = Object.fromEntries(stats.map((r: { statut: string; n: number }) => [r.statut, r.n]));

  const recentes = await db.sql`
    SELECT p.id, p.numero_unique, p.statut, p.montant, p.created_at, b.nom AS be_nom, b.prenoms AS be_prenoms, ph.nom_commercial
    FROM prises_en_charge p
    JOIN beneficiaires b ON b.id = p.beneficiaire_id
    JOIN pharmacies ph ON ph.id = p.pharmacie_id
    WHERE p.sponsor_id = ${sponsor.id}
    ORDER BY p.created_at DESC
    LIMIT 5
  `;

  const alertesExpiration = await db.sql`
    SELECT p.numero_unique, c.expire_at
    FROM codes c
    JOIN prises_en_charge p ON p.id = c.pec_id
    WHERE p.sponsor_id = ${sponsor.id} AND c.type = 'CUR' AND c.statut = 'actif'
      AND c.expire_at < now() + interval '24 hours'
    ORDER BY c.expire_at ASC
  `;

  const name = sponsor.type === "morale" ? sponsor.raison_sociale : `${sponsor.prenoms} ${sponsor.nom}`;

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${name}`}
        subtitle={`Identifiant PNMO : ${session.identifiant}`}
        action={
          <Link href="/sponsor/nouvelle-pec">
            <Button>+ Nouvelle prise en charge</Button>
          </Link>
        }
      />

      {alertesExpiration.length > 0 && (
        <div className="mb-6">
          <Alert variant="warning">
            {alertesExpiration.length} code(s) de retrait expirent dans moins de 24h :{" "}
            {alertesExpiration.map((a: { numero_unique: string }) => a.numero_unique).join(", ")}
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="En attente de paiement" value={statMap["en_attente_paiement"] ?? 0} />
        <StatCard label="En attente de retrait" value={statMap["en_attente_retrait"] ?? 0} />
        <StatCard label="Retraits effectués" value={statMap["retiree"] ?? 0} />
        <StatCard label="Paiements échoués" value={statMap["paiement_echoue"] ?? 0} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">Prises en charge récentes</h2>
        {recentes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune prise en charge pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">N° PEC</th>
                  <th className="py-2 pr-4">Bénéficiaire</th>
                  <th className="py-2 pr-4">Pharmacie</th>
                  <th className="py-2 pr-4">Montant</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((r: { id: string; numero_unique: string; statut: string; montant: number; be_nom: string; be_prenoms: string; nom_commercial: string }) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-mono text-xs">{r.numero_unique}</td>
                    <td className="py-2.5 pr-4">{r.be_prenoms} {r.be_nom}</td>
                    <td className="py-2.5 pr-4">{r.nom_commercial}</td>
                    <td className="py-2.5 pr-4">{Number(r.montant).toLocaleString("fr-FR")} FCFA</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={r.statut} /></td>
                    <td className="py-2.5">
                      <Link href={`/sponsor/pec/${r.id}`} className="text-brand hover:underline">Détails</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
