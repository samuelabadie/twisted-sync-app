import dotenv from 'dotenv';
dotenv.config();

import { GoogleSheetsService } from '../src/lib/google-sheets';
import axios from 'axios';

const token = process.env.WEBFLOW_API_TOKEN!;
const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

const api = axios.create({
  baseURL: 'https://api.webflow.com/v2',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

async function getAllWebflowItems(): Promise<any[]> {
  let allItems: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await api.get(`/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);
    const items = response.data.items || [];
    allItems = allItems.concat(items);
    if (items.length < limit) break;
    offset += limit;
    await delay(200);
  }
  return allItems;
}

async function deleteWebflowItem(itemId: string): Promise<boolean> {
  try {
    await api.delete(`/collections/${collectionId}/items/${itemId}`);
    return true;
  } catch (err: any) {
    // 409 = conflict (referenced by another item), will retry later
    if (err.response?.status === 409) {
      return false;
    }
    throw err;
  }
}

async function createWebflowItem(payload: any): Promise<string> {
  const response = await api.post(`/collections/${collectionId}/items`, { fieldData: payload });
  return response.data.id;
}

async function updateWebflowItem(itemId: string, payload: any): Promise<void> {
  await api.patch(`/collections/${collectionId}/items/${itemId}`, { fieldData: payload });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateUniqueSlug(service: any, existingSlugs: Set<string>): string {
  // Base slug from webflow_slug or service name
  let baseSlug = service.webflow_slug || service.service_name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // For options, append the option slug
  if (service.option_extra_slug) {
    baseSlug = `${baseSlug}-${service.option_extra_slug}`;
  }

  // Ensure uniqueness by appending bookla ID suffix if needed
  let slug = baseSlug;
  if (existingSlugs.has(slug)) {
    // Use last 6 chars of bookla ID to make it unique
    const suffix = service.bookla_service_id?.slice(-6) || Math.random().toString(36).slice(-6);
    slug = `${baseSlug}-${suffix}`;
  }

  existingSlugs.add(slug);
  return slug;
}

async function run() {
  console.log('🧹 Nettoyage et synchronisation Webflow (v2)\n');
  console.log('Cette opération va:');
  console.log('  1. Supprimer TOUS les items Webflow existants');
  console.log('  2. Recréer uniquement ceux qui ont un Bookla ID dans le Sheet\n');

  // 1. Get Sheet data
  console.log('📊 Lecture du Google Sheet...');
  const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
  const sheetServices = await sheets.getServices();
  
  const validServices = sheetServices.filter(s => s.bookla_service_id);
  console.log(`   → ${validServices.length} services avec Bookla ID\n`);

  // 2. Get all Webflow items
  console.log('📦 Récupération des items Webflow...');
  let webflowItems = await getAllWebflowItems();
  console.log(`   → ${webflowItems.length} items à supprimer\n`);

  // 3. Delete ALL items (multiple passes to handle references)
  if (webflowItems.length > 0) {
    console.log('🗑️  Suppression de tous les items...');
    let totalDeleted = 0;
    let pass = 1;
    
    while (webflowItems.length > 0 && pass <= 5) {
      console.log(`   Pass ${pass}: ${webflowItems.length} items restants`);
      const failedToDelete: any[] = [];
      
      for (const item of webflowItems) {
        const success = await deleteWebflowItem(item.id);
        if (success) {
          totalDeleted++;
        } else {
          failedToDelete.push(item);
        }
        await delay(150);
      }
      
      webflowItems = failedToDelete;
      pass++;
    }
    
    if (webflowItems.length > 0) {
      console.log(`   ⚠️  ${webflowItems.length} items n'ont pas pu être supprimés`);
    }
    console.log(`   ✅ ${totalDeleted} items supprimés\n`);
  }

  // 4. Create fresh items from Sheet
  console.log('🔄 Création des items depuis le Sheet...');
  let created = 0, errors = 0;
  const usedSlugs = new Set<string>();
  const errorDetails: string[] = [];

  for (const service of validServices) {
    const booklaId = service.bookla_service_id!;
    let slug = generateUniqueSlug(service, usedSlugs);

    const payload: Record<string, any> = {
      name: service.service_name,
      slug: slug,
      prix: service.option_extra_slug ? (service.final_price || service.price_eur) : service.price_eur,
      duree: service.option_extra_slug ? (service.final_duration_min || service.duration_minutes) : service.duration_minutes,
      'bookla-id': booklaId,
      'is-visible': service.visible !== false,
    };

    // Try to create, if slug conflict, retry with suffix
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        const newId = await createWebflowItem(payload);
        created++;
        
        // Update sheet with new webflow_id
        await sheets.updateRow(service.rowIndex, { webflow_id: newId });
        
        process.stdout.write(`\r   Créé: ${created}/${validServices.length}`);
        await delay(300);
        break; // Success, exit loop
        
      } catch (err: any) {
        const errData = err.response?.data;
        const isSlugConflict = errData?.details?.some((d: any) => 
          d.message?.includes('slug') || d.slug?.includes('unique')
        ) || errData?.message?.includes('slug');
        
        if (isSlugConflict && attempts < maxAttempts - 1) {
          // Retry with a different slug
          attempts++;
          slug = `${generateUniqueSlug(service, usedSlugs)}-${attempts + 1}`;
          payload.slug = slug;
          usedSlugs.add(slug);
          console.log(`\n   ⚠️  Slug "${payload.slug}" existe, essai avec "${slug}"...`);
          await delay(300);
        } else {
          // Final failure
          errors++;
          const errMsg = errData?.message || err.message;
          const errDetails = JSON.stringify(errData?.details || errData || {});
          errorDetails.push(`${service.service_name}: ${errMsg}`);
          console.error(`\n   ❌ "${service.service_name}" (slug: ${slug}): ${errMsg}`);
          console.error(`      Détails: ${errDetails}`);
          break;
        }
      }
    }
  }

  console.log('\n\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(50));
  console.log(`   Créés:        ${created}`);
  console.log(`   Erreurs:      ${errors}`);
  
  if (errors > 0 && errorDetails.length <= 10) {
    console.log('\n   Détail des erreurs:');
    errorDetails.forEach(e => console.log(`   - ${e}`));
  }
  
  console.log('\n✅ Synchronisation terminée !');
  console.log(`   ${created} items Webflow correspondent maintenant aux ${validServices.length} services Bookla.`);
}

run().catch(console.error);
