import 'dotenv/config'
import axios from 'axios'

const BOOKLA_API_KEY = process.env.BOOKLA_API_KEY!
const BOOKLA_COMPANY_ID = process.env.BOOKLA_COMPANY_ID!
const BASE_URL = `https://eu.bookla.com/api/v1/companies/${BOOKLA_COMPANY_ID}`

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': BOOKLA_API_KEY,
    'Content-Type': 'application/json'
  }
})

interface BooklaService {
  id: string
  name: string
  type: string
  settings?: {
    bookingPolicy?: string
    duration?: string
    currency?: string
  }
}

async function listServices(): Promise<BooklaService[]> {
  const response = await api.get('/services')
  return response.data
}

async function getService(serviceId: string): Promise<BooklaService> {
  const response = await api.get(`/services/${serviceId}`)
  return response.data
}

async function updateBookingPolicy(serviceId: string, policy: 'instant' | 'confirmation' | 'prepayment' | 'deposit'): Promise<void> {
  await api.patch(`/services/${serviceId}/settings`, {
    bookingPolicy: policy
  })
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         TEST BOOKING POLICY - BOOKLA                       ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log('║                                                            ║')
  console.log('║  Commandes:                                                ║')
  console.log('║    list              - Liste tous les services             ║')
  console.log('║    get <id>          - Détails d\'un service                ║')
  console.log('║    set <id> <policy> - Change la politique                 ║')
  console.log('║                                                            ║')
  console.log('║  Policies: instant, confirmation, prepayment, deposit      ║')
  console.log('║                                                            ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  if (!BOOKLA_API_KEY || !BOOKLA_COMPANY_ID) {
    console.error('❌ BOOKLA_API_KEY et BOOKLA_COMPANY_ID requis dans .env')
    process.exit(1)
  }

  try {
    if (command === 'list') {
      console.log('📋 Liste des services Bookla:\n')
      const services = await listServices()
      
      // Group by policy
      const byPolicy: Record<string, BooklaService[]> = {}
      for (const svc of services) {
        const policy = svc.settings?.bookingPolicy || 'unknown'
        if (!byPolicy[policy]) byPolicy[policy] = []
        byPolicy[policy].push(svc)
      }

      for (const [policy, svcs] of Object.entries(byPolicy)) {
        console.log(`\n🏷️  Policy: ${policy.toUpperCase()} (${svcs.length} services)`)
        console.log('─'.repeat(60))
        for (const svc of svcs.slice(0, 10)) { // Show first 10
          console.log(`  ${svc.id} | ${svc.name}`)
        }
        if (svcs.length > 10) {
          console.log(`  ... et ${svcs.length - 10} autres`)
        }
      }

      console.log('\n📊 Résumé:')
      for (const [policy, svcs] of Object.entries(byPolicy)) {
        console.log(`  - ${policy}: ${svcs.length} services`)
      }

    } else if (command === 'get') {
      const serviceId = args[1]
      if (!serviceId) {
        console.error('❌ Usage: npx ts-node scripts/test-booking-policy.ts get <service_id>')
        process.exit(1)
      }

      console.log(`🔍 Détails du service ${serviceId}:\n`)
      const service = await getService(serviceId)
      console.log(JSON.stringify(service, null, 2))

    } else if (command === 'set') {
      const serviceId = args[1]
      const policy = args[2] as 'instant' | 'confirmation' | 'prepayment' | 'deposit'
      
      if (!serviceId || !policy) {
        console.error('❌ Usage: npx ts-node scripts/test-booking-policy.ts set <service_id> <policy>')
        console.error('   Policies: instant, confirmation, prepayment, deposit')
        process.exit(1)
      }

      if (!['instant', 'confirmation', 'prepayment', 'deposit'].includes(policy)) {
        console.error('❌ Policy invalide. Utilisez: instant, confirmation, prepayment, deposit')
        process.exit(1)
      }

      // Get current state
      console.log(`🔍 Service actuel:`)
      const before = await getService(serviceId)
      console.log(`   Nom: ${before.name}`)
      console.log(`   Policy actuelle: ${before.settings?.bookingPolicy || 'non définie'}`)

      // Update
      console.log(`\n⚙️  Mise à jour vers "${policy}"...`)
      await updateBookingPolicy(serviceId, policy)

      // Verify
      const after = await getService(serviceId)
      console.log(`\n✅ Mise à jour réussie!`)
      console.log(`   Nouvelle policy: ${after.settings?.bookingPolicy}`)

      if (policy === 'confirmation') {
        console.log('\n📝 Prochaines étapes:')
        console.log('   1. Fais une réservation test sur ce service')
        console.log('   2. Vérifie que le booking est en "pending" sur Bookla')
        console.log('   3. Vérifie que tu reçois l\'email avec le lien Stripe')
        console.log('   4. Paye → le booking doit passer en "confirmed"')
        console.log('   5. OU attends 15 min → le booking doit être annulé')
      }

    } else {
      console.log('💡 Exemple:')
      console.log('   npx ts-node scripts/test-booking-policy.ts list')
      console.log('   npx ts-node scripts/test-booking-policy.ts get <service_id>')
      console.log('   npx ts-node scripts/test-booking-policy.ts set <service_id> confirmation')
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.response?.data || error.message)
    process.exit(1)
  }
}

main()
