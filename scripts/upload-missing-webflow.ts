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

async function createWebflowItem(payload: any): Promise<string> {
  const response = await api.post(`/collections/${collectionId}/items`, { fieldData: payload });
  return response.data.id;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  console.log('🔄 Upload des services manquants vers Webflow\n');

  // 1. Get Sheet data
  console.log('📊 Lecture du Google Sheet...');
  const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
  const sheetServices = await sheets.getServices();
  
  // Find services with bookla_service_id but NO webflow_id
  const missingServices = sheetServices.filter(s => s.bookla_service_id && !s.webflow_id);
  
  console.log(`   → ${sheetServices.length} services total`);
  console.log(`   → ${missingServices.length} services sans Webflow ID (à créer)\n`);

  if (missingServices.length === 0) {
    console.log('✅ Tous les services ont déjà un Webflow ID !');
    return;
  }

  console.log('📋 Services à créer:');
  missingServices.forEach(s => {
    console.log(`   - ${s.service_name} (Bookla: ${s.bookla_service_id})`);
  });
  console.log('');

  // 2. Create each missing service with prefixed slug
  console.log('🚀 Création des items...\n');
  let created = 0, errors = 0;

  for (const service of missingServices) {
    // Use prefixed slug to avoid conflicts
    const baseSlug = toSlug(service.service_name);
    const slug = `svc-${baseSlug}`; // Prefix with "svc-" to make unique

    const payload: Record<string, any> = {
      name: service.service_name,
      slug: slug,
      prix: service.option_extra_slug ? (service.final_price || service.price_eur) : service.price_eur,
      duree: service.option_extra_slug ? (service.final_duration_min || service.duration_minutes) : service.duration_minutes,
      'bookla-id': service.bookla_service_id,
      'is-visible': service.visible !== false,
    };

    try {
      const newId = await createWebflowItem(payload);
      created++;
      
      // Update sheet with new webflow_id
      await sheets.updateRow(service.rowIndex, { webflow_id: newId });
      
      console.log(`   ✅ "${service.service_name}" → ${slug} (ID: ${newId})`);
      await delay(400);
      
    } catch (err: any) {
      errors++;
      const errMsg = err.response?.data?.message || err.message;
      const details = JSON.stringify(err.response?.data?.details || {});
      console.error(`   ❌ "${service.service_name}" (${slug}): ${errMsg}`);
      console.error(`      ${details}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(50));
  console.log(`   Créés:   ${created}`);
  console.log(`   Erreurs: ${errors}`);
  console.log('\n✅ Terminé !');
}

run().catch(console.error);

