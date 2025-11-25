import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSheetsService } from '../lib/google-sheets';
import { BooklaClient } from '../lib/bookla';
import { validateEnv } from '../utils/validation';
import { logger } from '../utils/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = validateEnv();
    
    // Initialize services
    const sheets = new GoogleSheetsService(env.GOOGLE_SHEET_ID, env.GOOGLE_CREDS);
    const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);

    logger.info('Starting ID reconciliation...');

    // 1. Fetch all services from Bookla
    const booklaServices = await bookla.getServices();
    // Create a Set of valid IDs for O(1) lookup
    // Ensure we handle cases where id might be undefined (though unlikely for valid services)
    const validIds = new Set(booklaServices.map((s: any) => s.id).filter(Boolean));
    
    logger.info(`Found ${validIds.size} valid services in Bookla.`);

    // 2. Fetch all rows from Sheet
    const sheetServices = await sheets.getServices();
    logger.info(`Found ${sheetServices.length} rows in Sheet.`);

    let fixedCount = 0;
    const errors: string[] = [];

    // 3. Iterate and check
    for (const service of sheetServices) {
      // Check if we have an ID in the sheet that is NOT in Bookla
      if (service.bookla_service_id && !validIds.has(service.bookla_service_id)) {
        logger.info(`Row ${service.rowIndex} has invalid ID: ${service.bookla_service_id}. Clearing...`);
        
        try {
          await sheets.updateRow(service.rowIndex, { bookla_service_id: '' });
          fixedCount++;
        } catch (err: any) {
          const msg = `Failed to update row ${service.rowIndex}: ${err.message}`;
          console.error(msg);
          errors.push(msg);
        }
      }
    }

    res.status(200).json({
      message: 'Reconciliation complete',
      stats: {
        total_sheet_rows: sheetServices.length,
        total_bookla_services: validIds.size,
        ids_cleared: fixedCount,
        errors_count: errors.length
      },
      errors: errors
    });

  } catch (error: any) {
    logger.error('Reconciliation failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
