import Link from "next/link";
import { Alert, Card } from "@/components/ui";
import { RegistrationForm } from "./registration-form";

const errorMessages: Record<string, string> = {
  validation: "Merci de renseigner un e-mail valide et un mot de passe d'au moins 8 caractères.",
  mdp_differents: "Les mots de passe ne correspondent pas.",
  email_existe: "Un compte existe déjà avec cette adresse e-mail.",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex flex-1 justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-brand">← PNMO</Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Créer un compte Sponsor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Un identifiant unique PNMO vous sera attribué automatiquement à la création du compte.
        </p>
        {params.erreur && (
          <div className="mt-4">
            <Alert variant="error">{errorMessages[params.erreur] ?? "Une erreur est survenue."}</Alert>
          </div>
        )}
        <div className="mt-6">
          <RegistrationForm />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Déjà un compte ? <Link href="/connexion?role=SPONSOR" className="font-medium text-brand hover:underline">Se connecter</Link>
        </p>
      </Card>
    </div>
  );
}
