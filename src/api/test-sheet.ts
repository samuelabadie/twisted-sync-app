import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSheetsService } from '../lib/google-sheets';
import { validateEnv } from '../utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Validate Env (to ensure we have credentials)
    const env = validateEnv();

    // 2. Initialize Service
    const sheets = new GoogleSheetsService(env.GOOGLE_SHEET_ID, env.GOOGLE_CREDS);

    // 3. Fetch Data
    const services = await sheets.getServices();

    // 4. Return Result
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error: any) {
    console.error("Sheet Test Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

