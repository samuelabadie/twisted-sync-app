import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSheetsService } from '../lib/google-sheets';
import { BooklaClient } from '../lib/bookla';
import { WebflowClient } from '../lib/webflow';
import { validateEnv } from '../utils/validation';
import { logger } from '../utils/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = validateEnv();

  // Security check
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (authHeader !== `Bearer ${env.SYNC_SECRET}` && secretParam !== env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized', hint: 'Use ?secret=YOUR_SYNC_SECRET in URL for browser testing' });
  }

  try {
    logger.info('Starting sync process');

    // Initialize services
    const sheets = new GoogleSheetsService(env.GOOGLE_SHEET_ID, env.GOOGLE_CREDS);
    const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);
    const webflow = new WebflowClient(env.WEBFLOW_API_TOKEN, env.WEBFLOW_SITE_ID);

    // 1. Read Sheet (source of truth)
    const sheetServices = await sheets.getServices();
    logger.info(`Fetched ${sheetServices.length} rows from Sheet`);

    // 2. Pre-fetch all Webflow items (indexed by bookla-id)
    logger.info('Fetching Webflow items...');
    await webflow.getAllItems(env.WEBFLOW_COLLECTION_ID);

    // 3. Get all Bookla services for validation
    logger.info('Fetching Bookla services...');
    const booklaServices = await bookla.getServices();
    const booklaServiceIds = new Set(booklaServices.map((s: any) => s.id));

    const report = {
      checked: 0,
      bookla_created: 0,
      bookla_updated: 0,
      webflow_created: 0,
      webflow_updated: 0,
      sheet_updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // 4. Process each service from Sheet
    for (const service of sheetServices) {
      report.checked++;
      const serviceName = service.service_name;

      try {
        // === BOOKLA SYNC ===
        let booklaId = service.bookla_service_id;

        if (booklaId) {
          // Verify it still exists in Bookla
          if (!booklaServiceIds.has(booklaId)) {
            // Bookla ID is stale, need to create new
            logger.warn(`Bookla ID ${booklaId} for "${serviceName}" no longer exists, will recreate`);
            booklaId = undefined;
          }
        }

        if (!booklaId) {
          // Create in Bookla
          const booklaPayload = {
            title: serviceName,
            duration: service.final_duration_min || service.duration_minutes,
            price: service.final_price || service.price_eur,
          };
          booklaId = await bookla.createService(booklaPayload);
          
          // Write back to Sheet
          await sheets.updateRow(service.rowIndex, { bookla_service_id: booklaId });
          report.bookla_created++;
          report.sheet_updated++;
          logger.info(`Created Bookla service for "${serviceName}": ${booklaId}`);
        }
        // Note: We don't update Bookla if it already exists (Sheet is source of truth for IDs only)

        // === WEBFLOW SYNC ===
        let webflowId = service.webflow_id;
        
        // Strategy:
        // 1. If we have a webflow_id in Sheet, verify it exists
        // 2. If not, search by bookla-id
        // 3. If still not found, create new

        let webflowItem = null;

        if (webflowId) {
          // Verify the webflow_id still exists
          webflowItem = await webflow.getItemById(env.WEBFLOW_COLLECTION_ID, webflowId);
          if (!webflowItem) {
            logger.warn(`Webflow ID ${webflowId} for "${serviceName}" no longer exists`);
            webflowId = undefined;
          }
        }

        if (!webflowId) {
          // Search by bookla-id
          webflowItem = await webflow.findItemByBooklaId(env.WEBFLOW_COLLECTION_ID, booklaId);
          if (webflowItem) {
            webflowId = webflowItem.id;
            // Update Sheet with found webflow_id
            await sheets.updateRow(service.rowIndex, { webflow_id: webflowId });
            report.sheet_updated++;
            logger.info(`Found existing Webflow item for "${serviceName}" by bookla-id: ${webflowId}`);
          }
        }

        if (webflowId) {
          // Item exists, nothing to do (we don't update Webflow from Sheet)
          report.skipped++;
        } else {
          // Need to create in Webflow
          const slug = service.webflow_slug || serviceName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          const webflowPayload = {
            name: serviceName,
            slug: `svc-${slug}`, // Prefix to avoid conflicts
            prix: service.final_price || service.price_eur || 0,
            duree: service.final_duration_min || service.duration_minutes || 0,
            'bookla-id': booklaId,
            'is-visible': service.visible !== false,
          };

          try {
            const newWebflowId = await webflow.createItem(env.WEBFLOW_COLLECTION_ID, webflowPayload);
            await sheets.updateRow(service.rowIndex, { webflow_id: newWebflowId });
            report.webflow_created++;
            report.sheet_updated++;
            logger.info(`Created Webflow item for "${serviceName}": ${newWebflowId}`);
          } catch (err: any) {
            // If slug conflict, try with bookla ID suffix
            if (err.response?.status === 400) {
              webflowPayload.slug = `svc-${slug}-${booklaId.slice(-6)}`;
              const newWebflowId = await webflow.createItem(env.WEBFLOW_COLLECTION_ID, webflowPayload);
              await sheets.updateRow(service.rowIndex, { webflow_id: newWebflowId });
              report.webflow_created++;
              report.sheet_updated++;
              logger.info(`Created Webflow item for "${serviceName}" (with suffix): ${newWebflowId}`);
            } else {
              throw err;
            }
          }
        }

      } catch (err: any) {
        const msg = `Row ${service.rowIndex} (${serviceName}): ${err.message}`;
        logger.error(msg);
        report.errors.push(msg);
      }
    }

    logger.info('Sync complete', report);

    res.status(200).json({
      message: 'Sync complete',
      summary: {
        checked: report.checked,
        bookla_created: report.bookla_created,
        webflow_created: report.webflow_created,
        sheet_updated: report.sheet_updated,
        skipped: report.skipped,
        errors_count: report.errors.length,
      },
      first_errors: report.errors.slice(0, 5),
    });

  } catch (error: any) {
    logger.error('Sync failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
