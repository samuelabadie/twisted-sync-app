import 'dotenv/config';
import axios from 'axios';
import { google } from 'googleapis';

const DRY_RUN = process.argv.includes('--dry-run');

const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!;
const SERVICE_TYPE_COLLECTION_ID = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!;
const SERVICES_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;

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
  console.log('🔄 Sync des types depuis Webflow vers Google Sheet...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE\n' : '🔴 LIVE MODE\n');

  // 1. Fetch all services from Webflow
  console.log('📥 Récupération des services depuis Webflow...');
  const services = await fetchAllItems(SERVICES_COLLECTION_ID);
  console.log(`   Trouvé ${services.length} services`);

  // Build slug -> ID mapping
  const slugToWebflowId = new Map<string, string>();
  for (const svc of services) {
    const slug = svc.fieldData?.slug || '';
    slugToWebflowId.set(slug, svc.id);
    // Also map without svc- prefix
    if (slug.startsWith('svc-')) {
      slugToWebflowId.set(slug.replace('svc-', ''), svc.id);
    }
  }

  // 2. Fetch all service types from Webflow
  console.log('📥 Récupération des types de service...');
  const serviceTypes = await fetchAllItems(SERVICE_TYPE_COLLECTION_ID);
  console.log(`   Trouvé ${serviceTypes.length} types\n`);

  // Build webflowId -> type mapping
  const webflowIdToType = new Map<string, { name: string; id: string }>();
  
  for (const type of serviceTypes) {
    const typeName = type.fieldData?.name || '';
    const typeId = type.id;
    const linkedServiceIds: string[] = type.fieldData?.service || [];
    
    console.log(`   📂 ${typeName} - ${linkedServiceIds.length} services`);
    
    for (const serviceId of linkedServiceIds) {
      webflowIdToType.set(serviceId, { name: typeName, id: typeId });
    }
  }

  // 3. Connect to Google Sheet
  console.log('\n📊 Connexion à Google Sheet...');
  const creds = JSON.parse(process.env.GOOGLE_CREDS || process.env.GOOGLE_CREDENTIALS_JSON || '{}');
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });

  // 4. Read current Sheet data
  const sheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:S',
  });
  const rows = sheetData.data.values || [];
  console.log(`   Trouvé ${rows.length} lignes\n`);

  // 5. Find services that need type updates
  const updates: { row: number; typeName: string; typeId: string }[] = [];
  let alreadySet = 0;
  let noType = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const webflowId = row[0];        // Column A
    const slug = row[1];              // Column B
    const serviceName = row[2];       // Column C
    const optionSlug = row[12];       // Column M - skip options
    const currentType = row[17];      // Column R
    const currentTypeId = row[18];    // Column S

    // Skip options
    if (optionSlug && optionSlug.trim()) continue;

    // Try to find type by webflow ID
    let typeInfo = webflowIdToType.get(webflowId);
    
    // If not found, try by slug
    if (!typeInfo && slug) {
      const resolvedWebflowId = slugToWebflowId.get(slug);
      if (resolvedWebflowId) {
        typeInfo = webflowIdToType.get(resolvedWebflowId);
      }
    }

    if (!typeInfo) {
      noType++;
      continue;
    }

    // Check if already set correctly
    if (currentType === typeInfo.name && currentTypeId === typeInfo.id) {
      alreadySet++;
      continue;
    }

    console.log(`📝 "${serviceName}" → ${typeInfo.name}`);
    updates.push({
      row: i + 2, // +2 because Sheet rows are 1-indexed and we skip header
      typeName: typeInfo.name,
      typeId: typeInfo.id,
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé:');
  console.log(`   ✅ À mettre à jour: ${updates.length}`);
  console.log(`   ⏭️  Déjà OK: ${alreadySet}`);
  console.log(`   ❓ Sans type: ${noType}`);
  console.log('='.repeat(50));

  // 6. Apply updates
  if (!DRY_RUN && updates.length > 0) {
    console.log('\n📤 Mise à jour de Google Sheet...');
    
    const batchData = updates.flatMap(u => [
      { range: `R${u.row}`, values: [[u.typeName]] },
      { range: `S${u.row}`, values: [[u.typeId]] },
    ]);

    await sheetsApi.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      },
    });

    console.log('✅ Google Sheet mis à jour !');
  } else if (DRY_RUN && updates.length > 0) {
    console.log('\n💡 Pour appliquer: npx ts-node scripts/sync-types-from-webflow.ts');
  } else {
    console.log('\n✅ Rien à mettre à jour !');
  }
}

main().catch(console.error);
