import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

async function run() {
  const client = axios.create({
    baseURL: 'https://eu.bookla.com/api/v1',
    headers: { 'x-api-key': process.env.BOOKLA_API_KEY }
  });
  
  const companyId = process.env.BOOKLA_COMPANY_ID;
  const serviceId = '4a426f6d-6096-40b2-a276-13ecf75cdd4e'; // Boho braids
  
  console.log('=== Testing Pricing Endpoints ===\n');
  
  // 1. List price rules
  console.log('1. GET /pricing - List price rules');
  try {
    const res = await client.get(`/companies/${companyId}/services/${serviceId}/pricing`);
    console.log('   Status:', res.status);
    console.log('   Data:', JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log('   Error:', e.response?.status, e.response?.data);
  }
  
  // 2. Try creating a price rule with different payloads
  console.log('\n2. POST /pricing - Create price rule');
  
  const payloads = [
    { price: 300, currency: 'EUR' },
    { amount: 300, currency: 'EUR' },
    { price: 300 },
    { name: 'Standard', price: 300, currency: 'EUR' },
    { title: 'Standard', amount: 300, currency: 'EUR' },
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    console.log(`\n   Attempt ${i + 1}:`, JSON.stringify(payloads[i]));
    try {
      const res = await client.post(`/companies/${companyId}/services/${serviceId}/pricing`, payloads[i]);
      console.log('   ✅ Success:', JSON.stringify(res.data, null, 2));
      
      // If success, delete it to clean up
      if (res.data?.id) {
        await client.delete(`/companies/${companyId}/services/${serviceId}/pricing/${res.data.id}`);
        console.log('   (cleaned up)');
      }
      break; // Stop on first success
    } catch (e: any) {
      console.log('   ❌ Error:', e.response?.status, JSON.stringify(e.response?.data));
    }
  }
}

run().catch(e => console.error('Fatal error:', e));

