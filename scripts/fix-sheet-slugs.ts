import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

async function run() {
  console.log('🔧 Correction des slugs dans le Sheet\n');
  console.log('Règle: Webflow_Slug = slug généré depuis Service_Name\n');

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const creds = JSON.parse(process.env.GOOGLE_CREDS!);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Read all data
  console.log('📊 Lecture du Sheet...');
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:Q',
  });

  const rows = response.data.values || [];
  console.log(`   → ${rows.length} lignes trouvées\n`);

  // Column indices (0-based):
  // B=1: Webflow_Slug, C=2: Service_Name

  const updates: { range: string; values: string[][] }[] = [];
  let modified = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // Sheet rows are 1-indexed + header
    
    const currentSlug = row[1]; // Webflow_Slug
    const serviceName = row[2]; // Service_Name

    if (!serviceName) continue; // Skip empty rows

    // Generate slug from service name
    const newSlug = toSlug(serviceName);

    // Only update if different
    if (currentSlug !== newSlug) {
      updates.push({
        range: `B${rowIndex}`,
        values: [[newSlug]]
      });

      console.log(`   Ligne ${rowIndex}: "${serviceName}"`);
      console.log(`              "${currentSlug || '(vide)'}" → "${newSlug}"`);
      modified++;
    }
  }

  if (updates.length === 0) {
    console.log('✅ Aucune modification nécessaire, tous les slugs sont corrects !');
    return;
  }

  console.log(`\n📝 Application de ${modified} modifications...`);

  // Batch update in chunks to avoid rate limits
  const chunkSize = 50;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: chunk,
      },
    });
    
    if (i + chunkSize < updates.length) {
      console.log(`   Progression: ${Math.min(i + chunkSize, updates.length)}/${updates.length}`);
      await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }
  }

  console.log(`\n✅ Terminé ! ${modified} slugs corrigés.`);
  console.log('\nMaintenant tu peux relancer la synchro Webflow :');
  console.log('   npx ts-node scripts/clean-sync-webflow.ts');
}

run().catch(console.error);

