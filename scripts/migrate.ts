import fs from 'fs';
import path from 'path';

interface WebflowRow {
  Nom: string;
  Slug: string;
  'Item ID': string;
  Durée: string;
  Prix: string;
  'Service-catégorie': string;
  'Bookla-id': string;
  'Service parent': string;
  Option: string;
  'is-visible': string;
}

interface OutputRow {
  Webflow_ID: string;
  Webflow_Slug: string;
  Service_Name: string;
  Bookla_ServiceID: string;
  Duration_Minutes: number;
  Price_EUR: number;
  Category_Slug: string;
  Bookla_CategoryID: string;
  Resource_Slug: string;
  Bookla_ResourceID: string;
  Capacity_Spots: number;
  Visible: string;
  Option_Extra_Slug: string;
  Option_Extra_Price: number;
  Option_Extra_Duration: number;
  Bookla_UpdatedAt: string;
  Notes_Internal: string;
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    // Handle commas inside quotes if necessary, but for now simple split
    // A better regex split for CSV:
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractOptionSlug(optionText: string): string {
  // Example: "Coupe des pointes (+10€)" -> "coupe-des-pointes"
  const name = optionText.split('(')[0].trim();
  return slugify(name);
}

async function main() {
  const inputPath = path.join(process.cwd(), 'webflow_export.csv');
  const outputPath = path.join(process.cwd(), 'twisted_database.csv');

  const content = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content) as WebflowRow[];

  const parents = new Map<string, WebflowRow>();
  const outputRows: OutputRow[] = [];

  // 1. Identify Parents
  rows.forEach(row => {
    if (!row['Service parent'] && !row['Option']) {
      parents.set(row.Slug, row);
    }
  });

  // 2. Process Rows
  rows.forEach(row => {
    const isParent = !row['Service parent'] && !row['Option'];
    let parentSlug = isParent ? row.Slug : row['Service parent'];

    // Fallback: if parent slug not found in 'Service parent' col, try to infer?
    // The export seems consistent: Options have 'Service parent' populated with Parent's Slug.
    // Exception: "Invisible locs H" options have empty Service parent.
    if (!isParent && !parentSlug) {
      // Try to find parent by name prefix
      // Name format: "Parent Name + Option Name"
      const nameParts = row.Nom.split(' + ');
      if (nameParts.length > 1) {
        const potentialParentName = nameParts[0];
        // Find parent with this name
        for (const p of parents.values()) {
          if (p.Nom === potentialParentName) {
            parentSlug = p.Slug;
            break;
          }
        }
      }
    }

    const parent = parents.get(parentSlug);

    if (!parent && !isParent) {
      console.warn(`Warning: Orphan option found: ${row.Nom} (Parent: ${parentSlug})`);
      return;
    }

    const basePrice = parent ? parseFloat(parent.Prix) : parseFloat(row.Prix);
    const baseDuration = parent ? parseInt(parent.Durée) : parseInt(row.Durée);

    const currentPrice = parseFloat(row.Prix);
    const currentDuration = parseInt(row.Durée);

    const out: OutputRow = {
      Webflow_ID: row['Item ID'],
      Webflow_Slug: parentSlug,
      Service_Name: parent ? parent.Nom : row.Nom,
      Bookla_ServiceID: row['Bookla-id'],
      Duration_Minutes: isParent ? currentDuration : baseDuration, // Parent keeps its duration
      Price_EUR: isParent ? currentPrice : basePrice, // Parent keeps its price
      Category_Slug: row['Service-catégorie'],
      Bookla_CategoryID: '',
      Resource_Slug: '',
      Bookla_ResourceID: '',
      Capacity_Spots: 1,
      Visible: row['is-visible'].toUpperCase(),
      Option_Extra_Slug: isParent ? '' : extractOptionSlug(row.Option),
      Option_Extra_Price: isParent ? 0 : (currentPrice - basePrice),
      Option_Extra_Duration: isParent ? 0 : (currentDuration - baseDuration),
      Bookla_UpdatedAt: '',
      Notes_Internal: ''
    };

    outputRows.push(out);
  });

  // 3. Write CSV
  const header = [
    'Webflow_ID', 'Webflow_Slug', 'Service_Name', 'Bookla_ServiceID',
    'Duration_Minutes', 'Price_EUR', 'Category_Slug', 'Bookla_CategoryID',
    'Resource_Slug', 'Bookla_ResourceID', 'Capacity_Spots', 'Visible',
    'Option_Extra_Slug', 'Option_Extra_Price', 'Option_Extra_Duration',
    'Bookla_UpdatedAt', 'Notes_Internal'
  ].join(',');

  const csvLines = outputRows.map(r => {
    return [
      r.Webflow_ID, r.Webflow_Slug, `"${r.Service_Name}"`, r.Bookla_ServiceID,
      r.Duration_Minutes, r.Price_EUR, r.Category_Slug, r.Bookla_CategoryID,
      r.Resource_Slug, r.Bookla_ResourceID, r.Capacity_Spots, r.Visible,
      r.Option_Extra_Slug, r.Option_Extra_Price, r.Option_Extra_Duration,
      r.Bookla_UpdatedAt, r.Notes_Internal
    ].join(',');
  });

  fs.writeFileSync(outputPath, [header, ...csvLines].join('\n'));
  console.log(`Generated ${outputRows.length} rows in twisted_database.csv`);
}

main();
