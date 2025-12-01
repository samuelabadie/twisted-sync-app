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
  console.log('🔄 Sync des types de service vers Webflow...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE\n' : '🔴 LIVE MODE\n');

  // 1. Fetch all service types from Webflow
  console.log('📥 Récupération des types de service...');
  const serviceTypes = await fetchAllItems(SERVICE_TYPE_COLLECTION_ID);
  
  // Build name -> type mapping
  const typeByName = new Map<string, { id: string; currentServices: string[] }>();
  for (const type of serviceTypes) {
    const name = type.fieldData?.name?.toLowerCase().trim() || '';
    typeByName.set(name, {
      id: type.id,
      currentServices: type.fieldData?.service || [],
    });
    console.log(`   📂 ${type.fieldData?.name} (${type.fieldData?.service?.length || 0} services)`);
  }

  // 2. Fetch all services from Webflow to get slug -> ID mapping
  console.log('\n📥 Récupération des services...');
  const services = await fetchAllItems(SERVICES_COLLECTION_ID);
  
  const slugToId = new Map<string, string>();
  for (const svc of services) {
    const slug = svc.fieldData?.slug || '';
    slugToId.set(slug, svc.id);
    // Also map without "svc-" prefix for matching with CSV
    if (slug.startsWith('svc-')) {
      slugToId.set(slug.replace('svc-', ''), svc.id);
    }
  }
  console.log(`   Trouvé ${services.length} services`);

  // 3. Read CSV file
  const csvPath = path.join(__dirname, '..', 'twisted_database.csv');
  console.log('\n📊 Lecture du fichier CSV...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headerCols = lines[0].split(',');
  
  const serviceTypeCol = headerCols.indexOf('Service_Type');
  const serviceTypeIdCol = headerCols.indexOf('Service_Type_ID');
  
  if (serviceTypeCol === -1) {
    console.error('❌ Colonne Service_Type non trouvée ! Lance d\'abord migrate-service-types.ts');
    return;
  }

  // 4. Build updates: for each type, collect services to add
  const typeUpdates = new Map<string, Set<string>>(); // typeId -> Set of service IDs to add
  const csvUpdates: { lineIndex: number; typeId: string }[] = [];
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(',');
    const slug = cols[1]?.trim();           // Webflow_Slug
    const serviceName = cols[2];            // Service_Name
    const optionSlug = cols[12];            // Option_Extra_Slug
    const serviceType = cols[serviceTypeCol]?.trim().toLowerCase();
    const existingTypeId = cols[serviceTypeIdCol]?.trim();

    // Skip options
    if (optionSlug && optionSlug.trim()) {
      skipped++;
      continue;
    }

    // Skip if no type specified
    if (!serviceType) {
      skipped++;
      continue;
    }

    // Find the service ID from Webflow
    const serviceId = slugToId.get(slug);
    if (!serviceId) {
      console.log(`⚠️  Service "${serviceName}" (${slug}) non trouvé sur Webflow`);
      errors++;
      continue;
    }

    // Find the type
    const typeInfo = typeByName.get(serviceType);
    if (!typeInfo) {
      console.log(`⚠️  Type "${serviceType}" non trouvé pour "${serviceName}"`);
      errors++;
      continue;
    }

    // Check if already in the type
    if (typeInfo.currentServices.includes(serviceId)) {
      console.log(`⏭️  "${serviceName}" déjà dans ${serviceType}`);
      // Still update CSV with type ID if missing
      if (!existingTypeId) {
        csvUpdates.push({ lineIndex: i, typeId: typeInfo.id });
      }
      skipped++;
      continue;
    }

    console.log(`📝 "${serviceName}" → ${serviceType}`);
    
    // Add to updates
    if (!typeUpdates.has(typeInfo.id)) {
      typeUpdates.set(typeInfo.id, new Set(typeInfo.currentServices));
    }
    typeUpdates.get(typeInfo.id)!.add(serviceId);
    csvUpdates.push({ lineIndex: i, typeId: typeInfo.id });
    processed++;
  }

  // 5. Apply updates to Webflow
  if (!DRY_RUN && typeUpdates.size > 0) {
    console.log('\n📤 Mise à jour de Webflow...');
    
    for (const [typeId, serviceIds] of typeUpdates) {
      try {
        await axios.patch(
          `https://api.webflow.com/v2/collections/${SERVICE_TYPE_COLLECTION_ID}/items/${typeId}/live`,
          { fieldData: { service: Array.from(serviceIds) } },
          { headers }
        );
        console.log(`   ✅ Type ${typeId} mis à jour (${serviceIds.size} services)`);
        await new Promise(r => setTimeout(r, 250)); // Rate limit
      } catch (e: any) {
        console.error(`   ❌ Erreur: ${e.response?.data?.message || e.message}`);
      }
    }
  }

  // 6. Update CSV with type IDs
  if (!DRY_RUN && csvUpdates.length > 0) {
    console.log('\n📝 Mise à jour du CSV...');
    const updatedLines = [...lines];
    
    for (const update of csvUpdates) {
      const cols = updatedLines[update.lineIndex].split(',');
      cols[serviceTypeIdCol] = update.typeId;
      updatedLines[update.lineIndex] = cols.join(',');
    }
    
    fs.writeFileSync(csvPath, updatedLines.join('\n'), 'utf-8');
    console.log('   ✅ CSV mis à jour avec les IDs des types');
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé:');
  console.log(`   ✅ ${DRY_RUN ? 'À synchroniser' : 'Synchronisés'}: ${processed}`);
  console.log(`   ⏭️  Ignorés: ${skipped}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log('='.repeat(50));

  if (DRY_RUN && processed > 0) {
    console.log('\n💡 Pour appliquer: npx ts-node scripts/sync-service-types.ts');
  }
}

main().catch(console.error);
