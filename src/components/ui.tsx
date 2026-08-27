import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-brand hover:bg-brand-light",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20",
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  actif: "bg-teal-100 text-teal-800",
  active: "bg-teal-100 text-teal-800",
  succes: "bg-teal-100 text-teal-800",
  retiree: "bg-teal-100 text-teal-800",
  delivree: "bg-teal-100 text-teal-800",
  envoyee: "bg-teal-100 text-teal-800",
  paiement_valide: "bg-blue-100 text-blue-800",
  en_attente_retrait: "bg-blue-100 text-blue-800",
  en_cours: "bg-blue-100 text-blue-800",
  pilote: "bg-amber-100 text-amber-800",
  en_attente_paiement: "bg-amber-100 text-amber-800",
  ouvert: "bg-amber-100 text-amber-800",
  moyen: "bg-amber-100 text-amber-800",
  suspendu: "bg-orange-100 text-orange-800",
  suspendue: "bg-orange-100 text-orange-800",
  eleve: "bg-orange-100 text-orange-800",
  echec: "bg-red-100 text-red-800",
  echoue: "bg-red-100 text-red-800",
  paiement_echoue: "bg-red-100 text-red-800",
  refusee: "bg-red-100 text-red-800",
  annulee: "bg-red-100 text-red-800",
  annule: "bg-red-100 text-red-800",
  expiree: "bg-red-100 text-red-800",
  expire: "bg-red-100 text-red-800",
  retiree_pharmacie: "bg-red-100 text-red-800",
  critique: "bg-red-100 text-red-800",
  utilise: "bg-slate-200 text-slate-700",
  cloture: "bg-slate-200 text-slate-700",
  faible: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("badge", statusStyles[status] ?? "bg-slate-100 text-slate-700")}>
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function Alert({ variant = "info", children }: { variant?: "info" | "success" | "error" | "warning"; children: ReactNode }) {
  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-teal-50 text-teal-800 border-teal-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return <div className={cn("rounded-lg border px-4 py-3 text-sm", styles[variant])}>{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
