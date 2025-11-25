import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSheetsService } from '../lib/google-sheets';
import { BooklaClient } from '../lib/bookla';
import { WebflowClient } from '../lib/webflow';
import { SyncLogic } from '../lib/sync-logic';
import { validateEnv } from '../utils/validation';
import { logger } from '../utils/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') { // Allow GET for easier testing
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = validateEnv();

  // Security check
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret; // Allow query param for browser testing

  if (authHeader !== `Bearer ${env.SYNC_SECRET}` && secretParam !== env.SYNC_SECRET) {
    // For local testing convenience, you can comment this out if needed, 
    // but it's better to use ?secret=YOUR_SECRET in the URL
    return res.status(401).json({ error: 'Unauthorized', hint: 'Use ?secret=YOUR_SYNC_SECRET in URL for browser testing' });
  }

  try {
    logger.info('Starting sync process');

    // Initialize services
    const sheets = new GoogleSheetsService(env.GOOGLE_SHEET_ID, env.GOOGLE_CREDS);
    const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);
    const webflow = new WebflowClient(env.WEBFLOW_API_TOKEN, env.WEBFLOW_SITE_ID);

    // 1. Read Sheet
    const rawServices = await sheets.getServices();
    logger.info(`Fetched ${rawServices.length} rows from Sheet`);

    // 2. Process Logic
    const groupedServices = SyncLogic.processServices(rawServices);

    const report = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // 3. Sync Loop
    for (const [slug, services] of groupedServices) {
      // We need to collect IDs for Webflow
      const booklaIds: string[] = [];

      for (const service of services) {
        try {
          // Bookla Sync
          const booklaPayload = {
            title: service.service_name + (service.option_extra_slug ? ` (${service.option_extra_slug})` : ''),
            duration: service.final_duration_min,
            price: service.final_price,
            // Add other fields as needed
          };

          let booklaId = service.bookla_service_id;

          if (booklaId) {
            // Update
            await bookla.updateService(booklaId, booklaPayload);
            report.updated++;
          } else {
            // Create
            booklaId = await bookla.createService(booklaPayload);
            service.bookla_service_id = booklaId;
            report.created++;

            // Write back ID to Sheet immediately (or batch later)
            await sheets.updateRow(service.rowIndex, { bookla_service_id: booklaId });
          }

          booklaIds.push(booklaId);

          // Write back calculated values
          // Only update if strictly necessary to reduce API calls
          await sheets.updateRow(service.rowIndex, {
            bookla_updated_at: new Date().toISOString(),
          });

        } catch (err: any) {
          const msg = `Row ${service.rowIndex} (${service.service_name}): ${err.message}`;
          // Only log error message, not full stack trace to reduce noise
          console.error(msg);
          report.errors.push(msg);
        }
      }

      // Webflow Sync (Parent Level)
      const parentService = services.find(s => !s.option_extra_slug);
      if (parentService) {
        try {
          // Construct mapping: "parent:ID1,option1:ID2"
          const mapping = services
            .filter(s => s.bookla_service_id)
            .map(s => `${s.option_extra_slug || 'parent'}:${s.bookla_service_id}`)
            .join(',');

          // Webflow field names (from collection schema):
          // - name, slug (required)
          // - prix, duree, bookla-id, is-visible
          const webflowPayload: Record<string, any> = {
            name: parentService.service_name,
            slug: parentService.webflow_slug,
            prix: parentService.price_eur,
            duree: parentService.duration_minutes,
            'bookla-id': mapping,
            'is-visible': parentService.visible,
          };

          let webflowId = parentService.webflow_id;
          
          // Check existence by slug to be safe
          const existingId = await webflow.findItemBySlug(env.WEBFLOW_COLLECTION_ID, parentService.webflow_slug);
          
          if (existingId) {
            await webflow.updateItem(env.WEBFLOW_COLLECTION_ID, existingId, webflowPayload);
            webflowId = existingId;
          } else {
            webflowId = await webflow.createItem(env.WEBFLOW_COLLECTION_ID, webflowPayload);
          }

          // Update Sheet with Webflow ID if it changed
          if (webflowId !== parentService.webflow_id) {
            await sheets.updateRow(parentService.rowIndex, { webflow_id: webflowId });
          }

        } catch (err: any) {
          const msg = `Webflow Sync Error (${slug}): ${err.message}`;
          console.error(msg);
          report.errors.push(msg);
        }
      }
    }

    res.status(200).json({ 
        message: 'Sync complete', 
        summary: {
            created: report.created,
            updated: report.updated,
            errors_count: report.errors.length
        },
        // Only show first 5 errors to keep response small
        first_errors: report.errors.slice(0, 5) 
    });

  } catch (error: any) {
    logger.error('Sync failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
