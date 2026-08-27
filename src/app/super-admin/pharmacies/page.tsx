import { Alert, Button, Card, Field, Input, PageHeader, Select, StatusBadge } from "@/components/ui";
import { db } from "@/lib/db";
import { createPharmacieAction, updatePharmacieStatutAction } from "@/lib/actions-superadmin";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  validation: "Merci de renseigner un nom commercial et un e-mail valide.",
  email_existe: "Un compte existe déjà avec cette adresse e-mail.",
};

export default async function SuperAdminPharmaciesPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; cree?: string }>;
}) {
  const sp = await searchParams;
  const pharmacies = await db.sql`
    SELECT p.*, u.email, u.telephone AS user_telephone FROM pharmacies p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC
  `;
  const [creeIdentifiant, creeMotDePasse] = sp.cree ? sp.cree.split(":") : [null, null];

  return (
    <div>
      <PageHeader title="Pharmacies Partenaires" subtitle="Enregistrement et statut du réseau" />

      {sp.erreur && <div className="mb-4"><Alert variant="error">{errorMessages[sp.erreur] ?? "Erreur"}</Alert></div>}
      {creeIdentifiant && (
        <div className="mb-4">
          <Alert variant="success">
            Pharmacie créée : <strong>{creeIdentifiant}</strong> — mot de passe temporaire :{" "}
            <span className="font-mono">{creeMotDePasse}</span>
          </Alert>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">Enregistrer une Pharmacie Partenaire</h2>
        <form action={createPharmacieAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom commercial" htmlFor="nom_commercial"><Input id="nom_commercial" name="nom_commercial" required /></Field>
          <Field label="Pharmacien titulaire" htmlFor="pharmacien_titulaire"><Input id="pharmacien_titulaire" name="pharmacien_titulaire" /></Field>
          <Field label="Adresse" htmlFor="adresse"><Input id="adresse" name="adresse" required /></Field>
          <Field label="Commune" htmlFor="commune"><Input id="commune" name="commune" /></Field>
          <Field label="Ville" htmlFor="ville"><Input id="ville" name="ville" defaultValue="Abidjan" /></Field>
          <Field label="Région" htmlFor="region"><Input id="region" name="region" defaultValue="Lagunes" /></Field>
          <Field label="Téléphone" htmlFor="telephone"><Input id="telephone" name="telephone" required /></Field>
          <Field label="Adresse électronique" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
          <div className="sm:col-span-2"><Button type="submit">Créer la fiche pharmacie</Button></div>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {pharmacies.map((p: { id: string; identifiant_unique: string; nom_commercial: string; adresse: string; ville: string; statut: string; email: string }) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-slate-400">{p.identifiant_unique}</p>
                <h3 className="font-semibold text-slate-900">{p.nom_commercial}</h3>
                <p className="text-xs text-slate-500">{p.adresse}, {p.ville}</p>
              </div>
              <StatusBadge status={p.statut} />
            </div>
            <form action={updatePharmacieStatutAction} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="pharmacie_id" value={p.id} />
              <Select name="statut" defaultValue={p.statut} className="text-xs">
                <option value="pilote">Pilote</option>
                <option value="active">Active</option>
                <option value="suspendue">Suspendue</option>
                <option value="retiree">Retirée</option>
              </Select>
              <Button type="submit" variant="secondary">Mettre à jour</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
