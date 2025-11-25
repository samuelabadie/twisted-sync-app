import dotenv from 'dotenv';
dotenv.config();

import { GoogleSheetsService } from '../src/lib/google-sheets';
import { BooklaClient } from '../src/lib/bookla';
import { WebflowClient } from '../src/lib/webflow';
import { SyncLogic } from '../src/lib/sync-logic';

async function run() {
  console.log('🚀 Démarrage du test de synchronisation...\n');

  // Check env vars
  const requiredVars = [
    'GOOGLE_CREDS', 'GOOGLE_SHEET_ID', 
    'BOOKLA_API_KEY', 'BOOKLA_COMPANY_ID',
    'WEBFLOW_API_TOKEN', 'WEBFLOW_SITE_ID', 'WEBFLOW_COLLECTION_ID'
  ];
  
  for (const v of requiredVars) {
    if (!process.env[v]) {
      console.error(`❌ Variable manquante: ${v}`);
      process.exit(1);
    }
  }
  console.log('✅ Variables d\'environnement OK\n');

  try {
    // 1. Initialize services
    const sheets = new GoogleSheetsService(process.env.GOOGLE_SHEET_ID!, process.env.GOOGLE_CREDS!);
    const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!);
    const webflow = new WebflowClient(process.env.WEBFLOW_API_TOKEN!, process.env.WEBFLOW_SITE_ID!);

    // 2. Read Sheet
    console.log('📊 Lecture du Google Sheet...');
    const rawServices = await sheets.getServices();
    console.log(`   → ${rawServices.length} lignes trouvées\n`);

    if (rawServices.length === 0) {
      console.log('⚠️  Aucune donnée dans le Sheet. Ajoute au moins une ligne et réessaie.');
      return;
    }

    // Show first few rows for debug
    console.log('📋 Aperçu des premières lignes:');
    rawServices.slice(0, 3).forEach((s, i) => {
      console.log(`   [${i + 1}] ${s.service_name || '(vide)'} | ${s.price_eur}€ | ${s.duration_minutes}min | Bookla ID: ${s.bookla_service_id || '(aucun)'}`);
    });
    console.log('');

    // 3. Process Logic
    console.log('⚙️  Traitement des données (groupement parent/options)...');
    const groupedServices = SyncLogic.processServices(rawServices);
    console.log(`   → ${groupedServices.size} groupe(s) de services\n`);

    const report = { created: 0, updated: 0, errors: [] as string[] };

    // 4. Sync Loop
    for (const [slug, services] of groupedServices) {
      console.log(`\n🔄 Traitement du groupe: ${slug}`);

      for (const service of services) {
        const label = service.option_extra_slug 
          ? `  └─ Option: ${service.option_extra_slug}` 
          : `  └─ Parent: ${service.service_name}`;
        
        try {
          const booklaPayload = {
            title: service.service_name + (service.option_extra_slug ? ` (${service.option_extra_slug})` : ''),
            duration: service.final_duration_min,
            price: service.final_price,
          };

          let booklaId = service.bookla_service_id;

          if (booklaId) {
            console.log(`${label} → Mise à jour Bookla (ID: ${booklaId})`);
            await bookla.updateService(booklaId, booklaPayload);
            report.updated++;
          } else {
            console.log(`${label} → Création Bookla...`);
            booklaId = await bookla.createService(booklaPayload);
            console.log(`${label} → ✅ Créé avec ID: ${booklaId}`);
            service.bookla_service_id = booklaId;
            report.created++;

            // Write back ID to Sheet (only when created, to save API calls)
            await sheets.updateRow(service.rowIndex, { 
              bookla_service_id: booklaId,
              bookla_updated_at: new Date().toISOString(),
            });
            console.log(`${label} → 📝 ID écrit dans le Sheet (ligne ${service.rowIndex})`);
          }
          // Note: Skip updating bookla_updated_at on every update to reduce API calls

        } catch (err: any) {
          const msg = `${label}: ${err.message}`;
          console.error(`${label} → ❌ Erreur: ${err.message}`);
          report.errors.push(msg);
        }
      }

      // Webflow Sync - First sync parent to get its Webflow ID
      const parentService = services.find(s => !s.option_extra_slug);
      let parentWebflowId: string | null = null;

      if (parentService) {
        try {
          // Parent: only its own bookla-id
          const webflowPayload: Record<string, any> = {
            name: parentService.service_name,
            slug: parentService.webflow_slug,
            prix: parentService.price_eur,
            duree: parentService.duration_minutes,
            'bookla-id': parentService.bookla_service_id || '',
            'is-visible': parentService.visible,
          };

          console.log(`  └─ Webflow Parent: Recherche item existant...`);
          const existingId = await webflow.findItemBySlug(process.env.WEBFLOW_COLLECTION_ID!, parentService.webflow_slug);

          if (existingId) {
            console.log(`  └─ Webflow Parent: Mise à jour (ID: ${existingId})`);
            await webflow.updateItem(process.env.WEBFLOW_COLLECTION_ID!, existingId, webflowPayload);
            parentWebflowId = existingId;
          } else {
            console.log(`  └─ Webflow Parent: Création...`);
            parentWebflowId = await webflow.createItem(process.env.WEBFLOW_COLLECTION_ID!, webflowPayload);
            console.log(`  └─ Webflow Parent: ✅ Créé avec ID: ${parentWebflowId}`);
          }

          if (parentWebflowId !== parentService.webflow_id) {
            await sheets.updateRow(parentService.rowIndex, { webflow_id: parentWebflowId });
            console.log(`  └─ 📝 Webflow ID parent écrit dans le Sheet`);
          }

        } catch (err: any) {
          console.error(`  └─ Webflow Parent: ❌ Erreur: ${err.message}`);
          report.errors.push(`Webflow Parent (${slug}): ${err.message}`);
        }
      }

      // Webflow Sync - Then sync options with reference to parent
      const optionServices = services.filter(s => s.option_extra_slug);
      for (const optionService of optionServices) {
        try {
          const optionSlug = `${optionService.webflow_slug}-${optionService.option_extra_slug}`;
          
          const webflowPayload: Record<string, any> = {
            name: `${optionService.service_name} + ${optionService.option_extra_slug}`,
            slug: optionSlug,
            prix: optionService.final_price,
            duree: optionService.final_duration_min,
            'bookla-id': optionService.bookla_service_id || '',
            'is-visible': optionService.visible,
          };

          // Link to parent if we have its Webflow ID
          if (parentWebflowId) {
            webflowPayload['service-parent'] = parentWebflowId;
          }

          console.log(`  └─ Webflow Option (${optionService.option_extra_slug}): Recherche...`);
          const existingId = await webflow.findItemBySlug(process.env.WEBFLOW_COLLECTION_ID!, optionSlug);

          let webflowId: string;
          if (existingId) {
            console.log(`  └─ Webflow Option: Mise à jour (ID: ${existingId})`);
            await webflow.updateItem(process.env.WEBFLOW_COLLECTION_ID!, existingId, webflowPayload);
            webflowId = existingId;
          } else {
            console.log(`  └─ Webflow Option: Création...`);
            webflowId = await webflow.createItem(process.env.WEBFLOW_COLLECTION_ID!, webflowPayload);
            console.log(`  └─ Webflow Option: ✅ Créé avec ID: ${webflowId}`);
          }

          if (webflowId !== optionService.webflow_id) {
            await sheets.updateRow(optionService.rowIndex, { webflow_id: webflowId });
            console.log(`  └─ 📝 Webflow ID option écrit dans le Sheet`);
          }

        } catch (err: any) {
          console.error(`  └─ Webflow Option (${optionService.option_extra_slug}): ❌ Erreur: ${err.message}`);
          report.errors.push(`Webflow Option (${slug}/${optionService.option_extra_slug}): ${err.message}`);
        }
      }

      // Small delay between groups to avoid Google Sheets rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(50));
    console.log(`   Créés:      ${report.created}`);
    console.log(`   Mis à jour: ${report.updated}`);
    console.log(`   Erreurs:    ${report.errors.length}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ Erreurs rencontrées:');
      report.errors.forEach(e => console.log(`   - ${e}`));
    }

    console.log('\n✅ Synchronisation terminée !');

  } catch (error: any) {
    console.error('\n💥 Erreur fatale:', error.message);
    console.error(error);
  }
}

run();

