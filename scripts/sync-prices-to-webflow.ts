/**
 * Script de synchronisation des prix Bookla → Webflow
 *
 * Usage:
 *   npx tsx scripts/sync-prices-to-webflow.ts
 *   npx tsx scripts/sync-prices-to-webflow.ts --dry-run  # Pour voir les changements sans les appliquer
 *
 * Requires:
 *   - .env or .env.local with BOOKLA_API_KEY, BOOKLA_COMPANY_ID, WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, WEBFLOW_COLLECTION_ID
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { BooklaClient } from '../src/lib/bookla';
import { WebflowClient } from '../src/lib/webflow';

interface PriceChange {
  serviceName: string;
  booklaId: string;
  webflowId: string;
  oldPrice: number;
  newPrice: number;
  oldDuration?: number;
  newDuration?: number;
}

async function syncPrices() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('🔄 Synchronisation des prix Bookla → Webflow');
  if (isDryRun) {
    console.log('📝 Mode DRY RUN - Aucune modification ne sera effectuée\n');
  } else {
    console.log('⚡ Mode LIVE - Les modifications seront appliquées\n');
  }

  // Validate environment
  const requiredVars = ['BOOKLA_API_KEY', 'BOOKLA_COMPANY_ID', 'WEBFLOW_API_TOKEN', 'WEBFLOW_SITE_ID', 'WEBFLOW_COLLECTION_ID'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ ${varName} is required in .env or .env.local`);
      process.exit(1);
    }
  }

  const bookla = new BooklaClient(
    process.env.BOOKLA_API_KEY!,
    process.env.BOOKLA_COMPANY_ID!
  );

  const webflow = new WebflowClient(
    process.env.WEBFLOW_API_TOKEN!,
    process.env.WEBFLOW_SITE_ID!
  );

  const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

  // 1. Fetch all services from Bookla
  console.log('📡 Récupération des services depuis Bookla...');
  const booklaServices = await bookla.getServices();
  console.log(`   Trouvé ${booklaServices.length} services sur Bookla\n`);

  // 2. Fetch all items from Webflow
  console.log('📡 Récupération des items depuis Webflow...');
  const webflowItems = await webflow.getAllItems(collectionId);
  console.log(`   Trouvé ${webflowItems.size} items sur Webflow\n`);

  // 3. Compare and find differences
  console.log('🔍 Comparaison des prix et durées (récupération des prix Bookla)...\n');

  const changes: PriceChange[] = [];
  const notFound: string[] = [];
  let processedCount = 0;

  for (const service of booklaServices) {
    processedCount++;
    process.stdout.write(`\r   Traitement ${processedCount}/${booklaServices.length}...`);

    const booklaId = service.id;
    const webflowItem = webflowItems.get(booklaId);

    if (!webflowItem) {
      notFound.push(`${service.name} (Bookla ID: ${booklaId})`);
      continue;
    }

    const webflowPrice = webflowItem.fieldData?.prix || 0;
    const webflowDuration = webflowItem.fieldData?.duree || 0;

    // Get price from Bookla price rules
    let booklaPrice = 0;
    try {
      const priceRules = await bookla.getPriceRules(service.id);
      const fixedRule = priceRules.find((r: any) => r.type === 'fixed');
      if (fixedRule?.price?.price) {
        // Price is in cents, convert to EUR
        booklaPrice = fixedRule.price.price / 100;
      }
    } catch (e) {
      // Ignore errors for price rules
    }

    const booklaDuration = service.duration || 0;

    const priceChanged = booklaPrice > 0 && Math.abs(webflowPrice - booklaPrice) > 0.01;
    const durationChanged = booklaDuration > 0 && webflowDuration !== booklaDuration;

    if (priceChanged || durationChanged) {
      changes.push({
        serviceName: service.name,
        booklaId: booklaId,
        webflowId: webflowItem.id,
        oldPrice: webflowPrice,
        newPrice: booklaPrice,
        oldDuration: durationChanged ? webflowDuration : undefined,
        newDuration: durationChanged ? booklaDuration : undefined,
      });
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }
  console.log('\n');

  // 4. Display results
  if (notFound.length > 0) {
    console.log(`⚠️  ${notFound.length} services Bookla non trouvés sur Webflow:`);
    notFound.slice(0, 10).forEach(s => console.log(`   - ${s}`));
    if (notFound.length > 10) {
      console.log(`   ... et ${notFound.length - 10} autres`);
    }
    console.log('');
  }

  if (changes.length === 0) {
    console.log('✅ Tous les prix sont déjà synchronisés !');
    return;
  }

  console.log(`📊 ${changes.length} services à mettre à jour:\n`);
  console.log('┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ Service                           │ Prix Webflow → Bookla │ Durée  │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');

  for (const change of changes) {
    const name = change.serviceName.substring(0, 35).padEnd(35);
    const priceStr = `${change.oldPrice}€ → ${change.newPrice}€`.padEnd(20);
    const durationStr = change.oldDuration !== undefined
      ? `${change.oldDuration} → ${change.newDuration}min`
      : '-';
    console.log(`│ ${name} │ ${priceStr} │ ${durationStr.padEnd(6)} │`);
  }
  console.log('└─────────────────────────────────────────────────────────────────────┘\n');

  // 5. Apply changes if not dry run
  if (isDryRun) {
    console.log('📝 Mode DRY RUN - Aucune modification effectuée');
    console.log('   Relancez sans --dry-run pour appliquer les changements');
    return;
  }

  console.log('⚡ Application des modifications...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const change of changes) {
    try {
      const updateData: any = {
        prix: change.newPrice,
      };

      if (change.newDuration !== undefined) {
        updateData.duree = change.newDuration;
      }

      await webflow.updateItem(collectionId, change.webflowId, updateData);
      successCount++;
      process.stdout.write(`\r   ✅ ${successCount}/${changes.length} mis à jour`);

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (error: any) {
      errorCount++;
      console.error(`\n   ❌ Erreur pour "${change.serviceName}": ${error.message}`);
    }
  }

  console.log('\n');
  console.log(`✅ Synchronisation terminée !`);
  console.log(`   Succès: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   Erreurs: ${errorCount}`);
  }
}

syncPrices().catch((error) => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
