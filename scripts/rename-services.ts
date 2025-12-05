import 'dotenv/config';
import axios from 'axios';
import { google } from 'googleapis';

const DRY_RUN = process.argv.includes('--dry-run');

const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN!;
const SERVICES_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;
const BOOKLA_API_KEY = process.env.BOOKLA_API_KEY!;
const BOOKLA_COMPANY_ID = process.env.BOOKLA_COMPANY_ID!;

const webflowHeaders = {
  Authorization: `Bearer ${WEBFLOW_TOKEN}`,
  'Content-Type': 'application/json',
};

const booklaHeaders = {
  Authorization: `Bearer ${BOOKLA_API_KEY}`,
  'Content-Type': 'application/json',
};

// Types to remove from service names (case insensitive)
const TYPES_TO_REMOVE = [
  'Cornrows femmes',
  'Cornrows hommes', 
  'Cornrows',
  'Fulani',
  'Vanilles',
  'Vanille',
  'Twists',
  'Knotless',
  'Boho braids',
  'Boho',
  'Washday',
  'Tresses',
];

// Types to KEEP in the name
const TYPES_TO_KEEP = ['French curl', 'French'];

function shouldRename(serviceName: string, serviceType: string): { shouldRename: boolean; newName: string } {
  // Don't rename if type should be kept
  for (const keepType of TYPES_TO_KEEP) {
    if (serviceType.toLowerCase().includes(keepType.toLowerCase())) {
      return { shouldRename: false, newName: serviceName };
    }
  }

  // Check if name starts with a type to remove
  const nameLower = serviceName.toLowerCase();
  
  for (const typeToRemove of TYPES_TO_REMOVE) {
    const typeLower = typeToRemove.toLowerCase();
    if (nameLower.startsWith(typeLower + ' ')) {
      const newName = serviceName.substring(typeToRemove.length + 1).trim();
      // Capitalize first letter
      const capitalizedName = newName.charAt(0).toUpperCase() + newName.slice(1);
      return { shouldRename: true, newName: capitalizedName };
    }
  }

  return { shouldRename: false, newName: serviceName };
}

async function main() {
  console.log('✏️  Renommage des services...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE\n' : '🔴 LIVE MODE\n');

  // 1. Connect to Google Sheet
  console.log('📊 Lecture de Google Sheet...');
  const creds = JSON.parse(process.env.GOOGLE_CREDS || process.env.GOOGLE_CREDENTIALS_JSON || '{}');
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });

  const sheetData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A2:S',
  });
  const rows = sheetData.data.values || [];
  console.log(`   Trouvé ${rows.length} lignes\n`);

  // 2. Find services to rename
  const renames: {
    row: number;
    oldName: string;
    newName: string;
    webflowId: string;
    booklaId: string;
    isParent: boolean;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const webflowId = row[0];         // Column A
    const serviceName = row[2];       // Column C
    const booklaId = row[3];          // Column D
    const optionSlug = row[12];       // Column M
    const serviceType = row[17] || '';// Column R
    
    const isParent = !optionSlug || !optionSlug.trim();
    
    // Only check parent services for type matching
    if (isParent && serviceType) {
      const result = shouldRename(serviceName, serviceType);
      if (result.shouldRename) {
        console.log(`📝 "${serviceName}" → "${result.newName}"`);
        renames.push({
          row: i + 2,
          oldName: serviceName,
          newName: result.newName,
          webflowId,
          booklaId,
          isParent: true,
        });
        
        // Also find and rename options for this service
        const parentNameLower = serviceName.toLowerCase();
        for (let j = 0; j < rows.length; j++) {
          const optRow = rows[j];
          const optName = optRow[2];
          const optSlug = optRow[12];
          const optWebflowId = optRow[0];
          const optBooklaId = optRow[3];
          
          if (optSlug && optSlug.trim() && optName.toLowerCase().startsWith(parentNameLower + ' + ')) {
            // This is an option of this service
            const optionSuffix = optName.substring(parentNameLower.length); // " + Coupe des pointes"
            const newOptName = result.newName + optionSuffix;
            console.log(`   └─ "${optName}" → "${newOptName}"`);
            renames.push({
              row: j + 2,
              oldName: optName,
              newName: newOptName,
              webflowId: optWebflowId,
              booklaId: optBooklaId,
              isParent: false,
            });
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Total à renommer: ${renames.length} services`);
  console.log('='.repeat(50));

  if (renames.length === 0) {
    console.log('\n✅ Rien à renommer !');
    return;
  }

  if (DRY_RUN) {
    console.log('\n💡 Pour appliquer: npx ts-node scripts/rename-services.ts');
    return;
  }

  // 3. Apply renames
  console.log('\n📤 Application des changements...\n');

  for (const rename of renames) {
    console.log(`Renommage: "${rename.oldName}" → "${rename.newName}"`);

    // Update Webflow
    if (rename.webflowId) {
      try {
        await axios.patch(
          `https://api.webflow.com/v2/collections/${SERVICES_COLLECTION_ID}/items/${rename.webflowId}/live`,
          { fieldData: { name: rename.newName } },
          { headers: webflowHeaders }
        );
        console.log('   ✅ Webflow');
      } catch (e: any) {
        console.log(`   ❌ Webflow: ${e.response?.data?.message || e.message}`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Update Bookla
    if (rename.booklaId) {
      try {
        await axios.patch(
          `https://api.bookla.com/v1/companies/${BOOKLA_COMPANY_ID}/services/${rename.booklaId}`,
          { title: rename.newName },
          { headers: booklaHeaders }
        );
        console.log('   ✅ Bookla');
      } catch (e: any) {
        console.log(`   ❌ Bookla: ${e.response?.data?.message || e.message}`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Update Sheet
    try {
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `C${rename.row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[rename.newName]] },
      });
      console.log('   ✅ Sheet');
    } catch (e: any) {
      console.log(`   ❌ Sheet: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n✅ Renommage terminé !');
}

main().catch(console.error);
