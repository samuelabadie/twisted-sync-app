import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

async function run() {
  const token = process.env.WEBFLOW_API_TOKEN;
  const collectionId = process.env.WEBFLOW_COLLECTION_ID;

  if (!token || !collectionId) {
    console.error('❌ WEBFLOW_API_TOKEN ou WEBFLOW_COLLECTION_ID manquant');
    process.exit(1);
  }

  console.log('🔍 Récupération de la structure de la collection Webflow...\n');

  try {
    // Get collection schema
    const response = await axios.get(`https://api.webflow.com/v2/collections/${collectionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    const collection = response.data;
    console.log(`📁 Collection: ${collection.displayName} (${collection.slug})`);
    console.log(`   ID: ${collection.id}\n`);

    console.log('📋 Champs disponibles:');
    console.log('─'.repeat(60));
    
    for (const field of collection.fields) {
      const required = field.isRequired ? '(obligatoire)' : '';
      console.log(`   • ${field.slug} [${field.type}] ${required}`);
      console.log(`     Display: "${field.displayName}"`);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n💡 Utilise les "slug" ci-dessus dans le payload Webflow.');
    console.log('   Par exemple, si le champ prix s\'appelle "prix-2", utilise "prix-2" et non "price".\n');

    // Also fetch a sample item to see the structure
    console.log('📄 Exemple d\'un item existant:');
    const itemsResponse = await axios.get(`https://api.webflow.com/v2/collections/${collectionId}/items?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (itemsResponse.data.items && itemsResponse.data.items.length > 0) {
      const sampleItem = itemsResponse.data.items[0];
      console.log(JSON.stringify(sampleItem.fieldData, null, 2));
    } else {
      console.log('   (Aucun item dans la collection)');
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

run();

