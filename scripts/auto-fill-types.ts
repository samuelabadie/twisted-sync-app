import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

// Mapping rules: keyword in name/slug -> service type
const TYPE_RULES: { match: (name: string, slug: string, category: string) => boolean; type: string }[] = [
  // Exact matches first
  { match: (n, s) => s.includes('boho-braids'), type: 'Boho braids' },
  { match: (n, s) => s.includes('french-curl'), type: 'French curl' },
  { match: (n, s) => s.includes('knotless'), type: 'Knotless' },
  { match: (n, s) => s.includes('fulani'), type: 'Fulani' },
  { match: (n, s) => s.includes('washday'), type: 'Washday' },
  
  // Vanilles
  { match: (n, s) => s.includes('vanille') || n.toLowerCase().includes('vanille'), type: 'Vanilles' },
  
  // Twists (barrel twist, invisible locs = twist style)
  { match: (n, s) => s.includes('barrel-twist'), type: 'Twists' },
  { match: (n, s) => s.includes('invisible-locs') && !s.includes('-h'), type: 'Twists' },
  { match: (n, s) => s.includes('invisible-locs-h'), type: 'Twists' },
  
  // Tresses (generic braids)
  { match: (n, s) => s.includes('star-braids'), type: 'Tresses' },
  
  // Cornrows hommes - check for "H" suffix or "hommes" category
  { match: (n, s, c) => c === 'hommes' || s.includes('-h') || n.includes(' H ') || n.endsWith(' H'), type: 'Cornrows hommes' },
  { match: (n, s) => s.includes('asap-rocky'), type: 'Cornrows hommes' },
  { match: (n, s) => s.includes('travis-scott'), type: 'Cornrows hommes' },
  { match: (n, s) => s.includes('pop-smoke'), type: 'Cornrows hommes' },
  { match: (n, s) => s.includes('flame'), type: 'Cornrows hommes' },
  { match: (n, s) => s.includes('hit-the-road'), type: 'Cornrows hommes' },
  
  // Cornrows femmes - the rest of cornrows/stitch
  { match: (n, s, c) => s.includes('cornrows') && c !== 'hommes', type: 'Cornrows femmes' },
  { match: (n, s) => s.includes('stitch-braids'), type: 'Cornrows femmes' },
];

function getServiceType(name: string, slug: string, category: string): string | null {
  for (const rule of TYPE_RULES) {
    if (rule.match(name, slug, category)) {
      return rule.type;
    }
  }
  return null;
}

async function main() {
  console.log('🤖 Auto-remplissage des types de service...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE\n' : '🔴 LIVE MODE\n');

  // Read CSV file
  const csvPath = path.join(__dirname, '..', 'twisted_database.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  const headerCols = lines[0].split(',');
  const serviceTypeCol = headerCols.indexOf('Service_Type');
  
  if (serviceTypeCol === -1) {
    console.error('❌ Colonne Service_Type non trouvée !');
    return;
  }

  const newLines: string[] = [lines[0]];
  let filled = 0;
  let skipped = 0;
  let unknown = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(',');
    const slug = cols[1]?.trim();
    const serviceName = cols[2]?.replace(/"/g, '');
    const category = cols[6]?.trim() || '';
    const optionSlug = cols[12]?.trim();
    const existingType = cols[serviceTypeCol]?.trim();

    // Skip options
    if (optionSlug) {
      newLines.push(line);
      skipped++;
      continue;
    }

    // Skip if already has a type
    if (existingType) {
      console.log(`⏭️  "${serviceName}" → déjà: ${existingType}`);
      newLines.push(line);
      skipped++;
      continue;
    }

    // Try to match
    const serviceType = getServiceType(serviceName, slug, category);

    if (serviceType) {
      console.log(`✅ "${serviceName}" → ${serviceType}`);
      cols[serviceTypeCol] = serviceType;
      newLines.push(cols.join(','));
      filled++;
    } else {
      console.log(`❓ "${serviceName}" → type inconnu`);
      newLines.push(line);
      unknown++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé:');
  console.log(`   ✅ Remplis: ${filled}`);
  console.log(`   ⏭️  Ignorés (options/déjà remplis): ${skipped}`);
  console.log(`   ❓ Inconnus: ${unknown}`);
  console.log('='.repeat(50));

  if (!DRY_RUN) {
    fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
    console.log('\n✅ CSV mis à jour !');
  } else if (filled > 0) {
    console.log('\n💡 Pour appliquer: npx ts-node scripts/auto-fill-types.ts');
  }
}

main().catch(console.error);
