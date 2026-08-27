"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { createPecAction } from "@/lib/actions-pec";

interface Beneficiaire {
  id: string;
  identifiant_unique: string;
  nom: string;
  prenoms: string;
}
interface Pharmacie {
  id: string;
  identifiant_unique: string;
  nom_commercial: string;
  ville: string;
  commune: string | null;
}

export function PecForm({ beneficiaires, pharmacies }: { beneficiaires: Beneficiaire[]; pharmacies: Pharmacie[] }) {
  const [mode, setMode] = useState<"existant" | "nouveau">(beneficiaires.length > 0 ? "existant" : "nouveau");
  const [avecMandataire, setAvecMandataire] = useState(false);

  return (
    <form action={createPecAction} className="space-y-8">
      <section>
        <h2 className="mb-3 font-semibold text-slate-900">1. Bénéficiaire</h2>
        {beneficiaires.length > 0 && (
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setMode("existant")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${mode === "existant" ? "border-brand bg-brand-light text-brand-dark" : "border-slate-300 text-slate-600"}`}>
              Bénéficiaire existant
            </button>
            <button type="button" onClick={() => setMode("nouveau")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${mode === "nouveau" ? "border-brand bg-brand-light text-brand-dark" : "border-slate-300 text-slate-600"}`}>
              Nouveau bénéficiaire
            </button>
          </div>
        )}
        <input type="hidden" name="beneficiaire_mode" value={mode} />

        {mode === "existant" ? (
          <Field label="Choisir un bénéficiaire déjà enregistré" htmlFor="beneficiaire_id">
            <Select id="beneficiaire_id" name="beneficiaire_id" required>
              <option value="">— Sélectionner —</option>
              {beneficiaires.map((b) => (
                <option key={b.id} value={b.id}>{b.prenoms} {b.nom} ({b.identifiant_unique})</option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" htmlFor="be_nom"><Input id="be_nom" name="be_nom" required /></Field>
            <Field label="Prénoms" htmlFor="be_prenoms"><Input id="be_prenoms" name="be_prenoms" required /></Field>
            <Field label="Sexe" htmlFor="be_sexe">
              <Select id="be_sexe" name="be_sexe" defaultValue="F">
                <option value="F">Féminin</option>
                <option value="M">Masculin</option>
              </Select>
            </Field>
            <Field label="Date de naissance" htmlFor="be_date_naissance"><Input id="be_date_naissance" name="be_date_naissance" type="date" /></Field>
            <Field label="Nationalité" htmlFor="be_nationalite"><Input id="be_nationalite" name="be_nationalite" defaultValue="Ivoirienne" /></Field>
            <Field label="Téléphone (si disponible)" htmlFor="be_telephone"><Input id="be_telephone" name="be_telephone" placeholder="+225 07 00 00 00 00" /></Field>
            <Field label="Ville" htmlFor="be_ville"><Input id="be_ville" name="be_ville" defaultValue="Abidjan" /></Field>
            <Field label="Lien avec le Sponsor" htmlFor="be_lien"><Input id="be_lien" name="be_lien" placeholder="Mère, père, conjoint..." /></Field>
            <Field label="Adresse" htmlFor="be_adresse"><Input id="be_adresse" name="be_adresse" /></Field>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">2. Personne mandatée (facultatif)</h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={avecMandataire} onChange={(e) => setAvecMandataire(e.target.checked)} />
            Le retrait sera fait par une autre personne
          </label>
        </div>
        {avecMandataire && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" htmlFor="mandataire_nom"><Input id="mandataire_nom" name="mandataire_nom" /></Field>
            <Field label="Prénoms" htmlFor="mandataire_prenoms"><Input id="mandataire_prenoms" name="mandataire_prenoms" /></Field>
            <Field label="Téléphone" htmlFor="mandataire_telephone"><Input id="mandataire_telephone" name="mandataire_telephone" /></Field>
            <Field label="Lien avec le bénéficiaire" htmlFor="mandataire_lien"><Input id="mandataire_lien" name="mandataire_lien" /></Field>
            <Field label="Type de pièce d'identité" htmlFor="mandataire_piece_type"><Input id="mandataire_piece_type" name="mandataire_piece_type" placeholder="CNI, Passeport..." /></Field>
            <Field label="Numéro de pièce" htmlFor="mandataire_piece_numero"><Input id="mandataire_piece_numero" name="mandataire_piece_numero" /></Field>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">3. Ordonnance et pharmacie</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Référence de l'ordonnance" htmlFor="ordonnance_reference" hint="Ex : numéro, prescripteur, date">
            <Input id="ordonnance_reference" name="ordonnance_reference" required />
          </Field>
          <Field label="Montant à financer (FCFA)" htmlFor="montant">
            <Input id="montant" name="montant" type="number" min={500} step={1} required />
          </Field>
          <Field label="Pharmacie Partenaire" htmlFor="pharmacie_id">
            <Select id="pharmacie_id" name="pharmacie_id" required>
              <option value="">— Sélectionner —</option>
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>{p.nom_commercial} — {p.commune ? `${p.commune}, ` : ""}{p.ville}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description / observations" htmlFor="observations" hint="Aucune information médicale confidentielle ne doit être transmise ici">
            <Textarea id="observations" name="observations" rows={3} />
          </Field>
        </div>
      </section>

      <Button type="submit" className="w-full">Continuer vers le paiement</Button>
    </form>
  );
}
