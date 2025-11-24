import { VercelRequest, VercelResponse } from '@vercel/node';
import { BooklaClient } from '../lib/bookla';
import { validateEnv } from '../utils/validation';
import { logger } from '../utils/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cron jobs are usually GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Vercel Cron signature if needed (req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`)
  // For now, we'll rely on env validation

  const env = validateEnv();
  const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);

  try {
    logger.info('Starting payment cleanup job');

    const pendingBookings = await bookla.getPendingBookings();
    const now = new Date();
    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

    let cancelledCount = 0;

    for (const booking of pendingBookings) {
      const createdAt = new Date(booking.createdAt); // Assumption on field name
      const age = now.getTime() - createdAt.getTime();

      if (age > TIMEOUT_MS) {
        logger.info(`Cancelling expired booking ${booking.id} (age: ${Math.round(age / 60000)}m)`);
        await bookla.cancelBooking(booking.id);
        cancelledCount++;
      }
    }

    logger.info(`Cleanup complete. Cancelled ${cancelledCount} bookings.`);
    res.status(200).json({ success: true, cancelled: cancelledCount });

  } catch (error: any) {
    logger.error('Cleanup job failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
