import dotenv from 'dotenv';
// Load env vars BEFORE importing any service that uses them
dotenv.config();

import { emailService } from '../src/utils/email';

async function run() {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    console.error('Usage: npx ts-node scripts/test-email.ts <votre-email>');
    process.exit(1);
  }

  console.log(`📧 Tentative d'envoi d'un email de test à : ${targetEmail}`);
  console.log(`Configuration : API Key=${process.env.BREVO_API_KEY?.substring(0, 15)}...`);
  console.log(`Sender : ${process.env.BREVO_SENDER_NAME} <${process.env.BREVO_SENDER_EMAIL}>`);

  try {
    await emailService.sendPaymentLink(
      targetEmail, 
      'https://checkout.stripe.com/test-link', 
      'TEST-1234'
    );
    console.log('✅ Email envoyé avec succès ! Vérifiez votre boîte de réception (et les spams).');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi :', error.message);
    if (error.response?.body) {
      console.error('Détails:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

run();
