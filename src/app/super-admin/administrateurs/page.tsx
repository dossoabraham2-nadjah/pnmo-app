import { Alert, Button, Card, Field, Input, PageHeader, StatusBadge } from "@/components/ui";
import { db } from "@/lib/db";
import { createAdminAction, toggleUserStatusAction } from "@/lib/actions-superadmin";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  validation: "Merci de renseigner un e-mail valide.",
  email_existe: "Un compte existe déjà avec cette adresse e-mail.",
};

export default async function AdministrateursPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; cree?: string }>;
}) {
  const sp = await searchParams;
  const admins = await db.sql`SELECT * FROM users WHERE role = 'ADMIN' ORDER BY created_at DESC`;

  const [creeIdentifiant, creeMotDePasse] = sp.cree ? sp.cree.split(":") : [null, null];

  return (
    <div>
      <PageHeader title="Administrateurs" subtitle="Créés exclusivement par le Super Administrateur" />

      {sp.erreur && <div className="mb-4"><Alert variant="error">{errorMessages[sp.erreur] ?? "Erreur"}</Alert></div>}
      {creeIdentifiant && (
        <div className="mb-4">
          <Alert variant="success">
            Administrateur créé : <strong>{creeIdentifiant}</strong> — mot de passe temporaire :{" "}
            <span className="font-mono">{creeMotDePasse}</span> (changement obligatoire à la première connexion).
          </Alert>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">Créer un Administrateur</h2>
        <form action={createAdminAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Adresse électronique" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
          <Field label="Téléphone" htmlFor="telephone"><Input id="telephone" name="telephone" /></Field>
          <div className="flex items-end"><Button type="submit" className="w-full">Créer</Button></div>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Identifiant</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a: { id: string; identifiant_unique: string; email: string; telephone: string; statut: string }) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-mono text-xs">{a.identifiant_unique}</td>
                  <td className="py-2.5 pr-4 text-xs text-slate-500">{a.email}<br />{a.telephone}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={a.statut} /></td>
                  <td className="py-2.5">
                    <form action={toggleUserStatusAction}>
                      <input type="hidden" name="user_id" value={a.id} />
                      <input type="hidden" name="next_statut" value={a.statut === "active" ? "suspendu" : "active"} />
                      <input type="hidden" name="redirect_to" value="/super-admin/administrateurs" />
                      <Button type="submit" variant="secondary">
                        {a.statut === "active" ? "Suspendre" : "Réactiver"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
