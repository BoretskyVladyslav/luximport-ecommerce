/**
 * importProducts.mjs
 *
 * Reads catalog.xlsx from the project root and imports product data
 * into Sanity CMS using the Ukrainian column headers defined below.
 *
 * Column → Sanity field mapping:
 *   "Артикул"          → sku            (string)
 *   "Штрихкод"         → barcode        (string)
 *   "Повне найменування" → title         (string)
 *   "шт в ящиу"        → piecesPerBox   (number)  ⚠️  Not in schema yet – data is stored but won't show in Studio until you add the field.
 *   "Сайт"             → price          (number)  retail price
 *   "оптова"           → wholesalePrice (number)  wholesale price
 *
 * Usage:
 *   node scripts/importProducts.mjs
 *   -- or via npm --
 *   npm run import-data
 */

import { createClient } from '@sanity/client';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Setup ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_TOKEN } = process.env;

if (!NEXT_PUBLIC_SANITY_PROJECT_ID || !SANITY_API_TOKEN) {
  console.error('❌  Missing required Sanity env vars. Check NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local');
  process.exit(1);
}

const client = createClient({
  projectId : NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset   : NEXT_PUBLIC_SANITY_DATASET   || 'production',
  apiVersion: NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
  token     : SANITY_API_TOKEN,
  useCdn    : false,
});

// ─── Configuration ────────────────────────────────────────────────────────────

const EXCEL_FILE_PATH = path.resolve(__dirname, '../catalog.xlsx');

/** How many documents to send per Sanity transaction. */
const BATCH_SIZE = 50;

/**
 * Ukrainian header names as they appear in the Excel sheet.
 * `offset` handles merged-cell headers where the actual data value sits
 * one column to the RIGHT of where the header label appears (e.g. "Сайт", "оптова").
 */
const HEADER_MAP = {
  sku           : { variants: ['Артикул'],                         offset: 0 },
  barcode       : { variants: ['Штрихкод'],                        offset: 0 },
  title         : { variants: ['Повне найменування'],              offset: 0 },
  piecesPerBox  : { variants: ['шт в ящиу', 'шт в ящику'],        offset: 0 },
  price         : { variants: ['Сайт'],                            offset: 1 }, // merged cell
  wholesalePrice: { variants: ['оптова', 'Оптова'],                offset: 1 }, // merged cell
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip currency symbols, spaces and convert to a float. Returns null if not a valid number. */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const cleaned = value.toString().replace(/[^\d.,\-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extracts a weight/volume/count token from the END of a product title.
 *
 * Supported units (longest first to prevent partial matches):
 *   кг | kg | мл | ml | шт | г | g | л | l
 *
 * Number formats accepted: 165 | 1.5 | 1,5 | 0.33
 * Leading separators:  space, comma, dot, (, [
 */
function extractWeight(rawTitle) {
  const units = 'кг|мл|kg|ml|шт|г|л|g|l'; // longest first
  const num   = '[0-9]+(?:[.,][0-9]+)?';
  const re    = new RegExp(
    `(?:[\\s,.([]+)(${num}\\s*(?:${units}))\\s*[)\\]]*\\s*$`,
    'i'
  );
  const match = rawTitle.match(re);
  if (!match) return { cleanTitle: rawTitle.trim(), weight: null };
  const weight = match[1].replace(/\s+/g, '').replace(',', '.').toLowerCase();
  const tokenStart = rawTitle.lastIndexOf(match[0]);
  const cleanTitle = rawTitle.slice(0, tokenStart).trim().replace(/[.,\s]+$/, '');
  return { cleanTitle, weight };
}

/** Build a simple URL-safe slug from a Ukrainian/English string. */
function generateSlug(text) {
  const charMap = {
    'а':'a','б':'b','в':'v','г':'g','ґ':'g','д':'d','е':'e','є':'ie','ж':'zh',
    'з':'z','и':'y','і':'i','ї':'i','й':'i','к':'k','л':'l','м':'m','н':'n',
    'о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
    'ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'iu','я':'ia',
    'А':'a','Б':'b','В':'v','Г':'g','Ґ':'g','Д':'d','Е':'e','Є':'ie','Ж':'zh',
    'З':'z','И':'y','І':'i','Ї':'i','Й':'i','К':'k','Л':'l','М':'m','Н':'n',
    'О':'o','П':'p','Р':'r','С':'s','Т':'t','У':'u','Ф':'f','Х':'kh','Ц':'ts',
    'Ч':'ch','Ш':'sh','Щ':'shch','Ь':'','Ю':'iu','Я':'ia',
    'ы':'y','э':'e','ё':'yo','ъ':'',
  };
  return text
    .toString()
    .split('')
    .map(c => charMap[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/**
 * Scans `rows` (array-of-arrays) from the top, looking for the first row
 * that contains the anchor text "Артикул". Returns { headerRowIndex, COL }
 * where COL maps each Sanity field name to its resolved 0-based column index
 * (already adjusted by the field's `offset`).
 */
function detectHeaderAndColumns(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const anchorIdx = row.findIndex(
      cell => cell?.toString().trim() === 'Артикул'
    );
    if (anchorIdx === -1) continue;

    // Found the header row
    console.log(`   📌 Header row detected at row ${i + 1} (1-indexed).`);
    const COL = {};
    for (const [field, { variants, offset }] of Object.entries(HEADER_MAP)) {
      const idx = row.findIndex(cell =>
        variants.some(v => cell?.toString().trim().toLowerCase() === v.toLowerCase())
      );
      if (idx === -1) {
        console.warn(`   ⚠️  Header not found for "${field}" (looked for: ${variants.join(', ')}). Skipped.`);
      } else {
        COL[field] = idx + offset;
        const label = offset > 0 ? `${row[idx]} +${offset} (merged)` : row[idx];
        console.log(`   ✔ "${field}" → column ${COL[field]} ["${label}"]`);
      }
    }
    return { headerRowIndex: i, COL };
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n📂  Reading Excel file: ${EXCEL_FILE_PATH}`);

  let workbook;
  try {
    workbook = XLSX.readFile(EXCEL_FILE_PATH, { cellDates: true });
  } catch (err) {
    console.error(`❌  Could not read Excel file: ${err.message}`);
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  console.log(`📄  First sheet: "${sheetName}"`);

  const worksheet = workbook.Sheets[sheetName];
  // header: 1 → returns array-of-arrays; defval: '' avoids undefined cells
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length < 2) {
    console.error('❌  The worksheet appears to be empty or has only a header row.');
    process.exit(1);
  }

  // ── Resolve column positions from header row ──────────────────────────────
  console.log('\n🔍  Scanning for header row and column positions…');
  const detected = detectHeaderAndColumns(rows);
  if (!detected) {
    console.error('❌  Could not find the header row (no row containing "Артикул"). Aborting.');
    process.exit(1);
  }
  const { headerRowIndex, COL } = detected;

  if (COL.title === undefined) {
    console.error('❌  Could not find the title column ("Повне найменування"). Aborting.');
    process.exit(1);
  }

  // ── Parse data rows ───────────────────────────────────────────────────────
  const dataRows = rows.slice(headerRowIndex + 1); // everything after the header
  const products = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row       = dataRows[i];
    const rowNumber = headerRowIndex + 2 + i; // actual Excel row number

    const titleRaw = row[COL.title];
    if (!titleRaw || titleRaw.toString().trim() === '') {
      // Likely a blank or category separator row — skip silently
      continue;
    }

    const rawTitle     = titleRaw.toString().trim();
    const { cleanTitle: title, weight } = extractWeight(rawTitle);

    const skuRaw       = COL.sku            !== undefined ? row[COL.sku]            : undefined;
    const barcodeRaw   = COL.barcode        !== undefined ? row[COL.barcode]        : undefined;
    const priceRaw     = COL.price          !== undefined ? row[COL.price]          : undefined;
    const wPriceRaw    = COL.wholesalePrice !== undefined ? row[COL.wholesalePrice] : undefined;
    const pcsRaw       = COL.piecesPerBox   !== undefined ? row[COL.piecesPerBox]   : undefined;

    const sku            = skuRaw     ? skuRaw.toString().trim()     : `LUX-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    const barcode        = barcodeRaw ? barcodeRaw.toString().trim() : undefined;
    const price          = toNumber(priceRaw);
    const wholesalePrice = toNumber(wPriceRaw);
    const piecesPerBox   = toNumber(pcsRaw);
    const slug           = generateSlug(title);

    const doc = {
      _type : 'product',
      title,
      slug  : { _type: 'slug', current: slug || `imported-${Date.now()}` },
      sku,
      ...(barcode                              && { barcode }),
      ...(price          !== null              && { price }),
      ...(wholesalePrice !== null              && { wholesalePrice }),
      ...(piecesPerBox   !== null && piecesPerBox > 0 && { piecesPerBox }),
      ...(weight                               && { weight }),
    };

    products.push({ doc, rowNumber });
  }

  console.log(`\n📊  Parsed ${products.length} product row(s) from Excel.`);

  if (products.length === 0) {
    console.log('ℹ️   Nothing to import. Exiting.');
    return;
  }

  // ── Pre-fetch existing products from Sanity for deduplication ─────────────
  console.log('\n🔎  Fetching existing Sanity products for duplicate detection…');
  let existingProducts = [];
  try {
    existingProducts = await client.fetch(
      `*[_type == "product"]{ _id, sku, barcode }`,
      {},
      { cache: 'no-store' }
    );
  } catch (err) {
    console.warn(`⚠️  Could not fetch existing products: ${err.message}. Will create all as new.`);
  }

  const skuMap     = new Map();
  const barcodeMap = new Map();
  for (const p of existingProducts) {
    if (p.sku)     skuMap.set(p.sku.trim(),         p._id);
    if (p.barcode) barcodeMap.set(p.barcode.trim(), p._id);
  }
  console.log(`   📂  ${existingProducts.length} existing product(s) loaded.`);

  // ── Classify rows: CREATE vs UPDATE ───────────────────────────────
  const toCreate = [];
  const toUpdate = [];
  for (const item of products) {
    const { doc } = item;
    const existingId =
      (doc.sku     && skuMap.get(doc.sku))         ??
      (doc.barcode && barcodeMap.get(doc.barcode)) ??
      null;
    if (existingId) toUpdate.push({ existingId, ...item });
    else            toCreate.push(item);
  }
  console.log(`\n📊  ${toCreate.length} to CREATE  |  ${toUpdate.length} to UPDATE (patch)\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount   = 0;

  // ── CREATES: batched transactions ──────────────────────────────────
  if (toCreate.length > 0) {
    const totalBatches = Math.ceil(toCreate.length / BATCH_SIZE);
    console.log(`🚀  Creating ${toCreate.length} new product(s) in ${totalBatches} batch(es)…\n`);
    for (let b = 0; b < totalBatches; b++) {
      const start = b * BATCH_SIZE;
      const chunk = toCreate.slice(start, Math.min(start + BATCH_SIZE, toCreate.length));
      console.log(`   Batch ${b + 1}/${totalBatches}: rows ${chunk[0].rowNumber}–${chunk[chunk.length - 1].rowNumber}`);
      const tx = client.transaction();
      for (const { doc } of chunk) tx.create(doc);
      try {
        const result = await tx.commit();
        const n = result.results?.length ?? chunk.length;
        createdCount += n;
        console.log(`   ✅  Batch ${b + 1} committed — ${n} created.`);
      } catch (err) {
        console.error(`   ❌  Create batch ${b + 1} failed: ${err.message}`);
        console.log(`      ↩️  Retrying row-by-row…`);
        for (const { doc, rowNumber } of chunk) {
          try   { const r = await client.create(doc); console.log(`      ✔ Row ${rowNumber}: ${r._id}`); createdCount++; }
          catch (e) { console.error(`      ✘ Row ${rowNumber}: ${e.message}`); errorCount++; }
        }
      }
    }
  }

  // ── UPDATES: individual patches ───────────────────────────────────
  if (toUpdate.length > 0) {
    console.log(`\n🛠️  Patching ${toUpdate.length} existing product(s)…\n`);
    for (const { existingId, doc, rowNumber } of toUpdate) {
      const setFields = {
        title: doc.title,
        sku:   doc.sku,
        ...(doc.slug           && { slug: doc.slug }),
        ...(doc.price          != null && { price:          doc.price }),
        ...(doc.wholesalePrice != null && { wholesalePrice: doc.wholesalePrice }),
        ...(doc.piecesPerBox   != null && { piecesPerBox:   doc.piecesPerBox }),
        ...(doc.weight         && { weight:   doc.weight }),
        ...(doc.barcode        && { barcode:  doc.barcode }),
      };
      const unsetFields = [
        ...(!doc.weight         ? ['weight']         : []),
        ...(!doc.wholesalePrice ? ['wholesalePrice'] : []),
        ...(!doc.piecesPerBox   ? ['piecesPerBox']   : []),
      ];
      try {
        const patch = client.patch(existingId).set(setFields);
        if (unsetFields.length) patch.unset(unsetFields);
        await patch.commit();
        console.log(`   ✏️  Row ${rowNumber}: patched ${existingId} (SKU ${doc.sku})`);
        updatedCount++;
      } catch (err) {
        console.error(`   ❌  Row ${rowNumber}: patch failed for ${existingId}: ${err.message}`);
        errorCount++;
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════');
  console.log('         IMPORT SUMMARY           ');
  console.log('══════════════════════════════════');
  console.log(`  ➕  Created : ${createdCount}`);
  console.log(`  ✏️   Updated : ${updatedCount}`);
  console.log(`  ❌  Errors  : ${errorCount}`);
  console.log(`  📦  Total   : ${products.length}`);
  console.log('══════════════════════════════════\n');
}

run().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
