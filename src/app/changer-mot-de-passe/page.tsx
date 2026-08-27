import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { changePasswordAction } from "@/lib/actions-account";
import { Alert, Button, Card, Field, Input } from "@/components/ui";

export default async function ChangerMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const params = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-900">Changement de mot de passe requis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.
        </p>
        {params.erreur && (
          <div className="mt-4">
            <Alert variant="error">Mot de passe actuel incorrect, ou nouveaux mots de passe invalides/différents (8 caractères minimum).</Alert>
          </div>
        )}
        <form action={changePasswordAction} className="mt-6 space-y-4">
          <Field label="Mot de passe actuel" htmlFor="current_password">
            <Input id="current_password" name="current_password" type="password" required />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="new_password">
            <Input id="new_password" name="new_password" type="password" required minLength={8} />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" htmlFor="new_password_confirm">
            <Input id="new_password_confirm" name="new_password_confirm" type="password" required minLength={8} />
          </Field>
          <Button type="submit" className="w-full">Valider</Button>
        </form>
      </Card>
    </div>
  );
}
