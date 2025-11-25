import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import axios from 'axios';

const token = process.env.WEBFLOW_API_TOKEN!;
const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

async function getAllWebflowItems(): Promise<Set<string>> {
  const api = axios.create({
    baseURL: 'https://api.webflow.com/v2',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  let allIds = new Set<string>();
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await api.get(`/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);
    const items = response.data.items || [];
    items.forEach((item: any) => allIds.add(item.id));
    if (items.length < limit) break;
    offset += limit;
  }
  return allIds;
}

async function run() {
  console.log('🧹 Nettoyage des Webflow IDs orphelins dans le Sheet\n');

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const creds = JSON.parse(process.env.GOOGLE_CREDS!);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Get existing Webflow IDs
  console.log('📦 Récupération des items Webflow existants...');
  const existingWebflowIds = await getAllWebflowItems();
  console.log(`   → ${existingWebflowIds.size} items dans Webflow\n`);

  // 2. Read Sheet
  console.log('📊 Lecture du Sheet...');
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:Q',
  });

  const rows = response.data.values || [];
  console.log(`   → ${rows.length} lignes\n`);

  // Column A (index 0) = Webflow_ID
  const updates: { range: string; values: string[][] }[] = [];
  let cleared = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2;
    const webflowId = row[0]; // Column A = Webflow_ID

    if (webflowId && !existingWebflowIds.has(webflowId)) {
      // This webflow_id doesn't exist in Webflow anymore, clear it
      updates.push({
        range: `A${rowIndex}`,
        values: [['']]
      });
      console.log(`   Ligne ${rowIndex}: Webflow ID "${webflowId}" n'existe plus → vidé`);
      cleared++;
    }
  }

  if (updates.length === 0) {
    console.log('✅ Tous les Webflow IDs sont valides !');
    return;
  }

  console.log(`\n📝 Suppression de ${cleared} IDs orphelins...`);

  // Batch update
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates,
    },
  });

  console.log(`\n✅ Terminé ! ${cleared} Webflow IDs vidés.`);
  console.log('\nMaintenant relance la synchro :');
  console.log('   npx ts-node scripts/upload-missing-webflow.ts');
}

run().catch(console.error);

