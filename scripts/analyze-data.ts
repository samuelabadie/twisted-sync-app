import dotenv from 'dotenv';
dotenv.config();

import { GoogleSheetsService } from '../src/lib/google-sheets';
import axios from 'axios';

async function run() {
  console.log('🔍 Analyse des données...\n');

  // 1. Analyze Google Sheet
  console.log('📊 GOOGLE SHEET');
  console.log('─'.repeat(50));
  
  const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
  const services = await sheets.getServices();
  
  const parents = services.filter(s => !s.option_extra_slug);
  const options = services.filter(s => s.option_extra_slug);
  const withBooklaId = services.filter(s => s.bookla_service_id);
  const withWebflowId = services.filter(s => s.webflow_id);

  console.log(`   Total lignes:        ${services.length}`);
  console.log(`   Parents:             ${parents.length}`);
  console.log(`   Options:             ${options.length}`);
  console.log(`   Avec Bookla ID:      ${withBooklaId.length}`);
  console.log(`   Avec Webflow ID:     ${withWebflowId.length}`);

  // Show unique webflow_slugs
  const uniqueSlugs = new Set(services.map(s => s.webflow_slug).filter(Boolean));
  console.log(`   Slugs uniques:       ${uniqueSlugs.size}`);

  console.log('\n📋 Détail par groupe (slug):');
  const grouped = new Map<string, typeof services>();
  for (const s of services) {
    if (!s.webflow_slug) continue;
    if (!grouped.has(s.webflow_slug)) grouped.set(s.webflow_slug, []);
    grouped.get(s.webflow_slug)!.push(s);
  }
  
  for (const [slug, items] of grouped) {
    const parent = items.find(i => !i.option_extra_slug);
    const opts = items.filter(i => i.option_extra_slug);
    console.log(`   • ${slug}: 1 parent + ${opts.length} options`);
  }

  // 2. Analyze Webflow
  console.log('\n\n📦 WEBFLOW');
  console.log('─'.repeat(50));

  const token = process.env.WEBFLOW_API_TOKEN;
  const collectionId = process.env.WEBFLOW_COLLECTION_ID;

  let allItems: any[] = [];
  let offset = 0;
  const limit = 100;

  // Fetch all items (with pagination)
  while (true) {
    const response = await axios.get(
      `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const items = response.data.items || [];
    allItems = allItems.concat(items);
    if (items.length < limit) break;
    offset += limit;
  }

  console.log(`   Total items:         ${allItems.length}`);

  // Check for duplicates by slug
  const slugCounts = new Map<string, number>();
  for (const item of allItems) {
    const slug = item.fieldData?.slug;
    slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
  }

  const duplicates = [...slugCounts.entries()].filter(([_, count]) => count > 1);
  console.log(`   Slugs en double:     ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n   ⚠️  Doublons détectés:');
    duplicates.slice(0, 10).forEach(([slug, count]) => {
      console.log(`      - "${slug}" apparaît ${count} fois`);
    });
    if (duplicates.length > 10) {
      console.log(`      ... et ${duplicates.length - 10} autres`);
    }
  }

  // Items without bookla-id
  const withoutBooklaId = allItems.filter(i => !i.fieldData?.['bookla-id']);
  console.log(`   Sans bookla-id:      ${withoutBooklaId.length}`);

  console.log('\n\n💡 RECOMMANDATION');
  console.log('─'.repeat(50));
  
  if (duplicates.length > 0 || allItems.length > services.length) {
    console.log('   Il y a des incohérences. Options:');
    console.log('   1. Supprimer TOUS les items Webflow et resynchroniser');
    console.log('   2. Nettoyer manuellement les doublons');
    console.log('\n   Pour supprimer tous les items, lance:');
    console.log('   npx ts-node scripts/cleanup-webflow.ts');
  } else {
    console.log('   ✅ Les données semblent cohérentes !');
  }
}

run().catch(console.error);

