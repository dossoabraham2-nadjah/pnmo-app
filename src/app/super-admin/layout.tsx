import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { SpaceShell } from "@/components/space-shell";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    redirect("/connexion?role=SUPERADMIN");
  }

  return (
    <SpaceShell
      title="Super Administrateur"
      identifiant={session.identifiant}
      accent="indigo"
      nav={[
        { href: "/super-admin", label: "Tableau de bord" },
        { href: "/super-admin/administrateurs", label: "Administrateurs" },
        { href: "/super-admin/pharmacies", label: "Pharmacies" },
        { href: "/super-admin/audit", label: "Journal d'audit" },
        { href: "/super-admin/parametres", label: "Paramètres" },
      ]}
    >
      {children}
    </SpaceShell>
  );
}
