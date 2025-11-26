import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import { BooklaClient } from '../src/lib/bookla';
import axios from 'axios';

const token = process.env.WEBFLOW_API_TOKEN!;
const collectionId = process.env.WEBFLOW_COLLECTION_ID!;

const webflowApi = axios.create({
  baseURL: 'https://api.webflow.com/v2',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function deleteWebflowItem(itemId: string): Promise<boolean> {
  try {
    await webflowApi.delete(`/collections/${collectionId}/items/${itemId}`);
    return true;
  } catch (err: any) {
    if (err.response?.status === 404) return true; // Already deleted
    if (err.response?.status === 409) return false; // Referenced by another item
    throw err;
  }
}

async function run() {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.log('Usage: npx ts-node scripts/delete-service.ts "Nom du service"');
    console.log('Exemple: npx ts-node scripts/delete-service.ts "Mega Test"');
    process.exit(1);
  }

  console.log(`\n🗑️  Suppression du service "${serviceName}" et ses options\n`);

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const creds = JSON.parse(process.env.GOOGLE_CREDS!);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });
  const bookla = new BooklaClient(process.env.BOOKLA_API_KEY!, process.env.BOOKLA_COMPANY_ID!);

  const baseSlug = toSlug(serviceName);

  // 1. Find all related services in Sheet (parent + options)
  console.log('📊 Recherche dans le Sheet...');
  const sheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:Q',
  });
  const rows = sheetData.data.values || [];

  // Find rows that match:
  // - Exact name match (parent)
  // - Name starts with "ServiceName + " (options)
  // - Slug matches or starts with baseSlug
  const matchingRows: { rowIndex: number; data: any[] }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowName = row[2]?.toLowerCase() || '';
    const rowSlug = row[1]?.toLowerCase() || '';

    const isParent = rowName === serviceName.toLowerCase() || rowSlug === baseSlug;
    const isOption = rowName.startsWith(serviceName.toLowerCase() + ' + ') || 
                     rowSlug.startsWith(baseSlug + '-');

    if (isParent || isOption) {
      matchingRows.push({ rowIndex: i + 2, data: row }); // +2 because of header and 0-index
    }
  }

  if (matchingRows.length === 0) {
    console.log(`\n❌ Service "${serviceName}" non trouvé dans le Sheet.`);
    process.exit(1);
  }

  // Save Bookla IDs before any deletion (these are our stable identifiers)
  const booklaIdsToDelete = new Set(
    matchingRows.map(r => r.data[3]).filter(Boolean)
  );

  console.log(`   → ${matchingRows.length} service(s) trouvé(s):\n`);
  matchingRows.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.data[2]} (ligne ${r.rowIndex})`);
    console.log(`      Bookla: ${r.data[3] || '(aucun)'}`);
    console.log(`      Webflow: ${r.data[0] || '(aucun)'}`);
  });

  // 2. Delete from Webflow (options first, then parent to avoid reference conflicts)
  console.log('\n📦 Suppression de Webflow...');
  
  // Sort: options first (those with longer names), parent last
  const sortedForWebflow = [...matchingRows].sort((a, b) => {
    const aIsParent = a.data[2]?.toLowerCase() === serviceName.toLowerCase();
    const bIsParent = b.data[2]?.toLowerCase() === serviceName.toLowerCase();
    if (aIsParent && !bIsParent) return 1; // a (parent) goes last
    if (!aIsParent && bIsParent) return -1; // b (parent) goes last
    return 0;
  });

  for (const row of sortedForWebflow) {
    const webflowId = row.data[0];
    if (webflowId) {
      try {
        const deleted = await deleteWebflowItem(webflowId);
        if (deleted) {
          console.log(`   ✅ Supprimé: ${row.data[2]}`);
        } else {
          console.log(`   ⚠️  Impossible de supprimer (référencé): ${row.data[2]}`);
        }
      } catch (err: any) {
        console.log(`   ❌ Erreur: ${row.data[2]} - ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 300)); // Rate limit
    } else {
      console.log(`   ⏭️  Pas de Webflow ID: ${row.data[2]}`);
    }
  }

  // 3. Delete from Bookla
  console.log('\n🗓️  Suppression de Bookla...');
  for (const row of matchingRows) {
    const booklaId = row.data[3];
    if (booklaId) {
      try {
        await bookla.deleteService(booklaId);
        console.log(`   ✅ Supprimé: ${row.data[2]}`);
      } catch (err: any) {
        console.log(`   ❌ Erreur: ${row.data[2]} - ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 300)); // Rate limit
    } else {
      console.log(`   ⏭️  Pas de Bookla ID: ${row.data[2]}`);
    }
  }

  // 4. Delete rows from Sheet (re-read to get fresh row indices, then delete by Bookla ID)
  console.log('\n📊 Suppression du Sheet...');
  
  // Get the actual sheet ID (gid) of the first sheet
  const spreadsheet = await sheetsApi.spreadsheets.get({
    spreadsheetId: sheetId,
  });
  const firstSheet = spreadsheet.data.sheets?.[0];
  const actualSheetId = firstSheet?.properties?.sheetId ?? 0;
  
  // Re-read the sheet to get fresh row indices
  const freshSheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:Q',
  });
  const freshRows = freshSheetData.data.values || [];
  
  // Find rows to delete by Bookla ID
  const rowsToDelete: number[] = [];
  for (let i = 0; i < freshRows.length; i++) {
    const booklaId = freshRows[i][3]; // Column D = Bookla ID
    if (booklaId && booklaIdsToDelete.has(booklaId)) {
      rowsToDelete.push(i + 2); // +2 for header and 0-index
    }
  }
  
  console.log(`   → ${rowsToDelete.length} ligne(s) à supprimer (par Bookla ID)`);
  
  // Delete from bottom to top to avoid index shifting
  const sortedRowsDesc = rowsToDelete.sort((a, b) => b - a);
  
  for (const rowIndex of sortedRowsDesc) {
    try {
      await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: actualSheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              }
            }
          }]
        }
      });
      console.log(`   ✅ Ligne ${rowIndex} supprimée`);
    } catch (err: any) {
      console.log(`   ❌ Erreur ligne ${rowIndex}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 200)); // Rate limit
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUPPRESSION TERMINÉE');
  console.log('='.repeat(60));
  console.log(`\n   Service: ${serviceName}`);
  console.log(`   Total supprimé: ${matchingRows.length} service(s)\n`);
}

run().catch(console.error);

