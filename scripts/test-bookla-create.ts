import dotenv from 'dotenv';
dotenv.config();

import { BooklaClient } from '../src/lib/bookla';
import axios from 'axios';

async function run() {
  const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!);
  
  console.log('🆕 Creating test service...');
  const serviceId = await bookla.createService({
    title: 'Test API Creation',
    duration: 90, // 1h30
    bufferBefore: 15,
    bufferAfter: 15,
  });
  
  console.log('✅ Created service ID:', serviceId);
  
  // Get the service to verify
  const client = axios.create({
    baseURL: 'https://eu.bookla.com/api/v1',
    headers: { 'x-api-key': process.env.BOOKLA_API_KEY }
  });
  
  const res = await client.get(`/companies/${process.env.BOOKLA_COMPANY_ID}/services/${serviceId}`);
  console.log('\n=== CREATED SERVICE ===');
  console.log(JSON.stringify(res.data, null, 2));
  
  // Clean up - delete the test service
  console.log('\n🗑️  Deleting test service...');
  await bookla.deleteService(serviceId);
  console.log('✅ Deleted!');
}

run().catch(e => console.error('Error:', e));

