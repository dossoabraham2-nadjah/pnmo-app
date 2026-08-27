import Link from "next/link";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { loginAction } from "@/lib/actions-auth";

const roleLabels: Record<string, string> = {
  SPONSOR: "Sponsor",
  PHARMACY: "Pharmacie Partenaire",
  ADMIN: "Administrateur",
  SUPERADMIN: "Super Administrateur",
};

const errorMessages: Record<string, string> = {
  identifiants: "Identifiant ou mot de passe incorrect.",
  verrouille: "Compte temporairement verrouillé après plusieurs échecs. Réessayez plus tard.",
  suspendu: "Ce compte est suspendu. Contactez un administrateur.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const role = params.role && roleLabels[params.role] ? params.role : "SPONSOR";

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-brand">
          ← PNMO
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Connexion — {roleLabels[role]}</h1>
        <p className="mt-1 text-sm text-slate-500">Accédez à votre espace sécurisé.</p>

        <div className="mt-4">
          <p className="mb-1.5 text-sm font-medium text-slate-700">Espace</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(roleLabels).map(([value, label]) => (
              <Link key={value} href={`/connexion?role=${value}`} className={`rounded-full border px-2.5 py-1 ${value === role ? "border-brand bg-brand-light text-brand-dark" : "border-slate-200 text-slate-500"}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {params.erreur && (
          <div className="mt-4">
            <Alert variant="error">{errorMessages[params.erreur] ?? "Une erreur est survenue."}</Alert>
          </div>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="role" value={role} />
          <Field label="Identifiant unique PNMO ou e-mail" htmlFor="identifiant">
            <Input id="identifiant" name="identifiant" required placeholder="SP-000001 ou vous@exemple.com" />
          </Field>
          <Field label="Mot de passe" htmlFor="password">
            <Input id="password" name="password" type="password" required />
          </Field>
          <Button type="submit" className="w-full">Se connecter</Button>
        </form>

        {role === "SPONSOR" && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Pas encore de compte ? <Link href="/inscription" className="font-medium text-brand hover:underline">S&apos;inscrire</Link>
          </p>
        )}

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Comptes de démonstration</p>
          <ul className="mt-1 space-y-0.5">
            <li>Sponsor : SP-000001 / Sponsor@2026</li>
            <li>Pharmacie : PH-000001 / Pharmacie@2026</li>
            <li>Admin : AD-000001 / Admin@2026</li>
            <li>Super Admin : SA-000001 / SuperAdmin@2026</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
