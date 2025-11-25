import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { validateEnv } from '../utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = validateEnv();
    const apiToken = env.WEBFLOW_API_TOKEN;
    const siteId = env.WEBFLOW_SITE_ID;

    if (!apiToken || !siteId) {
      return res.status(400).json({ error: 'Missing Webflow Env Vars' });
    }

    const client = axios.create({
      baseURL: 'https://api.webflow.com/v2',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
      },
    });

    // Fetch Collections
    const response = await client.get(`/sites/${siteId}/collections`);
    
    res.status(200).json({
      success: true,
      collections: response.data.collections
    });

  } catch (error: any) {
    console.error("Webflow Test Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
}

