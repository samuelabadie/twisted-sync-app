import 'dotenv/config';
import axios from 'axios';

const SERVICES_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;
const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!;

const headers = {
  Authorization: `Bearer ${WEBFLOW_TOKEN}`,
  'Content-Type': 'application/json',
};

async function main() {
  console.log('🔍 Services dans Webflow:\n');
  
  let offset = 0;
  const slugs: string[] = [];
  
  while (true) {
    const res = await axios.get(
      `https://api.webflow.com/v2/collections/${SERVICES_COLLECTION_ID}/items?limit=100&offset=${offset}`,
      { headers }
    );
    const items = res.data.items || [];
    
    for (const item of items) {
      const slug = item.fieldData?.slug || '';
      const name = item.fieldData?.name || '';
      // Only show parent services (no option in slug)
      if (!slug.includes('coupe-des-pointes') && 
          !slug.includes('shampoing-dmlant') && 
          !slug.includes('shampoing-et-soin')) {
        console.log(`${slug} → "${name}"`);
        slugs.push(slug);
      }
    }
    
    if (items.length < 100) break;
    offset += 100;
  }
  
  console.log(`\n📊 Total services parents: ${slugs.length}`);
}

main().catch(console.error);
