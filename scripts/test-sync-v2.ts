import dotenv from 'dotenv';
dotenv.config();

import { GoogleSheetsService } from '../src/lib/google-sheets';
import { BooklaClient } from '../src/lib/bookla';
import { WebflowClient } from '../src/lib/webflow';

async function run() {
  console.log('🔄 Test de synchronisation (v2 - nouvelle logique)\n');

  const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
  const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!);
  const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!);
  const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

  // 1. Read Sheet
  console.log('📊 Lecture du Sheet...');
  const sheetServices = await sheets.getServices();
  console.log(`   → ${sheetServices.length} lignes\n`);

  // 2. Pre-fetch Webflow items (cached by bookla-id)
  console.log('📦 Chargement des items Webflow...');
  const webflowItems = await webflow.getAllItems(collectionId);
  console.log(`   → ${webflowItems.size} items (indexés par bookla-id)\n`);

  // 3. Get Bookla services
  console.log('🗓️  Chargement des services Bookla...');
  const booklaServices = await bookla.getServices();
  const booklaServiceIds = new Set(booklaServices.map((s: any) => s.id));
  console.log(`   → ${booklaServiceIds.size} services\n`);

  // 4. Analyze
  const report = {
    total: sheetServices.length,
    has_bookla_id: 0,
    has_webflow_id: 0,
    bookla_id_valid: 0,
    bookla_id_invalid: 0,
    webflow_id_valid: 0,
    webflow_id_invalid: 0,
    webflow_found_by_bookla: 0,
    needs_bookla_create: 0,
    needs_webflow_create: 0,
  };

  console.log('🔍 Analyse des données...\n');

  for (const service of sheetServices) {
    // Bookla
    if (service.bookla_service_id) {
      report.has_bookla_id++;
      if (booklaServiceIds.has(service.bookla_service_id)) {
        report.bookla_id_valid++;
      } else {
        report.bookla_id_invalid++;
        console.log(`   ⚠️  Bookla ID invalide: "${service.service_name}" (${service.bookla_service_id})`);
      }
    } else {
      report.needs_bookla_create++;
      console.log(`   🆕 Besoin création Bookla: "${service.service_name}"`);
    }

    // Webflow
    if (service.webflow_id) {
      report.has_webflow_id++;
      const item = await webflow.getItemById(collectionId, service.webflow_id);
      if (item) {
        report.webflow_id_valid++;
      } else {
        report.webflow_id_invalid++;
        console.log(`   ⚠️  Webflow ID invalide: "${service.service_name}" (${service.webflow_id})`);
      }
    } else {
      // Try to find by bookla-id
      if (service.bookla_service_id) {
        const found = webflowItems.get(service.bookla_service_id);
        if (found) {
          report.webflow_found_by_bookla++;
          console.log(`   🔗 Webflow trouvé par bookla-id: "${service.service_name}" → ${found.id}`);
        } else {
          report.needs_webflow_create++;
          console.log(`   🆕 Besoin création Webflow: "${service.service_name}"`);
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`   Total lignes Sheet:        ${report.total}`);
  console.log('');
  console.log('   BOOKLA:');
  console.log(`     Avec ID:                 ${report.has_bookla_id}`);
  console.log(`     IDs valides:             ${report.bookla_id_valid}`);
  console.log(`     IDs invalides:           ${report.bookla_id_invalid}`);
  console.log(`     À créer:                 ${report.needs_bookla_create}`);
  console.log('');
  console.log('   WEBFLOW:');
  console.log(`     Avec ID:                 ${report.has_webflow_id}`);
  console.log(`     IDs valides:             ${report.webflow_id_valid}`);
  console.log(`     IDs invalides:           ${report.webflow_id_invalid}`);
  console.log(`     Trouvés par bookla-id:   ${report.webflow_found_by_bookla}`);
  console.log(`     À créer:                 ${report.needs_webflow_create}`);
  console.log('');

  if (report.bookla_id_invalid === 0 && report.webflow_id_invalid === 0 && 
      report.needs_bookla_create === 0 && report.needs_webflow_create === 0 &&
      report.webflow_found_by_bookla === 0) {
    console.log('✅ Tout est synchronisé ! Rien à faire.');
  } else {
    console.log('⚠️  Des actions sont nécessaires. Lance la vraie synchro pour corriger.');
  }
}

run().catch(console.error);

