import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PNMO — Plateforme Numérique Ma Nouvelle Ordonnance",
  description:
    "PNMO organise, sécurise et trace un mécanisme de solidarité pharmaceutique entre Sponsors, Bénéficiaires et Pharmacies Partenaires.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
