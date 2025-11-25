import { VercelRequest, VercelResponse } from '@vercel/node';
import { BooklaClient } from '../lib/bookla';
import { validateEnv } from '../utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = validateEnv();
    const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);

    const services = await bookla.getServices();

    // Return the RAW services array to see all fields
    res.status(200).json({
      count: services.length,
      services: services // No mapping, just raw data
    });

  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
}
