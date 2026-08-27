import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, Card, PageHeader } from "@/components/ui";
import { PecForm } from "./pec-form";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  beneficiaire: "Merci de sélectionner ou renseigner un bénéficiaire valide.",
  pharmacie: "Cette pharmacie n'est pas disponible actuellement.",
  validation: "Merci de renseigner un montant valide et la référence de l'ordonnance.",
};

export default async function NouvellePecPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion?role=SPONSOR");
  const params = await searchParams;

  const sponsorRows = await db.sql`SELECT id FROM sponsors WHERE user_id = ${session.userId}`;
  const sponsorId = sponsorRows[0].id;

  const beneficiaires = await db.sql`
    SELECT id, identifiant_unique, nom, prenoms FROM beneficiaires WHERE sponsor_createur_id = ${sponsorId} ORDER BY created_at DESC
  `;
  const pharmacies = await db.sql`
    SELECT id, identifiant_unique, nom_commercial, ville, commune FROM pharmacies WHERE statut IN ('active','pilote') ORDER BY nom_commercial
  `;

  return (
    <div>
      <PageHeader title="Nouvelle prise en charge" subtitle="Toutes les étapes ci-dessous sont obligatoires, conformément au cycle de la PEC." />
      {params.erreur && (
        <div className="mb-4">
          <Alert variant="error">{errorMessages[params.erreur] ?? "Une erreur est survenue."}</Alert>
        </div>
      )}
      {pharmacies.length === 0 ? (
        <Alert variant="warning">Aucune pharmacie partenaire n&apos;est disponible pour le moment. Merci de réessayer plus tard.</Alert>
      ) : (
        <Card>
          <PecForm beneficiaires={beneficiaires} pharmacies={pharmacies} />
        </Card>
      )}
    </div>
  );
}
