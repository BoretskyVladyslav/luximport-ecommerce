import { createClient } from '@sanity/client';
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

// Helper function to delay execution
const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // If it's a rate limit or server error, throw to trigger retry
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }
                // For other errors (like 404), return immediately without retrying
                return response;
            }
            return response;
        } catch (error) {
            console.warn(`    [Attempt ${i + 1}/${retries}] Fetch failed: ${error.message}`);
            if (i < retries - 1) {
                console.log(`    Waiting ${backoff}ms before retrying...`);
                await delay(backoff);
            } else {
                throw error;
            }
        }
    }
}

async function run() {
    console.log('Fetching products from Sanity...');

    // Fetch products that have a description (where we stored the barcode)
    // We only fetch products where description looks like a barcode (mostly digits, length > 7)
    // We also fetch image metadata to potentially skip already uploaded OFF images if we tracked it (optional extension)
    const products = await client.fetch(`*[_type == "product" && defined(description)]{
        _id,
        title,
        description,
        image { asset->{ url } }
    }`);

    console.log(`Found ${products.length} products with a description field.`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const product of products) {
        // Clean up the description to get just the barcode digits
        const barcodeMatch = product.description.match(/\d{8,14}/);

        if (!barcodeMatch) {
            console.log(`[SKIP] Product "${product.title}" has description but no valid barcode found.`);
            skippedCount++;
            continue;
        }

        // Skip if product image URL already looks like it comes from Open Food Facts enrichment (has off in name)
        // This is heuristic based on the filename we uploaded previously
        if (product.image?.asset?.url?.includes('-off-front')) {
            console.log(`[SKIP] Product "${product.title}" already appears to have an enriched image.`);
            skippedCount++;
            continue;
        }

        const barcode = barcodeMatch[0];
        console.log(`\nProcessing "${product.title}" | Barcode: ${barcode}`);

        try {
            // Query Open Food Facts API with Retry Logic
            const response = await fetchWithRetry(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

            if (!response.ok) {
                // We only get here if it's a non-retriable error like 404 from the fetch wrapper
                console.log(` -> Failed to fetch API: HTTP ${response.status}`);
                errorCount++;
                continue;
            }

            const data = await response.json();

            if (data.status === 1 && data.product) {
                // Try to get the highest quality front image, fallback to regular image
                const imageUrl = data.product.image_front_url || data.product.image_url;

                if (imageUrl) {
                    console.log(` -> Found image on Open Food Facts: ${imageUrl}`);

                    // Fetch the actual image data with retry
                    const imageResponse = await fetchWithRetry(imageUrl);
                    if (!imageResponse.ok) throw new Error(`Failed to download image from OFF: ${imageResponse.status}`);

                    const buffer = Buffer.from(await imageResponse.arrayBuffer());

                    // Upload to Sanity
                    console.log(` -> Uploading to Sanity...`);
                    const asset = await client.assets.upload('image', buffer, {
                        filename: `${barcode}-off-front.jpg`,
                    });

                    // Patch the product document
                    console.log(` -> Patching product document...`);
                    await client.patch(product._id)
                        .set({
                            image: {
                                _type: 'image',
                                asset: { _type: 'reference', _ref: asset._id }
                            }
                        })
                        .commit();

                    console.log(` -> Success! Updated image for ${product.title}`);
                    successCount++;
                } else {
                    console.log(` -> Product found, but no image URL available.`);
                    notFoundCount++;
                }
            } else {
                console.log(` -> Barcode ${barcode} not found in Open Food Facts database.`);
                notFoundCount++;
            }

        } catch (err) {
            console.error(` -> Error processing ${product.title}:`, err.message);
            errorCount++;
        }

        // Rate limiting - wait 4 seconds between requests as requested
        console.log(` -> Waiting 4000ms before next request...`);
        await delay(4000);
    }

    console.log('\n==============================');
    console.log('     ENRICHMENT SUMMARY       ');
    console.log('==============================');
    console.log(`Images Uploaded      : ${successCount}`);
    console.log(`Already Enriched/Skipped : ${skippedCount}`);
    console.log(`Not Found / No Image : ${notFoundCount}`);
    console.log(`Errors               : ${errorCount}`);
    console.log('==============================\n');
}

run().catch(err => {
    console.error('Unhandled script error:', err);
    process.exit(1);
});
