import Link from "next/link";
import { Button, Card } from "@/components/ui";

const spaces = [
  {
    role: "SPONSOR",
    title: "Espace Sponsor",
    desc: "Financez l'ordonnance d'un proche, en toute sécurité et traçabilité.",
    href: "/connexion?role=SPONSOR",
    signup: "/inscription",
  },
  {
    role: "PHARMACY",
    title: "Espace Pharmacie Partenaire",
    desc: "Vérifiez et validez les retraits de médicaments financés via PNMO.",
    href: "/connexion?role=PHARMACY",
  },
  {
    role: "ADMIN",
    title: "Espace Administrateur",
    desc: "Suivez les opérations, accompagnez les utilisateurs, gérez les incidents.",
    href: "/connexion?role=ADMIN",
  },
  {
    role: "SUPERADMIN",
    title: "Espace Super Administrateur",
    desc: "Gouvernance, sécurité, paramètres stratégiques et audit de la plateforme.",
    href: "/connexion?role=SUPERADMIN",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-brand">PNMO</span>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#fonctionnement" className="text-slate-600 hover:text-slate-900">Comment ça marche</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">FAQ</a>
            <Link href="/inscription">
              <Button>Devenir Sponsor</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-light/60 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="mb-3 inline-block rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">
            Plateforme Numérique Ma Nouvelle Ordonnance
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Organisez, sécurisez et tracez la solidarité pharmaceutique
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            PNMO permet à un Sponsor de financer l&apos;ordonnance médicale d&apos;un proche, avec la garantie
            que chaque franc engagé sert exclusivement aux produits prescrits — retirés en pharmacie
            partenaire avec un code unique, une ordonnance originale et une pièce d&apos;identité.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/inscription">
              <Button className="px-6 py-3 text-base">Créer un compte Sponsor</Button>
            </Link>
            <a href="#fonctionnement">
              <Button variant="secondary" className="px-6 py-3 text-base">Découvrir le fonctionnement</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          Accéder à mon espace
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {spaces.map((s) => (
            <Card key={s.role} className="flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              </div>
              <Link href={s.href} className="mt-4">
                <Button variant="secondary" className="w-full">Se connecter</Button>
              </Link>
              {s.signup && (
                <Link href={s.signup} className="mt-2 text-center text-xs font-medium text-brand hover:underline">
                  Pas encore de compte ? S&apos;inscrire
                </Link>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section id="fonctionnement" className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">Le parcours d&apos;une prise en charge</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "1", t: "Le Sponsor crée une prise en charge", d: "Il désigne le Bénéficiaire, choisit la Pharmacie Partenaire et règle le montant via Mobile Money." },
              { n: "2", t: "Un code unique est généré", d: "Après paiement confirmé, un Code Unique de Retrait est généré automatiquement et transmis." },
              { n: "3", t: "Retrait sécurisé en pharmacie", d: "Le Bénéficiaire présente son ordonnance, sa pièce d'identité et le code — vérifiés par la pharmacie." },
              { n: "4", t: "Clôture et traçabilité", d: "La prise en charge est clôturée et chaque étape reste consultable dans l'historique du Sponsor." },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {step.n}
                </div>
                <h3 className="font-semibold text-slate-900">{step.t}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900">Questions fréquentes</h2>
        <div className="mt-6 space-y-4">
          {[
            { q: "PNMO délivre-t-elle des médicaments ?", r: "Non. PNMO ne réalise ni diagnostic, ni prescription, ni délivrance. Elle organise et sécurise le financement et le retrait, dans le strict respect du rôle des professionnels de santé." },
            { q: "Comment le Bénéficiaire retire-t-il les médicaments ?", r: "Il se présente à la pharmacie partenaire choisie avec l'ordonnance originale, une pièce d'identité valide et le Code Unique de Retrait reçu par SMS/WhatsApp/e-mail." },
            { q: "Que se passe-t-il si le paiement échoue ?", r: "Aucun code n'est généré tant que le paiement n'est pas confirmé. Le Sponsor peut reprendre l'opération." },
            { q: "Le Bénéficiaire a-t-il un compte PNMO ?", r: "Non, en version 1.0 le Bénéficiaire n'a pas de compte : il est enregistré par le Sponsor et reçoit ses informations par notification." },
          ].map((item) => (
            <details key={item.q} className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-800">{item.q}</summary>
              <p className="mt-2 text-sm text-slate-500">{item.r}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>PNMO — Prototype fonctionnel de démonstration, d&apos;après le Cahier des Charges Fonctionnel et Technique V1.0.</p>
        <p className="mt-1">Les paiements Mobile Money et les notifications SMS/WhatsApp sont simulés dans ce prototype.</p>
      </footer>
    </div>
  );
}
