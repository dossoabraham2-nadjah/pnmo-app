import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const canalIcon: Record<string, string> = { sms: "SMS", whatsapp: "WhatsApp", email: "E-mail" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?role=SPONSOR");

  const sponsorRows = await db.sql`SELECT id FROM sponsors WHERE user_id = ${session.userId}`;
  const notifications = await db.sql`
    SELECT n.* FROM notifications n
    LEFT JOIN prises_en_charge p ON p.id = n.pec_id
    WHERE n.destinataire_user_id = ${session.userId}
       OR (p.sponsor_id = ${sponsorRows[0].id} AND n.destinataire_user_id IS NULL)
    ORDER BY n.created_at DESC
  `;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Boîte de test — regroupe les messages qui vous sont destinés ainsi que ceux simulés vers le bénéficiaire (SMS/WhatsApp/e-mail)."
      />
      {notifications.length === 0 ? (
        <EmptyState>Aucune notification pour le moment.</EmptyState>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: { id: string; canal: string; sujet: string | null; contenu: string; destinataire_label: string; created_at: string; destinataire_user_id: string | null }) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="badge bg-slate-100 text-slate-700">{canalIcon[n.canal] ?? n.canal}</span>
                <span>{new Date(n.created_at).toLocaleString("fr-FR")}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                À : {n.destinataire_user_id ? "Vous" : n.destinataire_label}
              </p>
              {n.sujet && <p className="mt-1 font-semibold text-slate-900">{n.sujet}</p>}
              <p className="mt-1 text-sm text-slate-600">{n.contenu}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
