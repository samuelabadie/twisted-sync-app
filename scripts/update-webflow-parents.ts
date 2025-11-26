import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import { WebflowClient } from '../src/lib/webflow';
import axios from 'axios';

interface ServiceRow {
  webflowId: string;
  slug: string;
  name: string;
  booklaId: string;
  optionSlug: string;
  rowIndex: number;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('\n🔗 Mise à jour des service-parent sur Webflow\n');
  if (dryRun) {
    console.log('   ⚠️  Mode DRY-RUN: aucune modification ne sera effectuée\n');
  }

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const creds = JSON.parse(process.env.GOOGLE_CREDS!);
  const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });
  const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!);

  // 1. Read Sheet
  console.log('📊 Lecture du Sheet...');
  const sheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:Q',
  });
  const rows = sheetData.data.values || [];
  console.log(`   → ${rows.length} lignes\n`);

  // Parse services
  const services: ServiceRow[] = rows.map((row: any[], idx: number) => ({
    webflowId: row[0] || '',
    slug: row[1] || '',
    name: row[2] || '',
    booklaId: row[3] || '',
    optionSlug: row[12] || '', // Column M: Option_Extra_Slug
    rowIndex: idx + 2,
  }));

  // Separate parents and options
  const parents = services.filter(s => !s.optionSlug && s.webflowId);
  const options = services.filter(s => s.optionSlug && s.webflowId);

  console.log(`   Parents: ${parents.length}`);
  console.log(`   Options: ${options.length}\n`);

  // Create parent lookup by base name
  // Parent name: "Boho braids"
  // Option name: "Boho braids + Coupe des pointes"
  const parentByName: Map<string, ServiceRow> = new Map();
  for (const p of parents) {
    parentByName.set(p.name.toLowerCase(), p);
  }

  // 2. Fetch current Webflow items to check existing service-parent
  console.log('📦 Chargement des items Webflow...');
  const webflowItems = await webflow.getAllItems(collectionId);
  console.log(`   → ${webflowItems.size} items\n`);

  // 3. Process options
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let alreadySet = 0;

  console.log('🔄 Mise à jour des options...\n');

  for (const option of options) {
    // Extract parent name from option name
    // "Boho braids + Coupe des pointes" -> "Boho braids"
    const plusIndex = option.name.lastIndexOf(' + ');
    if (plusIndex === -1) {
      console.log(`   ⚠️  ${option.name}: format invalide (pas de " + ")`);
      skipped++;
      continue;
    }

    const parentName = option.name.substring(0, plusIndex);
    const parent = parentByName.get(parentName.toLowerCase());

    if (!parent) {
      console.log(`   ⚠️  ${option.name}: parent "${parentName}" non trouvé`);
      skipped++;
      continue;
    }

    // Check if already set in Webflow
    const webflowItem = webflowItems.get(option.booklaId);
    if (webflowItem) {
      const currentParent = webflowItem.fieldData?.['service-parent'];
      if (currentParent === parent.webflowId) {
        // Already correctly set
        alreadySet++;
        continue;
      }
    }

    // Update Webflow
    console.log(`   📝 ${option.name}`);
    console.log(`      → Parent: ${parent.name} (${parent.webflowId})`);

    if (!dryRun) {
      try {
        await webflow.updateItem(collectionId, option.webflowId, {
          'service-parent': parent.webflowId,
        });
        console.log(`      ✅ Mis à jour`);
        updated++;
      } catch (err: any) {
        console.log(`      ❌ Erreur: ${err.response?.data?.message || err.message}`);
        errors++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    } else {
      console.log(`      🔍 [DRY-RUN] Serait mis à jour`);
      updated++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`   Options traitées:    ${options.length}`);
  console.log(`   Déjà configurées:    ${alreadySet}`);
  console.log(`   Mises à jour:        ${updated}`);
  console.log(`   Ignorées:            ${skipped}`);
  console.log(`   Erreurs:             ${errors}`);
  console.log('');

  if (dryRun && updated > 0) {
    console.log('💡 Pour appliquer les changements, relancez sans --dry-run\n');
  }
}

run().catch(console.error);

