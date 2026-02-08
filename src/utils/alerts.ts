export interface AlertPayload {
  subject: string;
  context: string;
  error: string;
  route: string;
}

// Rate limiter: max 1 alert per unique subject per 5 minutes
const alertCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

export async function sendAlert(payload: AlertPayload): Promise<void> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn('[ALERT] No BREVO_API_KEY configured, logging alert only:', payload.subject);
      console.error(`[ALERT] ${payload.subject} | Route: ${payload.route} | Context: ${payload.context} | Error: ${payload.error}`);
      return;
    }

    // Rate limiting
    const now = Date.now();
    const lastSent = alertCooldowns.get(payload.subject);
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      console.log(`[ALERT] Rate-limited: "${payload.subject}" (sent ${Math.round((now - lastSent) / 1000)}s ago)`);
      return;
    }

    const recipientEmail = process.env.ALERT_RECIPIENT_EMAIL || process.env.BREVO_SENDER_EMAIL;
    if (!recipientEmail) {
      console.warn('[ALERT] No ALERT_RECIPIENT_EMAIL or BREVO_SENDER_EMAIL configured');
      return;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@twisted.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Twisted Sync';

    const timestamp = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(new Date());

    const subject = `[TWISTED ALERT] ${payload.subject}`;
    const textContent = `Alerte Twisted Sync App

Timestamp: ${timestamp}
Route: ${payload.route}
Sujet: ${payload.subject}

Contexte:
${payload.context}

Erreur:
${payload.error}

---
Cet email est envoyé automatiquement par le système d'alertes Twisted Sync.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipientEmail }],
          subject,
          textContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ALERT] Brevo API error: ${response.status} - ${errorText}`);
        return;
      }

      alertCooldowns.set(payload.subject, now);
      console.log(`[ALERT] Alert email sent: "${payload.subject}" -> ${recipientEmail}`);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    // Alerts must NEVER crash the calling code
    console.error(`[ALERT] Failed to send alert: ${error.message}`);
  }
}

// Export for testing
export function _resetCooldowns(): void {
  alertCooldowns.clear();
}

export function _getCooldowns(): Map<string, number> {
  return alertCooldowns;
}
