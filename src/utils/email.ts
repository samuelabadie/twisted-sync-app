import { logger } from './logger';

export class EmailService {
  private apiKey: string | undefined;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@twisted.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Twisted Coiffure';

    if (!this.apiKey) {
      logger.warn('Email service not configured (missing BREVO_API_KEY). Emails will be logged only.');
    }
  }

  async sendPaymentLink(to: string, checkoutUrl: string, bookingId: string) {
    const subject = `Paiement de votre acompte - Réservation Twisted`;
    const textContent = `Bonjour,\n\nMerci pour votre réservation.\n\nPour la confirmer, veuillez régler l'acompte de 30% via ce lien sécurisé :\n${checkoutUrl}\n\nCe lien est valable 15 minutes.\n\nCordialement,\nL'équipe Twisted`;
    const htmlContent = `
      <p>Bonjour,</p>
      <p>Merci pour votre réservation.</p>
      <p>Pour la confirmer, veuillez régler l'acompte de 30% via ce lien sécurisé :</p>
      <p><a href="${checkoutUrl}">${checkoutUrl}</a></p>
      <p>Ce lien est valable 15 minutes.</p>
      <p>Cordialement,<br>L'équipe Twisted</p>
    `;

    if (this.apiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: this.senderName, email: this.senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent,
            textContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
        }

        logger.info(`Email sent to ${to}`);
      } catch (error: any) {
        logger.error('Failed to send email via Brevo API', { error: error.message });
        throw error;
      }
    } else {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Link: ${checkoutUrl}`);
    }
  }

  /**
   * Send payment confirmation email with booking details
   */
  async sendPaymentConfirmation(
    to: string,
    bookingDetails: {
      serviceName: string;
      dateTime: string;
      resourceName?: string;
      amountPaid: number;
    }
  ) {
    const subject = `Confirmation de votre réservation - Twisted`;

    const formattedDate = bookingDetails.dateTime;
    const employeeInfo = bookingDetails.resourceName ? `avec ${bookingDetails.resourceName}` : '';

    const textContent = `Bonjour,

Merci pour votre paiement ! Votre réservation est confirmée.

Récapitulatif :
- Prestation : ${bookingDetails.serviceName}
- Date et heure : ${formattedDate} ${employeeInfo}
- Acompte payé : ${bookingDetails.amountPaid.toFixed(2)}€

À très bientôt chez Twisted !

Cordialement,
L'équipe Twisted`;

    const htmlContent = `
      <p>Bonjour,</p>
      <p><strong>Merci pour votre paiement ! Votre réservation est confirmée.</strong></p>
      <p><strong>Récapitulatif :</strong></p>
      <ul>
        <li><strong>Prestation :</strong> ${bookingDetails.serviceName}</li>
        <li><strong>Date et heure :</strong> ${formattedDate} ${employeeInfo}</li>
        <li><strong>Acompte payé :</strong> ${bookingDetails.amountPaid.toFixed(2)}€</li>
      </ul>
      <p>À très bientôt chez Twisted !</p>
      <p>Cordialement,<br>L'équipe Twisted</p>
    `;

    if (this.apiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: this.senderName, email: this.senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent,
            textContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
        }

        logger.info(`Confirmation email sent to ${to}`);
      } catch (error: any) {
        logger.error('Failed to send confirmation email via Brevo API', { error: error.message });
        throw error;
      }
    } else {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    }
  }
}

export const emailService = new EmailService();
