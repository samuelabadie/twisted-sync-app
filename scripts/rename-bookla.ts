import 'dotenv/config';
import axios from 'axios';
import { google } from 'googleapis';

const DRY_RUN = process.argv.includes('--dry-run');

const BOOKLA_API_KEY = process.env.BOOKLA_API_KEY!;
const BOOKLA_COMPANY_ID = process.env.BOOKLA_COMPANY_ID!;

const booklaClient = axios.create({
  baseURL: 'https://eu.bookla.com/api/v1',
  headers: {
    'x-api-key': BOOKLA_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Mapping old names to new names (from Sheet)
async function main() {
  console.log('✏️  Renommage des services sur Bookla...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE\n' : '🔴 LIVE MODE\n');

  // Read Google Sheet to get booklaId -> newName mapping
  console.log('📊 Lecture de Google Sheet...');
  const creds = JSON.parse(process.env.GOOGLE_CREDS || process.env.GOOGLE_CREDENTIALS_JSON || '{}');
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });

  const sheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:S',
  });
  const rows = sheetData.data.values || [];

  // Build booklaId -> name mapping from Sheet (which has the new names)
  const sheetNames = new Map<string, string>();
  for (const row of rows) {
    const booklaId = row[3];
    const name = row[2];
    if (booklaId && name) {
      sheetNames.set(booklaId, name);
    }
  }
  console.log(`   ${sheetNames.size} services dans le Sheet\n`);

  // Fetch all services from Bookla
  console.log('📥 Récupération des services Bookla...');
  const res = await booklaClient.get(`/companies/${BOOKLA_COMPANY_ID}/services`);
  const booklaServices = res.data.data || res.data || [];
  console.log(`   ${booklaServices.length} services sur Bookla\n`);

  // Find services to rename
  const toRename: { id: string; oldName: string; newName: string }[] = [];

  for (const svc of booklaServices) {
    const booklaId = svc.id;
    const currentName = svc.title || svc.name;
    const sheetName = sheetNames.get(booklaId);

    if (sheetName && sheetName !== currentName) {
      console.log(`📝 "${currentName}" → "${sheetName}"`);
      toRename.push({ id: booklaId, oldName: currentName, newName: sheetName });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Total à renommer: ${toRename.length}`);
  console.log('='.repeat(50));

  if (toRename.length === 0) {
    console.log('\n✅ Rien à renommer !');
    return;
  }

  if (DRY_RUN) {
    console.log('\n💡 Pour appliquer: npx ts-node scripts/rename-bookla.ts');
    return;
  }

  // Apply renames
  console.log('\n📤 Application...\n');
  let success = 0;
  let errors = 0;

  for (const item of toRename) {
    try {
      await booklaClient.patch(
        `/companies/${BOOKLA_COMPANY_ID}/services/${item.id}`,
        { title: item.newName }
      );
      console.log(`✅ "${item.newName}"`);
      success++;
    } catch (e: any) {
      console.log(`❌ "${item.oldName}": ${e.response?.data?.message || e.message}`);
      errors++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Terminé ! ${success} OK, ${errors} erreurs`);
}

main().catch(console.error);
