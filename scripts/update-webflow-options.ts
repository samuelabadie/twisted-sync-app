import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const DRY_RUN = process.argv.includes('--dry-run');

// Mapping des slugs d'options vers les valeurs Webflow
const OPTION_MAPPING: Record<string, string> = {
  'coupe-des-pointes': 'Coupe des pointes (+10€)',
  'shampoing-dmlant': 'Shampoing démêlant (+20€)',
  'shampoing-et-soin': 'Shampoing et soin (+35€)',
};

async function main() {
  console.log('🚀 Starting Webflow options update...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE\n' : '🔴 LIVE MODE\n');

  const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!;
  const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;

  const headers = {
    Authorization: `Bearer ${WEBFLOW_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // 1. Fetch ALL items from Webflow collection
  console.log('📥 Fetching all items from Webflow...');
  let allItems: any[] = [];
  let offset = 0;
  
  while (true) {
    const res = await axios.get(
      `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items?limit=100&offset=${offset}`,
      { headers }
    );
    const items = res.data.items || [];
    allItems = allItems.concat(items);
    console.log(`   Fetched ${allItems.length} items...`);
    if (items.length < 100) break;
    offset += 100;
  }

  console.log(`✅ Total: ${allItems.length} items in Webflow\n`);

  // 2. Read CSV to get option mappings (by bookla-id)
  const csvPath = path.join(__dirname, '..', 'twisted_database.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1);

  // Build a map: bookla_service_id -> option_extra_slug
  const optionByBooklaId: Record<string, string> = {};
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    const booklaId = cols[3]; // Bookla_ServiceID
    const optionSlug = cols[12]; // Option_Extra_Slug
    if (booklaId && optionSlug) {
      optionByBooklaId[booklaId] = optionSlug;
    }
  }

  // 3. Update Webflow items that have a matching option
  let updated = 0, skipped = 0, errors = 0;

  for (const item of allItems) {
    const booklaId = item.fieldData?.['bookla-id'];
    const itemName = item.fieldData?.name || item.fieldData?.slug || item.id;
    
    if (!booklaId) {
      skipped++;
      continue;
    }

    const optionSlug = optionByBooklaId[booklaId];
    if (!optionSlug) {
      skipped++;
      continue;
    }

    const optionValue = OPTION_MAPPING[optionSlug];
    if (!optionValue) {
      console.log(`⚠️  Unknown option slug: ${optionSlug} for ${itemName}`);
      skipped++;
      continue;
    }

    // Check if already has this value
    if (item.fieldData?.option === optionValue) {
      console.log(`⏭️  "${itemName}" already has correct option`);
      skipped++;
      continue;
    }

    console.log(`📝 "${itemName}" → "${optionValue}"`);

    if (!DRY_RUN) {
      try {
        await axios.patch(
          `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${item.id}/live`,
          { fieldData: { option: optionValue } },
          { headers }
        );
        updated++;
        await new Promise(r => setTimeout(r, 250)); // Rate limit
      } catch (e: any) {
        console.error(`❌ Error: ${e.response?.data?.message || e.message}`);
        errors++;
      }
    } else {
      updated++;
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log(`✅ ${DRY_RUN ? 'Would update' : 'Updated'}: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
}

main().catch(console.error);

