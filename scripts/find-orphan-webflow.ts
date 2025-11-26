import dotenv from 'dotenv';
dotenv.config();

import { GoogleSheetsService } from '../src/lib/google-sheets';
import axios from 'axios';

async function run() {
  console.log('🔍 Recherche des items Webflow orphelins\n');

  const token = process.env.WEBFLOW_API_TOKEN!;
  const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

  // 1. Get all Sheet bookla IDs
  console.log('📊 Lecture du Sheet...');
  const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
  const sheetServices = await sheets.getServices();
  
  const sheetBooklaIds = new Set(
    sheetServices.map(s => s.bookla_service_id).filter(Boolean)
  );
  const sheetWebflowIds = new Set(
    sheetServices.map(s => s.webflow_id).filter(Boolean)
  );
  
  console.log(`   → ${sheetServices.length} lignes`);
  console.log(`   → ${sheetBooklaIds.size} Bookla IDs`);
  console.log(`   → ${sheetWebflowIds.size} Webflow IDs\n`);

  // 2. Get all Webflow items
  console.log('📦 Récupération des items Webflow...');
  const api = axios.create({
    baseURL: 'https://api.webflow.com/v2',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  let allItems: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await api.get(`/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);
    const items = response.data.items || [];
    allItems = allItems.concat(items);
    if (items.length < limit) break;
    offset += limit;
  }

  console.log(`   → ${allItems.length} items\n`);

  // 3. Find orphans
  const orphansByBooklaId: any[] = [];
  const orphansByWebflowId: any[] = [];

  for (const item of allItems) {
    const booklaId = item.fieldData?.['bookla-id'];
    const webflowId = item.id;
    const name = item.fieldData?.name || '(sans nom)';
    const slug = item.fieldData?.slug || '(sans slug)';

    // Check if this webflow ID is in the sheet
    if (!sheetWebflowIds.has(webflowId)) {
      orphansByWebflowId.push({ id: webflowId, name, slug, booklaId });
    }

    // Check if bookla-id matches any in sheet
    if (booklaId && !sheetBooklaIds.has(booklaId)) {
      orphansByBooklaId.push({ id: webflowId, name, slug, booklaId });
    }
  }

  // 4. Report
  console.log('='.repeat(60));
  console.log('📊 RÉSULTAT');
  console.log('='.repeat(60));

  if (orphansByWebflowId.length === 0) {
    console.log('\n✅ Aucun item Webflow orphelin (tous ont un ID dans le Sheet)');
  } else {
    console.log(`\n⚠️  ${orphansByWebflowId.length} items Webflow sans correspondance dans le Sheet:\n`);
    orphansByWebflowId.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name}`);
      console.log(`      Slug: ${item.slug}`);
      console.log(`      Webflow ID: ${item.id}`);
      console.log(`      Bookla ID: ${item.booklaId || '(aucun)'}`);
      console.log('');
    });
  }

  if (orphansByBooklaId.length > 0) {
    console.log(`\n⚠️  ${orphansByBooklaId.length} items Webflow avec un Bookla ID inconnu du Sheet:\n`);
    orphansByBooklaId.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name}`);
      console.log(`      Bookla ID: ${item.booklaId}`);
      console.log('');
    });
  }

  console.log('\n💡 Pour supprimer les orphelins, va dans Webflow et supprime-les manuellement,');
  console.log('   ou crée un script de nettoyage si tu veux automatiser.');
}

run().catch(console.error);

