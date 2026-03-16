import { createClient } from '@sanity/client';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error("Missing required Sanity environment variables. Please check .env.local");
    process.exit(1);
}

// Sanity Client setup
const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-03-09',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

const EXCEL_FILE_PATH = path.resolve(__dirname, '../catalog.xlsx');

// Configurable Column Mapping (1-indexed based on Excel columns)
// Adjust these to match the client's Excel file structure
// B:2, C:3 (Артикул/DESC), D:4 (Штрихкод), E:5 (Повне найменування/TITLE), F:6, G:7 (Гурт PRICE)
const COL = {
    TITLE: 5,       // E
    PRICE: 7,       // G
    CATEGORY: 2,    // B (Categories are rows with just column B filled, but treating it like string check)
    DESCRIPTION: 4, // D (Using Barcode as description or sku, actual title is in E)
    STOCK: 6,       // F
    SKU: 3,         // C (Article)
    // Add more as needed (e.g., origin, wholesalePrice)
};

// Utility to generate a URL-friendly slug
function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        // Replace cyrillic properly (optional, simple fallback used here)
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w\-\u0400-\u04FF]+/g, '')   // Remove non-word chars (keeping cyrillic)
        .replace(/\-\-+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
}

async function run() {
    console.log(`Loading Excel file from ${EXCEL_FILE_PATH}...`);
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    } catch (err) {
        console.error(`Failed to read Excel file at ${EXCEL_FILE_PATH}. Error: ${err.message}`);
        console.error(`Please ensure catalog.xlsx exists in the root directory.`);
        process.exit(1);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        console.error("No worksheet found in the Excel file.");
        process.exit(1);
    }

    console.log(`Processing worksheet: ${worksheet.name}`);

    // Extract embedded images and map them by their row index
    const rowImages = new Map();
    const images = worksheet.getImages();

    for (const image of images) {
        const imgId = image.imageId;
        // ExcelJS stores media internally on the workbook model
        const imgData = workbook.model.media.find(m => m.index === imgId);

        if (image.range && image.range.tl && imgData) {
            // tl.nativeRow is 0-indexed, so we add 1 to match 1-indexed row numbers below
            const rowIdx = image.range.tl.nativeRow + 1;
            rowImages.set(rowIdx, {
                buffer: imgData.buffer,
                extension: imgData.extension
            });
        }
    }

    console.log(`Found ${rowImages.size} embedded images.`);

    let successCount = 0;
    let skipCount = 0;

    // Iterate over rows sequentially to avoid API rate limits
    // Start from row 2 assuming row 1 is headers (Title, Price, etc.)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const titleVal = row.getCell(COL.TITLE).value;

        // Skip empty lines
        if (!titleVal) {
            continue;
        }

        const title = titleVal.toString().trim();
        // Parse values safely
        const priceVal = row.getCell(COL.PRICE).value;
        const price = typeof priceVal === 'number' ? priceVal : Number(priceVal?.toString().replace(/[^0-9.]/g, '')) || 0;

        const category = row.getCell(COL.CATEGORY).value?.toString().trim();
        const description = row.getCell(COL.DESCRIPTION).value?.toString().trim();

        const stockVal = row.getCell(COL.STOCK).value;
        const stock = typeof stockVal === 'number' ? stockVal : Number(stockVal) || 0;

        const skuVal = row.getCell(COL.SKU).value?.toString().trim();
        const sku = skuVal || `LUX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const slug = generateSlug(title);

        let imageAssetId = null;

        try {
            console.log(`\n[Row ${rowNumber}] Processing product: "${title}"`);

            const imageData = rowImages.get(rowNumber);

            if (imageData) {
                console.log(` -> Found embedded image. Uploading to Sanity...`);
                const asset = await client.assets.upload('image', Buffer.from(imageData.buffer), {
                    filename: `product-${slug || Date.now()}.${imageData.extension || 'jpg'}`,
                });
                imageAssetId = asset._id;
                console.log(` -> Image uploaded successfully: ${asset._id}`);
            } else {
                console.warn(` -> Warning: No image found for row ${rowNumber}.`);
            }

            const productDoc = {
                _type: 'product',
                title,
                slug: {
                    _type: 'slug',
                    current: slug || `imported-${Date.now()}`
                },
                price,
                ...(category && { category }),
                ...(description && { description }),
                stock,
                sku,
                ...(imageAssetId && {
                    image: {
                        _type: 'image',
                        asset: {
                            _type: 'reference',
                            _ref: imageAssetId,
                        }
                    }
                })
            };

            const result = await client.create(productDoc);
            console.log(` -> Created Sanity Product Document: ${result._id}`);
            successCount++;

        } catch (err) {
            console.error(` -> Error processing row ${rowNumber}:`, err.message);
            skipCount++;
        }
    }

    console.log('\n==============================');
    console.log('       IMPORT SUMMARY        ');
    console.log('==============================');
    console.log(`Successfully created : ${successCount}`);
    console.log(`Skipped / Errors     : ${skipCount}`);
    console.log('==============================\n');
}

run().catch(err => {
    console.error('Unhandled script error:', err);
    process.exit(1);
});
