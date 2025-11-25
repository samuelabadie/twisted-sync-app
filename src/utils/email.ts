import { logger } from './logger';

// Use require for sib-api-v3-sdk as it doesn't have proper TS types
const SibApiV3Sdk = require('sib-api-v3-sdk');

export class EmailService {
  private apiInstance: any = null;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@twisted.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Twisted Coiffure';

    if (apiKey) {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKeyAuth = defaultClient.authentications['api-key'];
      apiKeyAuth.apiKey = apiKey;
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    } else {
      logger.warn('Email service not configured (missing BREVO_API_KEY). Emails will be logged only.');
    }
  }

  async sendPaymentLink(to: string, checkoutUrl: string, bookingId: string) {
    const subject = `Paiement de votre acompte - Réservation ${bookingId}`;
    const textContent = `Bonjour,\n\nMerci pour votre réservation.\n\nPour la confirmer, veuillez régler l'acompte de 30% via ce lien sécurisé :\n${checkoutUrl}\n\nCe lien est valable 15 minutes.\n\nCordialement,\nL'équipe Twisted`;
    const htmlContent = `
      <p>Bonjour,</p>
      <p>Merci pour votre réservation.</p>
      <p>Pour la confirmer, veuillez régler l'acompte de 30% via ce lien sécurisé :</p>
      <p><a href="${checkoutUrl}">${checkoutUrl}</a></p>
      <p>Ce lien est valable 15 minutes.</p>
      <p>Cordialement,<br>L'équipe Twisted</p>
    `;

    if (this.apiInstance) {
      try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.textContent = textContent;
        sendSmtpEmail.sender = { name: this.senderName, email: this.senderEmail };
        sendSmtpEmail.to = [{ email: to }];

        await this.apiInstance.sendTransacEmail(sendSmtpEmail);
        logger.info(`Email sent to ${to}`);
      } catch (error: any) {
        logger.error('Failed to send email via Brevo API', { error: error.message });
        throw error;
      }
    } else {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Link: ${checkoutUrl}`);
    }
  }
}

export const emailService = new EmailService();
