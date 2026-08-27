import { db } from "./db";

type Canal = "sms" | "whatsapp" | "email";

interface NotifyParams {
  destinataireUserId?: string | null;
  destinataireLabel: string;
  canal: Canal;
  sujet?: string;
  contenu: string;
  pecId?: string | null;
}

/**
 * Notification simulée — en l'absence de contrats réels avec un agrégateur
 * SMS/WhatsApp Business en V1.0 du prototype, chaque message est stocké et
 * consultable comme une "boîte de réception de test" (voir /notifications).
 * Le connecteur réel pourra être branché ici sans changer les appelants.
 */
export async function sendNotification(params: NotifyParams) {
  await db.sql`
    INSERT INTO notifications (destinataire_user_id, destinataire_label, canal, sujet, contenu, pec_id, statut)
    VALUES (
      ${params.destinataireUserId ?? null},
      ${params.destinataireLabel},
      ${params.canal},
      ${params.sujet ?? null},
      ${params.contenu},
      ${params.pecId ?? null},
      'delivree'
    )
  `;
}
