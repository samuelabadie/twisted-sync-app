import 'dotenv/config';

/**
 * Script de test du flow de paiement
 * Simule un webhook Bookla et vérifie que :
 * 1. La session Stripe est créée
 * 2. L'email est envoyé (ou loggé si pas de clé Brevo)
 */

const WEBHOOK_URL = process.env.TEST_WEBHOOK_URL || 'http://localhost:3000/api/bookla-webhook';

// Simule un payload de webhook Bookla (booking.create)
const mockBookingPayload = {
  event: 'booking.create',
  data: {
    id: 'test-booking-' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    client: {
      firstName: 'Test',
      lastName: 'Client',
      email: process.argv[2] || 'test@example.com', // Email passé en argument ou par défaut
    },
    service: {
      id: 'test-service-id',
      name: 'Fulani Sally',
    },
    resource: {
      id: 'test-resource-id',
      name: 'Coiffeuse',
    },
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2h
    duration: 'PT2H',
    price: 15000, // 150€ en centimes
    currency: 'EUR',
  }
};

async function testPaymentFlow() {
  console.log('🧪 Test du flow de paiement\n');
  console.log('=' .repeat(50));
  
  // Vérifier les variables d'environnement
  console.log('\n📋 Vérification des variables d\'environnement:');
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'BOOKLA_API_KEY',
    'BOOKLA_COMPANY_ID',
  ];
  
  const optionalVars = [
    'BREVO_API_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  
  let allRequired = true;
  for (const v of requiredVars) {
    const exists = !!process.env[v];
    console.log(`  ${exists ? '✅' : '❌'} ${v}: ${exists ? 'OK' : 'MANQUANT'}`);
    if (!exists) allRequired = false;
  }
  
  for (const v of optionalVars) {
    const exists = !!process.env[v];
    console.log(`  ${exists ? '✅' : '⚠️'} ${v}: ${exists ? 'OK' : 'Non configuré (optionnel)'}`);
  }
  
  if (!allRequired) {
    console.log('\n❌ Variables requises manquantes. Arrêt du test.');
    process.exit(1);
  }
  
  // Simuler l'appel webhook
  console.log('\n📤 Envoi du webhook simulé à:', WEBHOOK_URL);
  console.log('   Payload:', JSON.stringify(mockBookingPayload.data, null, 2).split('\n').map(l => '   ' + l).join('\n'));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockBookingPayload.data),
    });
    
    const result = await response.json() as { 
      checkoutUrl?: string; 
      emailSent?: boolean; 
      bookingId?: string;
      error?: string;
    };
    
    console.log('\n📥 Réponse du webhook:');
    console.log('   Status:', response.status);
    console.log('   Body:', JSON.stringify(result, null, 2).split('\n').map(l => '   ' + l).join('\n'));
    
    if (response.ok && result.checkoutUrl) {
      console.log('\n✅ SUCCESS!');
      console.log('=' .repeat(50));
      console.log('\n🔗 Lien de paiement Stripe:');
      console.log(`   ${result.checkoutUrl}`);
      console.log('\n📧 Email envoyé:', result.emailSent ? 'Oui' : 'Non (vérifiez BREVO_API_KEY)');
      console.log('📝 Booking ID:', result.bookingId);
      
      console.log('\n👉 Prochaines étapes:');
      console.log('   1. Ouvre le lien ci-dessus dans un navigateur');
      console.log('   2. Utilise la carte de test: 4242 4242 4242 4242');
      console.log('   3. Date d\'expiration: n\'importe quelle date future');
      console.log('   4. CVC: n\'importe quels 3 chiffres');
      console.log('   5. Vérifie les logs du serveur pour voir le webhook Stripe');
    } else {
      console.log('\n❌ ÉCHEC');
      console.log('   Vérifiez les logs du serveur pour plus de détails.');
    }
    
  } catch (error: any) {
    console.log('\n❌ Erreur lors de l\'appel webhook:');
    console.log('   ', error.message);
    console.log('\n💡 Assurez-vous que le serveur local tourne (`npm run dev`)');
  }
}

// Instructions
console.log(`
╔════════════════════════════════════════════════════════════╗
║           TEST DU FLOW DE PAIEMENT TWISTED                 ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Usage: npx ts-node scripts/test-payment-flow.ts [email]   ║
║                                                            ║
║  Exemple:                                                  ║
║    npx ts-node scripts/test-payment-flow.ts ton@email.com  ║
║                                                            ║
║  Ce script simule un webhook Bookla et teste:              ║
║    1. Création de la session Stripe ✓                      ║
║    2. Envoi de l'email avec le lien ✓                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

testPaymentFlow();
