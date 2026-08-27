import Link from "next/link";
import { ReactNode } from "react";
import { logoutAction } from "@/lib/actions-auth";

export function SpaceShell({
  title,
  identifiant,
  nav,
  children,
  accent = "brand",
}: {
  title: string;
  identifiant: string;
  nav: { href: string; label: string }[];
  children: ReactNode;
  accent?: "brand" | "indigo" | "slate";
}) {
  const accents: Record<string, string> = {
    brand: "bg-brand",
    indigo: "bg-indigo-700",
    slate: "bg-slate-800",
  };
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className={`${accents[accent]} px-5 py-5 text-white`}>
          <Link href="/" className="text-sm font-semibold opacity-90">
            PNMO
          </Link>
          <p className="mt-0.5 text-base font-bold">{title}</p>
          <p className="text-xs opacity-80">{identifiant}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="p-3">
          <button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">
            Se déconnecter
          </button>
        </form>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="font-bold text-brand">PNMO — {title}</span>
          <form action={logoutAction}>
            <button className="text-sm text-slate-600">Déconnexion</button>
          </form>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
