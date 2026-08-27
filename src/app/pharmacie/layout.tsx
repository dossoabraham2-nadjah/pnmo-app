import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { SpaceShell } from "@/components/space-shell";

export const dynamic = "force-dynamic";

export default async function PharmacieLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "PHARMACY") {
    redirect("/connexion?role=PHARMACY");
  }

  return (
    <SpaceShell
      title="Espace Pharmacie"
      identifiant={session.identifiant}
      accent="indigo"
      nav={[
        { href: "/pharmacie", label: "Tableau de bord" },
        { href: "/pharmacie/verifier", label: "Vérifier un code" },
        { href: "/pharmacie/historique", label: "Historique des retraits" },
        { href: "/pharmacie/indisponibilite", label: "Signaler une indisponibilité" },
      ]}
    >
      {children}
    </SpaceShell>
  );
}
