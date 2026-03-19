/**
 * sync-products.mjs
 * 
 * Synchronizes product catalog from Excel to Sanity.
 * Rules:
 * 1. ID by SKU.
 * 2. Patch existing, create new.
 * 3. Preserve images if they exist.
 * 4. Hierarchical categories (Main -> Sub).
 */

import { createClient } from '@sanity/client';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const {
    NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION,
    SANITY_API_TOKEN
} = process.env;

const client = createClient({
    projectId: NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: NEXT_PUBLIC_SANITY_API_VERSION || '2024-03-17',
    token: SANITY_API_TOKEN,
    useCdn: false,
});

const EXCEL_FILE_PATH = path.resolve(__dirname, '../catalog.xlsx');

// Helper to generate slugs
function slugify(text) {
    const charMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 'ж': 'zh',
        'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia',
        'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Ґ': 'g', 'Д': 'd', 'Е': 'e', 'Є': 'ie', 'Ж': 'zh',
        'З': 'z', 'И': 'y', 'І': 'i', 'Ї': 'i', 'Й': 'i', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n',
        'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u', 'Ф': 'f', 'Х': 'kh', 'Ц': 'ts',
        'Ч': 'ch', 'Ш': 'sh', 'Щ': 'shch', 'Ь': '', 'Ю': 'iu', 'Я': 'ia', 'ы': 'y', 'э': 'e', 'ё': 'yo', 'ъ': ''
    };
    return text.toString().split('').map(c => charMap[c] || c).join('')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 200);
}

function toNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const cleaned = val.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

async function getOrCreateCategory(title, parentId = null) {
    const slug = slugify(title);
    const query = `*[_type == "category" && slug.current == $slug][0]`;
    let category = await client.fetch(query, { slug });

    if (!category) {
        console.log(`   📁 Creating category: ${title}`);
        category = await client.create({
            _type: 'category',
            title,
            slug: { _type: 'slug', current: slug },
            ...(parentId && { parent: { _type: 'reference', _ref: parentId } }),
        });
    } else if (parentId && (!category.parent || category.parent._ref !== parentId)) {
        // Update parent if missing or different
        category = await client.patch(category._id)
            .set({ parent: { _type: 'reference', _ref: parentId } })
            .commit();
    }
    return category;
}

async function run() {
    console.log('🚀 Starting synchronization...');

    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // 1. Find Headers
    let headerRowIndex = -1;
    const colMap = {};
    const targetHeaders = {
        sku: "Артикул",
        barcode: "Штрихкод",
        title: "Повне найменування",
        weight: "грамаж",
        unitsPerBox: "шт в ящику",
        price: "Сайт",
        wholesalePrice: "оптова",
        mainGroup: "головна ГРУПА",
        subGroup: "ПІД ГРУПА",
    };

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i];
        if (row && row.includes("Артикул")) {
            headerRowIndex = i;
            Object.entries(targetHeaders).forEach(([key, label]) => {
                const idx = row.indexOf(label);
                if (idx !== -1) colMap[key] = idx;
            });
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.error("❌ Could not find header row with 'Артикул'.");
        // Fallback or exit? The prompt said to use these columns.
        // Based on raw check, Row 2 has the headers.
        // Let's also check for "шт в ящиу" as a variant from previous script.
        const row2 = rows[2];
        if (row2) {
            colMap.sku = 1;
            colMap.barcode = 2;
            colMap.title = 3;
            colMap.unitsPerBox = 4;
            colMap.price = 5; // Note: Site is 5, value at 6 (offset 1)
            colMap.wholesalePrice = 7; // Value at 8 (offset 1)
            headerRowIndex = 2;
            console.log("   ⚠️ Using fallback header mapping based on file structure.");
        } else {
            process.exit(1);
        }
    }

    // Handle merged cells offset if needed (Site and Wholesale usually have value in next cell)
    const priceOffset = 1;

    const products = [];
    const dataRows = rows.slice(headerRowIndex + 1);

    let mainCat = null;
    let subCat = null;

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row) continue;

        // Handle Category Hierarchy from columns if they exist
        const mainGroupVal = colMap.mainGroup !== undefined ? row[colMap.mainGroup] : null;
        const subGroupVal = colMap.subGroup !== undefined ? row[colMap.subGroup] : null;

        if (mainGroupVal) {
            mainCat = await getOrCreateCategory(mainGroupVal.toString());
        }
        if (subGroupVal && mainCat) {
            subCat = await getOrCreateCategory(subGroupVal.toString(), mainCat._id);
        }

        // Special case for separator rows if columns are missing
        if (colMap.mainGroup === undefined && row[1] && !row[2] && !row[3]) {
            mainCat = await getOrCreateCategory(row[1].toString());
            subCat = null;
            continue;
        }

        const sku = row[colMap.sku]?.toString().trim();
        if (!sku || isNaN(parseInt(sku)) && sku.length < 3) continue; // Skip non-product rows

        const title = row[colMap.title]?.toString().trim();
        if (!title) continue;

        const barcode = row[colMap.barcode]?.toString().trim();
        const weight = row[colMap.weight]?.toString().trim();
        const unitsPerBox = toNumber(row[colMap.unitsPerBox]);

        // Logic for merged cells offset
        let price = toNumber(row[colMap.price]);
        if (price === null) price = toNumber(row[colMap.price + priceOffset]);

        let wholesalePrice = toNumber(row[colMap.wholesalePrice]);
        if (wholesalePrice === null) wholesalePrice = toNumber(row[colMap.wholesalePrice + priceOffset]);

        products.push({
            sku,
            title,
            barcode,
            weight,
            unitsPerBox,
            price,
            wholesalePrice,
            categories: subCat ? [subCat._id] : (mainCat ? [mainCat._id] : []),
        });
    }

    console.log(`📊 Total products to sync: ${products.length}`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const p of products) {
        const existing = await client.fetch(`*[_type == "product" && sku == $sku][0]`, { sku: p.sku });

        const doc = {
            _type: 'product',
            title: p.title,
            sku: p.sku,
            slug: { _type: 'slug', current: slugify(p.title) },
            barcode: p.barcode,
            weight: p.weight,
            piecesPerBox: p.unitsPerBox,
            price: p.price,
            wholesalePrice: p.wholesalePrice,
            categories: p.categories.map(id => ({ _type: 'reference', _ref: id, _key: id })),
        };

        if (existing) {
            // IMAGE PROTECTION: Check if image exists
            const patch = client.patch(existing._id);

            // Construct update fields, excluding image if it exists
            const updateData = { ...doc };
            delete updateData._type;
            delete updateData.sku; // Don't patch SKU since it's the ID

            // If existing has image, don't touch it
            if (existing.image || existing.images) {
                console.log(`   🛡️ Preserving images for SKU: ${p.sku}`);
            }

            await patch.set(updateData).commit();
            updatedCount++;
        } else {
            await client.create(doc);
            createdCount++;
        }

        if ((createdCount + updatedCount) % 10 === 0) {
            console.log(`   Progress: ${createdCount + updatedCount}/${products.length}...`);
        }
    }

    console.log('\n✅ Synchronization complete!');
    console.log(`Summary:`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Updated: ${updatedCount}`);
}

run().catch(err => {
    console.error('❌ Error during sync:', err);
    process.exit(1);
});
