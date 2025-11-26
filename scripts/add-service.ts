import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import { BooklaClient } from '../src/lib/bookla';
import { WebflowClient } from '../src/lib/webflow';

// Configuration des options par défaut
const DEFAULT_OPTIONS = [
  { slug: 'coupe-des-pointes', name: 'Coupe des pointes', extraPrice: 10, extraDuration: 20 },
  { slug: 'shampoing-dmlant', name: 'Shampoing démêlant', extraPrice: 10, extraDuration: 20 },
  { slug: 'shampoing-et-soin', name: 'Shampoing et soin', extraPrice: 20, extraDuration: 40 },
];

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const serviceName = process.argv[2];
  const basePrice = parseFloat(process.argv[3] || '100');
  const baseDuration = parseInt(process.argv[4] || '120');

  if (!serviceName) {
    console.log('Usage: npx ts-node scripts/add-service.ts "Nom du service" [prix] [durée]');
    console.log('Exemple: npx ts-node scripts/add-service.ts "Mega Test" 150 180');
    process.exit(1);
  }

  console.log(`\n🆕 Création du service "${serviceName}"\n`);
  console.log(`   Prix de base: ${basePrice}€`);
  console.log(`   Durée de base: ${baseDuration} min`);
  console.log(`   Options: ${DEFAULT_OPTIONS.map(o => o.name).join(', ')}\n`);

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const creds = JSON.parse(process.env.GOOGLE_CREDS!);
  const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });
  const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!);
  const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!);

  const baseSlug = toSlug(serviceName);

  // Check if service already exists in Sheet
  console.log('🔍 Vérification si le service existe déjà...');
  const sheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:Q',
  });
  const rows = sheetData.data.values || [];
  
  // Check by service name (column C = index 2) or slug (column B = index 1)
  const existingRow = rows.find((row: any[]) => {
    const rowName = row[2]?.toLowerCase();
    const rowSlug = row[1]?.toLowerCase();
    return rowName === serviceName.toLowerCase() || rowSlug === baseSlug;
  });

  if (existingRow) {
    console.log(`\n❌ Le service "${serviceName}" existe déjà dans le Sheet !`);
    console.log(`   Nom: ${existingRow[2]}`);
    console.log(`   Slug: ${existingRow[1]}`);
    console.log(`   Bookla ID: ${existingRow[3] || '(aucun)'}`);
    console.log(`   Webflow ID: ${existingRow[0] || '(aucun)'}`);
    console.log('\n   Utilisez un autre nom ou supprimez d\'abord le service existant.');
    process.exit(1);
  }

  console.log('   ✅ Le service n\'existe pas, on peut le créer.\n');
  const results: any[] = [];
  let parentWebflowId: string = '';
  let parentBooklaId: string = '';

  // 1. Create parent service
  console.log('📝 Création du service parent...');
  
  try {
    // Create in Bookla
    parentBooklaId = await bookla.createService({
      title: serviceName,
      duration: baseDuration,
      price: basePrice,
    });
    console.log(`   ✅ Bookla: ${parentBooklaId}`);

    // Create in Webflow (parent has no service-parent reference)
    parentWebflowId = await webflow.createItem(collectionId, {
      name: serviceName,
      slug: `svc-${baseSlug}`,
      prix: basePrice,
      duree: baseDuration,
      'bookla-id': parentBooklaId,
      'is-visible': true,
    });
    console.log(`   ✅ Webflow: ${parentWebflowId}`);

    results.push({
      name: serviceName,
      slug: baseSlug,
      price: basePrice,
      duration: baseDuration,
      optionSlug: '',
      optionPrice: '',
      optionDuration: '',
      booklaId: parentBooklaId,
      webflowId: parentWebflowId,
    });

  } catch (err: any) {
    console.error(`   ❌ Erreur parent: ${err.message}`);
    process.exit(1);
  }

  // 2. Create option services (with reference to parent)
  for (const option of DEFAULT_OPTIONS) {
    const optionName = `${serviceName} + ${option.name}`;
    const optionPrice = basePrice + option.extraPrice;
    const optionDuration = baseDuration + option.extraDuration;
    const optionFullSlug = `${baseSlug}-${option.slug}`;

    console.log(`\n📝 Création de l'option "${option.name}"...`);

    try {
      // Create in Bookla
      const booklaId = await bookla.createService({
        title: optionName,
        duration: optionDuration,
        price: optionPrice,
      });
      console.log(`   ✅ Bookla: ${booklaId}`);

      // Create in Webflow with reference to parent
      const webflowId = await webflow.createItem(collectionId, {
        name: optionName,
        slug: `svc-${optionFullSlug}`,
        prix: optionPrice,
        duree: optionDuration,
        'bookla-id': booklaId,
        'is-visible': true,
        'service-parent': parentWebflowId, // Reference to parent!
      });
      console.log(`   ✅ Webflow: ${webflowId} (parent: ${parentWebflowId})`);

      results.push({
        name: optionName,
        slug: optionFullSlug,
        price: basePrice,
        duration: baseDuration,
        optionSlug: option.slug,
        optionPrice: option.extraPrice,
        optionDuration: option.extraDuration,
        booklaId,
        webflowId,
      });

    } catch (err: any) {
      console.error(`   ❌ Erreur option ${option.name}: ${err.message}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  // 3. Add all rows to Sheet
  console.log('\n📊 Ajout des lignes dans le Sheet...');

  const newRows = results.map(r => [
    r.webflowId,           // A: Webflow_ID
    r.slug,                // B: Webflow_Slug
    r.name,                // C: Service_Name
    r.booklaId,            // D: Bookla_ServiceID
    r.duration,            // E: Duration_Minutes
    r.price,               // F: Price_EUR
    '',                    // G: Category_Slug
    '',                    // H: Bookla_CategoryID
    '',                    // I: Resource_Slug
    '',                    // J: Bookla_ResourceID
    '1',                   // K: Capacity_Spots
    'TRUE',                // L: Visible
    r.optionSlug,          // M: Option_Extra_Slug
    r.optionPrice || '',   // N: Option_Extra_Price
    r.optionDuration || '',// O: Option_Extra_Duration
    new Date().toISOString(), // P: Bookla_UpdatedAt
    '',                    // Q: Notes_Internal
  ]);

  await sheetsApi.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'A:Q',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: newRows,
    },
  });

  console.log(`   ✅ ${newRows.length} lignes ajoutées\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('✅ SERVICE CRÉÉ AVEC SUCCÈS');
  console.log('='.repeat(60));
  console.log(`\n   Parent: ${serviceName}`);
  console.log(`   Options: ${DEFAULT_OPTIONS.length}`);
  console.log(`   Total: ${results.length} services créés\n`);
  console.log('   → Bookla: ✅');
  console.log('   → Webflow: ✅');
  console.log('   → Sheet: ✅\n');
}

run().catch(console.error);

