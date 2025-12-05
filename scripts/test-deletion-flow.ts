import 'dotenv/config';
import { WebflowClient } from '../src/lib/webflow';

// Verify env vars
const requiredEnvs = [
  'WEBFLOW_API_TOKEN', 
  'WEBFLOW_SITE_ID', 
  'WEBFLOW_COLLECTION_ID', 
  'WEBFLOW_SERVICE_TYPE_COLLECTION_ID'
];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
    process.exit(1);
  }
}

const webflow = new WebflowClient(
  process.env.WEBFLOW_API_TOKEN!,
  process.env.WEBFLOW_SITE_ID!
);

const SERVICES_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;
const TYPES_COLLECTION_ID = process.env.WEBFLOW_SERVICE_TYPE_COLLECTION_ID!;

const TEST_SERVICE_NAME = 'TEST-SERVICE-TO-DELETE-' + Date.now();
const TEST_SERVICE_SLUG = 'test-service-to-delete-' + Date.now();

async function main() {
  console.log('🚀 Starting Deletion Flow Test...\n');

  let serviceId: string | null = null;
  let typeId: string | null = null;

  try {
    // 1. Get a Service Type to use
    console.log('📥 Fetching service types...');
    const types = await webflow.getServiceTypes(TYPES_COLLECTION_ID);
    if (types.length === 0) {
      throw new Error('No service types found to test with.');
    }
    
    // Use the first available type
    const targetType = types[0];
    typeId = targetType.id;
    console.log(`✅ Using Service Type: "${targetType.name}" (${typeId})`);

    // 2. Create a dummy service
    console.log(`\n🔨 Creating dummy service "${TEST_SERVICE_NAME}"...`);
    serviceId = await webflow.createItem(SERVICES_COLLECTION_ID, {
      name: TEST_SERVICE_NAME,
      slug: TEST_SERVICE_SLUG,
      price: '10',
      duree: '30 mins',
      // Add other required fields if any, usually name/slug are bare minimum for creation
      _archived: false,
      _draft: false,
    });
    console.log(`✅ Service created with ID: ${serviceId}`);

    // 3. Link service to type
    console.log(`\n🔗 Linking service to type...`);
    await webflow.addServiceToType(TYPES_COLLECTION_ID, typeId, serviceId);
    
    // Verify link
    webflow.clearServiceTypesCache(); // Clear cache to ensure we get fresh data
    const updatedTypes = await webflow.getServiceTypes(TYPES_COLLECTION_ID);
    const updatedType = updatedTypes.find(t => t.id === typeId);
    
    if (updatedType?.serviceIds.includes(serviceId)) {
      console.log(`✅ Verification: Service ID ${serviceId} is present in Type's service list.`);
    } else {
      throw new Error(`❌ Verification Failed: Service ID ${serviceId} NOT found in Type's service list.`);
    }

    // 4. Perform Deletion Flow (Remove from type -> Delete item)
    console.log(`\n🗑️ Executing "Safe Deletion" flow...`);
    
    console.log(`  1. Removing service from type...`);
    await webflow.removeServiceFromType(TYPES_COLLECTION_ID, typeId, serviceId);
    
    // Verify removal
    webflow.clearServiceTypesCache();
    const finalTypes = await webflow.getServiceTypes(TYPES_COLLECTION_ID);
    const finalType = finalTypes.find(t => t.id === typeId);
    
    if (!finalType?.serviceIds.includes(serviceId)) {
      console.log(`  ✅ Verification: Service ID ${serviceId} successfully removed from Type.`);
    } else {
      throw new Error(`  ❌ Verification Failed: Service ID ${serviceId} STILL present in Type.`);
    }

    console.log(`  2. Deleting service item...`);
    await webflow.deleteItem(SERVICES_COLLECTION_ID, serviceId);
    console.log(`  ✅ Service item deleted.`);

    // Verify deletion
    const deletedItem = await webflow.getItemById(SERVICES_COLLECTION_ID, serviceId);
    if (!deletedItem) {
      console.log(`  ✅ Verification: Service item retrieval returned null (confirmed deleted).`);
    } else {
      console.log(`  ⚠️ Warning: Item still exists (might be cached or delay in propagation).`);
    }

    console.log('\n✨ Test Completed Successfully!');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Cleanup if script failed mid-way
    if (serviceId) {
      try {
        // Check if it still exists
        const item = await webflow.getItemById(SERVICES_COLLECTION_ID, serviceId);
        if (item) {
          console.log(`\n🧹 Cleanup: Deleting leftover service ${serviceId}...`);
          // Try to remove from type first just in case
          if (typeId) {
            try { await webflow.removeServiceFromType(TYPES_COLLECTION_ID, typeId, serviceId); } catch {}
          }
          await webflow.deleteItem(SERVICES_COLLECTION_ID, serviceId);
          console.log('✅ Cleanup done.');
        }
      } catch (e) {
        // Ignore cleanup errors (likely 404 if already deleted)
      }
    }
  }
}

main();
