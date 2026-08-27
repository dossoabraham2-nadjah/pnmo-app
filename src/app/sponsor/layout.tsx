import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { SpaceShell } from "@/components/space-shell";

export const dynamic = "force-dynamic";

export default async function SponsorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "SPONSOR") {
    redirect("/connexion?role=SPONSOR");
  }

  return (
    <SpaceShell
      title="Espace Sponsor"
      identifiant={session.identifiant}
      accent="brand"
      nav={[
        { href: "/sponsor", label: "Tableau de bord" },
        { href: "/sponsor/nouvelle-pec", label: "Nouvelle prise en charge" },
        { href: "/sponsor/historique", label: "Mes prises en charge" },
        { href: "/sponsor/notifications", label: "Notifications" },
      ]}
    >
      {children}
    </SpaceShell>
  );
}
