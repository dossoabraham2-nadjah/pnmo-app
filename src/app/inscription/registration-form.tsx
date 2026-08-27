"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { registerSponsorAction } from "@/lib/actions-auth";

export function RegistrationForm() {
  const [type, setType] = useState<"physique" | "morale">("physique");

  return (
    <form action={registerSponsorAction} className="space-y-5">
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Type de Sponsor</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("physique")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${type === "physique" ? "border-brand bg-brand-light text-brand-dark" : "border-slate-300 text-slate-600"}`}
          >
            Personne physique
          </button>
          <button
            type="button"
            onClick={() => setType("morale")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${type === "morale" ? "border-brand bg-brand-light text-brand-dark" : "border-slate-300 text-slate-600"}`}
          >
            Personne morale
          </button>
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {type === "physique" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" htmlFor="nom"><Input id="nom" name="nom" required /></Field>
          <Field label="Prénoms" htmlFor="prenoms"><Input id="prenoms" name="prenoms" required /></Field>
          <Field label="Date de naissance" htmlFor="date_naissance"><Input id="date_naissance" name="date_naissance" type="date" /></Field>
          <Field label="Sexe" htmlFor="sexe">
            <Select id="sexe" name="sexe" defaultValue="M">
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Select>
          </Field>
          <Field label="Nationalité" htmlFor="nationalite"><Input id="nationalite" name="nationalite" defaultValue="Ivoirienne" /></Field>
          <Field label="Profession" htmlFor="profession"><Input id="profession" name="profession" /></Field>
          <Field label="Type de pièce d'identité" htmlFor="piece_type">
            <Select id="piece_type" name="piece_type" defaultValue="CNI">
              <option value="CNI">Carte Nationale d&apos;Identité</option>
              <option value="Passeport">Passeport</option>
              <option value="Carte consulaire">Carte consulaire</option>
              <option value="Permis de conduire">Permis de conduire</option>
            </Select>
          </Field>
          <Field label="Numéro de pièce" htmlFor="piece_numero"><Input id="piece_numero" name="piece_numero" required /></Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Raison sociale" htmlFor="raison_sociale"><Input id="raison_sociale" name="raison_sociale" required /></Field>
          <Field label="Forme juridique" htmlFor="forme_juridique"><Input id="forme_juridique" name="forme_juridique" placeholder="SARL, SA, ONG..." /></Field>
          <Field label="N° RCCM" htmlFor="rccm"><Input id="rccm" name="rccm" /></Field>
          <Field label="N° CC" htmlFor="cc"><Input id="cc" name="cc" /></Field>
          <Field label="Représentant légal" htmlFor="representant_legal"><Input id="representant_legal" name="representant_legal" required /></Field>
          <Field label="Fonction du représentant" htmlFor="representant_fonction"><Input id="representant_fonction" name="representant_fonction" /></Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adresse de résidence" htmlFor="adresse"><Input id="adresse" name="adresse" /></Field>
        <Field label="Ville" htmlFor="ville"><Input id="ville" name="ville" defaultValue="Abidjan" /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone principal" htmlFor="telephone"><Input id="telephone" name="telephone" required placeholder="+225 07 00 00 00 00" /></Field>
        <Field label="Adresse électronique" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum">
          <Input id="password" name="password" type="password" required minLength={8} />
        </Field>
        <Field label="Confirmation du mot de passe" htmlFor="password_confirm">
          <Input id="password_confirm" name="password_confirm" type="password" required minLength={8} />
        </Field>
      </div>

      <Button type="submit" className="w-full">Créer mon compte Sponsor</Button>
    </form>
  );
}
