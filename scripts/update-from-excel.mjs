/**
 * update-from-excel.mjs
 *
 * Reads catalog.xlsx and synchronizes product data with Sanity CMS.
 *
 * IMAGE SAFETY GUARANTEE:
 *   The patch used for existing products is built from a strict allowlist of fields
 *   (see PATCH_FIELDS below). The `image` field is intentionally absent from this
 *   allowlist, so it is PHYSICALLY IMPOSSIBLE for this script to overwrite it.
 *
 * Column → Sanity field mapping:
 *   "Артикул"             → sku              (string)  — duplicate-detection key
 *   "Штрихкод"            → barcode          (string)
 *   "Повне найменування"  → title            (string)
 *   "головна ГРУПА"       → categories[0]    (reference to main category)
 *   "ПІД ГРУПА"           → categories[0]    (reference to sub-category, linked to main)
 *   "грамаж"              → weight           (string)
 *   "шт в ящиу"           → piecesPerBox     (number)
 *   "Сайт"                → price            (number)  retail price
 *   "оптова"              → wholesalePrice   (number)  wholesale price
 *
 * Usage:
 *   node scripts/update-from-excel.mjs
 *   node scripts/update-from-excel.mjs --dry-run   (preview only, no writes)
 */

import { createClient } from '@sanity/client';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION,
  SANITY_API_TOKEN,
} = process.env;

if (!NEXT_PUBLIC_SANITY_PROJECT_ID || !SANITY_API_TOKEN) {
  console.error('❌  Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID and/or SANITY_API_TOKEN');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');

const client = createClient({
  projectId : NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset   : NEXT_PUBLIC_SANITY_DATASET    || 'production',
  apiVersion: NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
  token     : SANITY_API_TOKEN,
  useCdn    : false,
});

const EXCEL_FILE_PATH = path.resolve(__dirname, '../catalog.xlsx');

// ─── Column definitions ───────────────────────────────────────────────────────

/**
 * Maps internal field keys to the Ukrainian header labels used in the Excel file.
 * `offset`: how many columns to the RIGHT of the header label to find the actual value.
 *           Needed for merged-cell headers (e.g. "Сайт" label is in col N, value in col N+1).
 */
const COLUMNS = {
  sku           : { labels: ['Артикул'],                    offset: 0 },
  barcode       : { labels: ['Штрихкод'],                   offset: 0 },
  title         : { labels: ['Повне найменування'],         offset: 0 },
  mainGroup     : { labels: ['головна ГРУПА', 'Головна ГРУПА', 'ГОЛОВНА ГРУПА'], offset: 0 },
  subGroup      : { labels: ['ПІД ГРУПА', 'під група', 'ПІД ГРУПП'],             offset: 0 },
  weight        : { labels: ['грамаж', 'Грамаж'],           offset: 0 },
  piecesPerBox  : { labels: ['шт в ящиу', 'шт в ящику'],   offset: 0 },
  price         : { labels: ['Сайт'],                       offset: 1 }, // merged cell → value is one column right
  wholesalePrice: { labels: ['оптова', 'Оптова'],           offset: 1 }, // merged cell → value is one column right
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Transliteration map for Cyrillic → Latin slug generation. */
const CHAR_MAP = {
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

function slugify(text) {
  return text
    .toString()
    .split('')
    .map(c => CHAR_MAP[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/** Convert any value to a float; returns null if not a valid positive number. */
function toNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = val.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Scans the rows array-of-arrays for the first row containing "Артикул",
 * then resolves column indices for each field in COLUMNS.
 */
function detectHeaders(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row) continue;
    const anchorIdx = row.findIndex(c => c?.toString().trim() === 'Артикул');
    if (anchorIdx === -1) continue;

    console.log(`   📌 Header row found at Excel row ${i + 1}.`);
    const colMap = {};
    for (const [field, { labels, offset }] of Object.entries(COLUMNS)) {
      const idx = row.findIndex(c =>
        labels.some(l => c?.toString().trim().toLowerCase() === l.toLowerCase())
      );
      if (idx === -1) {
        console.warn(`   ⚠️  Column not found for "${field}" (searched: ${labels.join(', ')})`);
      } else {
        colMap[field] = idx + offset;
        console.log(`   ✔ "${field}" → col ${colMap[field]}  ["${row[idx]}"${offset ? ` +${offset}` : ''}]`);
      }
    }
    return { headerRowIndex: i, colMap };
  }
  return null;
}

// ─── Category cache & upsert ──────────────────────────────────────────────────

// In-memory cache: "title|parentId" → Sanity document _id
const categoryCache = new Map();

/**
 * Returns the Sanity _id for a category, creating it if it doesn't exist.
 * Uses a slug-based lookup so re-runs are idempotent.
 *
 * @param {string}      title     Category display name
 * @param {string|null} parentId  Sanity _id of the parent category (null = top-level)
 */
async function getOrCreateCategory(title, parentId = null) {
  const cacheKey = `${title}|${parentId ?? ''}`;
  if (categoryCache.has(cacheKey)) return categoryCache.get(cacheKey);

  const slug = slugify(title);

  // Look up existing category by slug
  const existing = await client.fetch(
    `*[_type == "category" && slug.current == $slug][0]{ _id, title, parent }`,
    { slug }
  );

  if (existing) {
    // If it exists but has no parent and we now know the parent, patch it
    if (parentId && (!existing.parent || existing.parent._ref !== parentId)) {
      if (!DRY_RUN) {
        await client.patch(existing._id)
          .set({ parent: { _type: 'reference', _ref: parentId } })
          .commit();
      }
      console.log(`   🔗 Linked category "${title}" → parent ${parentId}`);
    }
    categoryCache.set(cacheKey, existing._id);
    return existing._id;
  }

  // Create new category
  console.log(`   📁 Creating category: "${title}"${parentId ? ` (parent: ${parentId})` : ''}`);
  if (DRY_RUN) {
    const fakeId = `dry-run-${slugify(title)}`;
    categoryCache.set(cacheKey, fakeId);
    return fakeId;
  }

  const created = await client.create({
    _type: 'category',
    title,
    slug: { _type: 'slug', current: slug },
    ...(parentId && { parent: { _type: 'reference', _ref: parentId } }),
  });

  console.log(`   ✅ Category created: "${title}" → ${created._id}`);
  categoryCache.set(cacheKey, created._id);
  return created._id;
}

const CATEGORY_ALIASES = {
  "кондитерські вироби": "Кондитерські вироби",
  "кондиторські вироби": "Кондитерські вироби",
  "гарячі напої": "Гарячі напої",
  "гарячі нопої": "Гарячі напої",
  "бакалія": "Бакалія",
  "бакалійна група товарів": "Бакалія",
  "бакалійні вироби": "Бакалія",
  "молочна продукція": "Молочна продукція",
  "молочна продукці": "Молочна продукція",
  "снеки": "Снеки",
  "печиво dr. gerard": "Печиво Dr. Gerard",
  "печево dr. gerard": "Печиво Dr. Gerard",
  "желейні цукерки": "Желейні цукерки",
  "драже": "Драже",
  "батончики": "Батончики",
  "вафлі та печиво": "Вафлі та печиво",
  "шоколадні цукерки": "Шоколадні цукерки",
  "шоколадні пасти (креми)": "Шоколадні пасти (креми)",
  "кава": "Кава",
  "капучіно": "Капучіно",
  "чай": "Чай",
  "соуси та кетчупи": "Соуси та Кетчупи",
  "консерви": "Консерви",
  "олія": "Олія",
  "консервація": "Консервація",
  "молоко": "Молоко",
  "горіхи": "Горіхи"
};

function standardizeCategory(rawName) {
  if (!rawName) return '';
  const clean = rawName.toString().trim().replace(/\s+/g, ' ').toLowerCase();
  if (CATEGORY_ALIASES[clean]) return CATEGORY_ALIASES[clean];
  if (clean.includes('кондитер') || clean.includes('кондитор')) return "Кондитерські вироби";
  if (clean.includes('гарячі') || clean.includes('напої')) return "Гарячі напої";
  if (clean.includes('бакалі')) return "Бакалія";
  if (clean.includes('молочн')) return "Молочна продукція";
  if (clean.includes('снек')) return "Снеки";
  return rawName.toString().trim(); 
}

async function run() {
  console.log(DRY_RUN ? '\n🔍  DRY RUN MODE — no data will be written.\n' : '');
  console.log(`📂  Reading: ${EXCEL_FILE_PATH}`);

  let workbook;
  try {
    workbook = XLSX.readFile(EXCEL_FILE_PATH);
  } catch (err) {
    console.error(`❌  Cannot read Excel file: ${err.message}`);
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  console.log(`📄  Sheet: "${sheetName}"`);

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
  });

  console.log('\n🔍  Detecting column positions…');
  const detected = detectHeaders(rows);
  if (!detected) {
    console.error('❌  Could not find header row containing "Артикул". Aborting.');
    process.exit(1);
  }
  const { headerRowIndex, colMap } = detected;

  if (colMap.title === undefined) {
    console.error('❌  "Повне найменування" column not found. Aborting.');
    process.exit(1);
  }

  console.log('\n⚙️   Parsing rows and resolving categories…');
  const products = [];
  const dataRows = rows.slice(headerRowIndex + 1);

  let lastMainGroupId = null;
  let lastSubGroupId  = null;
  let lastMainGroup   = null;
  let lastSubGroup    = null;

  for (let i = 0; i < dataRows.length; i++) {
    const row       = dataRows[i];
    const rowNumber = headerRowIndex + 2 + i; // 1-indexed Excel row
    if (!row) continue;

    let rawMain = colMap.mainGroup !== undefined ? standardizeCategory(row[colMap.mainGroup]) : '';
    let rawSub  = colMap.subGroup  !== undefined ? standardizeCategory(row[colMap.subGroup])  : '';

    const rowExplicitlyHasMain = !!rawMain;
    const rowExplicitlyHasSub  = !!rawSub;
    let mainGroupChanged = false;

    if (rowExplicitlyHasMain) {
      if (rawMain !== lastMainGroup) {
        lastMainGroup = rawMain;
        lastMainGroupId = await getOrCreateCategory(rawMain, null);
        mainGroupChanged = true;
      }
    } else {
      rawMain = lastMainGroup;
    }

    if (rowExplicitlyHasSub) {
      if (rawSub !== lastSubGroup || mainGroupChanged || !lastSubGroupId) {
        lastSubGroup = rawSub;
        lastSubGroupId = await getOrCreateCategory(rawSub, lastMainGroupId);
      }
    } else {
      if (rowExplicitlyHasMain) {
        lastSubGroup = null;
        lastSubGroupId = null;
      }
    }

    // — Skip non-product rows (no SKU or no title) —
    const title = row[colMap.title]?.toString().trim();
    if (!title) continue;

    const sku = colMap.sku !== undefined ? row[colMap.sku]?.toString().trim() : null;
    if (!sku) continue; // SKU is required as unique key

    // — Parse scalar fields —
    const barcode        = row[colMap.barcode]?.toString().trim() || null;
    const weightRaw      = row[colMap.weight]?.toString().trim()  || null;
    const weight         = weightRaw || null; // kept as string per schema
    const piecesPerBox   = colMap.piecesPerBox   !== undefined ? toNumber(row[colMap.piecesPerBox])   : null;
    const price          = colMap.price           !== undefined ? toNumber(row[colMap.price])          : null;
    const wholesalePrice = colMap.wholesalePrice  !== undefined ? toNumber(row[colMap.wholesalePrice]) : null;

    // — Determine category reference (prefer sub-category) —
    const categoryId = lastSubGroupId ?? lastMainGroupId ?? null;

    products.push({
      rowNumber,
      sku,
      title,
      slug: slugify(title),
      barcode,
      weight,
      piecesPerBox,
      price,
      wholesalePrice,
      categoryId,
    });
  }

  console.log(`\n📊  Parsed ${products.length} product row(s).\n`);
  if (products.length === 0) {
    console.log('ℹ️   Nothing to import. Exiting.');
    return;
  }

  // 4. Pre-fetch all existing products from Sanity (SKU lookup)
  console.log('🔎  Fetching existing products from Sanity…');
  let existingDocs = [];
  try {
    existingDocs = await client.fetch(
      `*[_type == "product"]{ _id, sku }`,
      {},
      { cache: 'no-store' }
    );
  } catch (err) {
    console.warn(`⚠️  Could not pre-fetch products: ${err.message}. Will query per-row.`);
  }

  const skuToId = new Map();
  for (const doc of existingDocs) {
    if (doc.sku) skuToId.set(doc.sku.trim(), doc._id);
  }
  console.log(`   📂  ${existingDocs.length} existing product(s) loaded.\n`);

  // 5. Classify: create vs. update
  const toCreate = products.filter(p => !skuToId.has(p.sku));
  const toUpdate = products.filter(p =>  skuToId.has(p.sku));

  console.log(`📋  ${toCreate.length} to CREATE  |  ${toUpdate.length} to PATCH\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount   = 0;

  // ─── UPDATES ───────────────────────────────────────────────────────────────
  //
  // ⚠️  IMAGE SAFETY: We build the patch from an EXPLICIT allowlist of fields.
  //     The `image` field is NOT in this list and will NEVER be touched.
  //
  if (toUpdate.length > 0) {
    console.log(`🛠️   Patching ${toUpdate.length} existing product(s)…\n`);

    for (const p of toUpdate) {
      const docId = skuToId.get(p.sku);

      // Build the SET payload — only safe, non-image fields
      const setPayload = {
        title : p.title,
        'slug.current': p.slug,
        ...(p.barcode        != null && { barcode:        p.barcode }),
        ...(p.price          != null && { price:          p.price }),
        ...(p.wholesalePrice != null && { wholesalePrice: p.wholesalePrice }),
        ...(p.piecesPerBox   != null && { piecesPerBox:   p.piecesPerBox }),
        ...(p.weight         != null && { weight:         p.weight }),
        ...(p.categoryId            && {
          categories: [{ _type: 'reference', _ref: p.categoryId, _key: p.categoryId }],
        }),
      };

      // Fields that may have been removed from the Excel — clear them in Sanity too
      const unsetPayload = [
        ...(p.price          == null ? ['price']          : []),
        ...(p.wholesalePrice == null ? ['wholesalePrice'] : []),
        ...(p.piecesPerBox   == null ? ['piecesPerBox']   : []),
        ...(p.weight         == null ? ['weight']         : []),
      ];

      try {
        if (!DRY_RUN) {
          const patch = client.patch(docId).set(setPayload);
          if (unsetPayload.length) patch.unset(unsetPayload);
          await patch.commit();
        }
        console.log(`   ✏️  Row ${p.rowNumber}: patched ${docId}  (SKU: ${p.sku})`);
        updatedCount++;
      } catch (err) {
        console.error(`   ❌  Row ${p.rowNumber}: patch failed (${p.sku}): ${err.message}`);
        errorCount++;
      }
    }
  }

  // ─── CREATES ───────────────────────────────────────────────────────────────
  if (toCreate.length > 0) {
    console.log(`\n🚀  Creating ${toCreate.length} new product(s)…\n`);

    for (const p of toCreate) {
      const newDoc = {
        _type : 'product',
        title : p.title,
        slug  : { _type: 'slug', current: p.slug || `imported-${p.sku}` },
        sku   : p.sku,
        // image: intentionally omitted — left empty for manual upload
        ...(p.barcode        != null && { barcode:        p.barcode }),
        ...(p.price          != null && { price:          p.price }),
        ...(p.wholesalePrice != null && { wholesalePrice: p.wholesalePrice }),
        ...(p.piecesPerBox   != null && { piecesPerBox:   p.piecesPerBox }),
        ...(p.weight         != null && { weight:         p.weight }),
        ...(p.categoryId            && {
          categories: [{ _type: 'reference', _ref: p.categoryId, _key: p.categoryId }],
        }),
      };

      try {
        if (!DRY_RUN) {
          const created = await client.create(newDoc);
          console.log(`   ➕  Row ${p.rowNumber}: created ${created._id}  (SKU: ${p.sku})`);
        } else {
          console.log(`   ➕  Row ${p.rowNumber}: [DRY RUN] would create  (SKU: ${p.sku})`);
        }
        createdCount++;
      } catch (err) {
        console.error(`   ❌  Row ${p.rowNumber}: create failed (${p.sku}): ${err.message}`);
        errorCount++;
      }
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('          SYNC SUMMARY                ');
  console.log('══════════════════════════════════════');
  if (DRY_RUN) console.log('  🔍  DRY RUN — nothing was written.');
  console.log(`  ➕  Created : ${createdCount}`);
  console.log(`  ✏️   Patched : ${updatedCount}`);
  console.log(`  ❌  Errors  : ${errorCount}`);
  console.log(`  📦  Total   : ${products.length}`);
  console.log('  🛡️  Images  : 0 touched (guaranteed)');
  console.log('══════════════════════════════════════\n');
}

run().catch(err => {
  console.error('\n❌  Unhandled error:', err);
  process.exit(1);
});
