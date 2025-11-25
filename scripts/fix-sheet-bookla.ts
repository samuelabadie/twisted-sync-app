import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

async function run() {
  console.log('🔧 Correction du Sheet avec les services Bookla manquants\n');

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const creds = JSON.parse(process.env.GOOGLE_CREDS!);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Fix existing rows with wrong Bookla IDs (lines 109 and 110)
  console.log('📝 Correction des Bookla IDs invalides...\n');

  const fixes = [
    {
      row: 109,
      booklaId: 'c851293f-13d5-49c1-888c-60fad923fe1f', // Vanilles + Shampoing démêlant
      name: 'Vanilles + Shampoing Démêlant'
    },
    {
      row: 110,
      booklaId: '8db370ba-77e7-4716-87d3-537c86088c5e', // Vanilles + Shampoing et soin
      name: 'Vanilles + Shampoing Et Soin'
    }
  ];

  for (const fix of fixes) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `D${fix.row}`, // Column D = Bookla_ServiceID
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[fix.booklaId]]
      }
    });
    console.log(`   ✅ Ligne ${fix.row}: "${fix.name}" → ${fix.booklaId}`);
  }

  // 2. Add new rows for Bone straight (parent + 3 options)
  console.log('\n📝 Ajout des nouvelles lignes pour "Bone straight"...\n');

  // Structure: Webflow_ID, Webflow_Slug, Service_Name, Bookla_ServiceID, Duration, Price, 
  //            Category_Slug, Bookla_CategoryID, Resource_Slug, Bookla_ResourceID, 
  //            Capacity, Visible, Option_Extra_Slug, Option_Extra_Price, Option_Extra_Duration,
  //            Bookla_UpdatedAt, Notes
  
  const newRows = [
    // Parent: Bone straight
    ['', 'bone-straight', 'Bone straight', '9d9896e8-b6af-4b0a-a772-09bb9655d92c', '180', '0', '', '', '', '', '1', 'TRUE', '', '', '', '', ''],
    // Option: + coupe des pointes
    ['', 'bone-straight-coupe-des-pointes', 'Bone straight + Coupe Des Pointes', '4025e973-6bfb-4f35-aaa5-7f1427b40962', '200', '0', '', '', '', '', '1', 'TRUE', 'coupe-des-pointes', '10', '20', '', ''],
    // Option: + Shampoing démêlant
    ['', 'bone-straight-shampoing-demelant', 'Bone straight + Shampoing Démêlant', 'f26773e8-7dba-42fe-8f66-131bb82e19a3', '200', '0', '', '', '', '', '1', 'TRUE', 'shampoing-dmlant', '10', '20', '', ''],
    // Option: + Shampoing et soin
    ['', 'bone-straight-shampoing-et-soin', 'Bone straight + Shampoing Et Soin', '6c7a8e64-f385-4183-bb44-ae6488c69d48', '220', '0', '', '', '', '', '1', 'TRUE', 'shampoing-et-soin', '20', '40', '', ''],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'A:Q',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: newRows
    }
  });

  console.log('   ✅ Bone straight (parent)');
  console.log('   ✅ Bone straight + Coupe Des Pointes');
  console.log('   ✅ Bone straight + Shampoing Démêlant');
  console.log('   ✅ Bone straight + Shampoing Et Soin');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Sheet mis à jour !');
  console.log('='.repeat(50));
  console.log('\nProchaine étape: synchroniser vers Webflow');
  console.log('   npx ts-node scripts/upload-missing-webflow.ts');
}

run().catch(console.error);

