import { Alert, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { lookupCodeAction } from "@/lib/actions-pharmacie";

const errorMessages: Record<string, string> = {
  code_manquant: "Merci de saisir un code.",
  inconnu: "Ce code n'existe pas dans le système. Tentative enregistrée dans le journal de sécurité.",
  mauvaise_pharmacie: "Ce code n'est pas associé à votre pharmacie.",
};

export default async function VerifierPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Vérifier un Code Unique de Retrait" subtitle="Le triptyque ordonnance + pièce d'identité + code est obligatoire avant toute délivrance." />
      {params.erreur && (
        <div className="mb-4">
          <Alert variant="error">{errorMessages[params.erreur] ?? "Code invalide."}</Alert>
        </div>
      )}
      <Card>
        <form action={lookupCodeAction} className="space-y-4">
          <Field label="Code Unique de Retrait (CUR)" htmlFor="cur" hint="Format : CUR-XXXX-XXXX, communiqué par le bénéficiaire">
            <Input id="cur" name="cur" required placeholder="CUR-XXXX-XXXX" className="font-mono uppercase" />
          </Field>
          <Button type="submit" className="w-full">Vérifier le code</Button>
        </form>
      </Card>
    </div>
  );
}
