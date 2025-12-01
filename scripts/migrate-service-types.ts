import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const DRY_RUN = process.argv.includes('--dry-run');

// Collection IDs from environment
const SERVICE_TYPE_COLLECTION_ID = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!;
const SERVICES_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;
const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!;

const headers = {
  Authorization: `Bearer ${WEBFLOW_TOKEN}`,
  'Content-Type': 'application/json',
};

async function fetchAllItems(collectionId: string): Promise<any[]> {
  let allItems: any[] = [];
  let offset = 0;
  
  while (true) {
    const res = await axios.get(
      `https://api.webflow.com/v2/collections/${collectionId}/items?limit=100&offset=${offset}`,
      { headers }
    );
    const items = res.data.items || [];
    allItems = allItems.concat(items);
    if (items.length < 100) break;
    offset += 100;
  }
  
  return allItems;
}

async function main() {
  console.log('🚀 Ajout des colonnes Service_Type au CSV...\n');

  // 1. Fetch all service types to build a reference list
  console.log('📥 Récupération des types de service depuis Webflow...');
  const serviceTypes = await fetchAllItems(SERVICE_TYPE_COLLECTION_ID);
  
  console.log(`   Types disponibles:`);
  for (const type of serviceTypes) {
    console.log(`   - ${type.fieldData?.name} (ID: ${type.id})`);
  }

  // 2. Read CSV file
  const csvPath = path.join(__dirname, '..', 'twisted_database.csv');
  console.log('\n📊 Lecture du fichier CSV...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const header = lines[0];
  
  // Check if columns already exist
  const headerCols = header.split(',');
  if (headerCols.includes('Service_Type')) {
    console.log('✅ Les colonnes existent déjà !');
    return;
  }

  // Add new columns to header
  const newHeader = header + ',Service_Type,Service_Type_ID';
  const newLines: string[] = [newHeader];

  // Add empty columns to each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    newLines.push(line + ',,');
  }

  // Write back
  fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
  
  console.log('\n✅ Colonnes ajoutées au CSV !');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Copie le CSV dans Google Sheet');
  console.log('   2. Remplis la colonne "Service_Type" avec le nom du type');
  console.log('   3. Lance: npx ts-node scripts/sync-service-types.ts');
}

main().catch(console.error);
