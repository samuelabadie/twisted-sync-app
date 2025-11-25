import dotenv from 'dotenv';
dotenv.config();

import { GoogleSheetsService } from '../src/lib/google-sheets';
import { BooklaClient } from '../src/lib/bookla';

async function run() {
  console.log('🔍 Recherche des services Bookla manquants dans le Sheet\n');

  // 1. Get all Bookla services
  console.log('📦 Récupération des services Bookla...');
  const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!);
  const booklaServices = await bookla.getServices();
  console.log(`   → ${booklaServices.length} services dans Bookla\n`);

  // 2. Get Sheet data
  console.log('📊 Lecture du Google Sheet...');
  const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
  const sheetServices = await sheets.getServices();
  console.log(`   → ${sheetServices.length} lignes dans le Sheet\n`);

  // 3. Find Bookla IDs in Sheet
  const sheetBooklaIds = new Set(
    sheetServices
      .map(s => s.bookla_service_id)
      .filter(Boolean)
  );
  console.log(`   → ${sheetBooklaIds.size} services avec Bookla ID dans le Sheet\n`);

  // 4. Find missing
  const missingFromSheet = booklaServices.filter((bs: any) => !sheetBooklaIds.has(bs.id));

  console.log('='.repeat(60));
  console.log(`\n📋 Services Bookla ABSENTS du Sheet: ${missingFromSheet.length}\n`);
  
  if (missingFromSheet.length === 0) {
    console.log('✅ Tous les services Bookla sont dans le Sheet !');
  } else {
    console.log('Ces services existent dans Bookla mais pas dans le Sheet:\n');
    missingFromSheet.forEach((s: any, i: number) => {
      console.log(`   ${i + 1}. ${s.name || s.title || '(sans nom)'}`);
      console.log(`      ID: ${s.id}`);
      console.log(`      Prix: ${s.price || s.settings?.price || 'N/A'}€`);
      console.log(`      Durée: ${s.duration || s.settings?.duration || 'N/A'}`);
      console.log('');
    });
  }

  // Also check the reverse: Sheet services not in Bookla
  const booklaIds = new Set(booklaServices.map((s: any) => s.id));
  const missingFromBookla = sheetServices.filter(s => s.bookla_service_id && !booklaIds.has(s.bookla_service_id));

  if (missingFromBookla.length > 0) {
    console.log('='.repeat(60));
    console.log(`\n⚠️  Services dans le Sheet avec un Bookla ID INVALIDE: ${missingFromBookla.length}\n`);
    missingFromBookla.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.service_name} (ligne ${s.rowIndex})`);
      console.log(`      Bookla ID: ${s.bookla_service_id} (n'existe plus)`);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`   Bookla:  ${booklaServices.length} services`);
  console.log(`   Sheet:   ${sheetBooklaIds.size} avec Bookla ID`);
  console.log(`   Manquants dans Sheet: ${missingFromSheet.length}`);
  console.log(`   IDs invalides:        ${missingFromBookla.length}`);
}

run().catch(console.error);

