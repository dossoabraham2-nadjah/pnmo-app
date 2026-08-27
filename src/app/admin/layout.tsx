import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { SpaceShell } from "@/components/space-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/connexion?role=ADMIN");
  }

  return (
    <SpaceShell
      title="Espace Administrateur"
      identifiant={session.identifiant}
      accent="slate"
      nav={[
        { href: "/admin", label: "Tableau de bord" },
        { href: "/admin/incidents", label: "Incidents" },
        { href: "/admin/sponsors", label: "Sponsors" },
        { href: "/admin/beneficiaires", label: "Bénéficiaires" },
        { href: "/admin/pharmacies", label: "Pharmacies" },
      ]}
    >
      {children}
    </SpaceShell>
  );
}
