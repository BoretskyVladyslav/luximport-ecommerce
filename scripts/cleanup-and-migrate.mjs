import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
    console.error('Error: Missing Sanity credentials in .env.local.');
    console.error('Please ensure NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are set.');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    useCdn: false, // Must be false for mutations
    apiVersion: '2024-03-10', // Use current date
    token,
});

// Helper for slugifying (copied from schema for consistency)
function generateSlug(input) {
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

    const transliterated = input.split('').map(char => charMap[char] || char).join('');

    return transliterated
        .toLowerCase()
        .replace(/\s+/g, '-')       // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '') // Remove all non-word chars
        .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
        .replace(/^-+/, '')         // Trim hyphens from start
        .replace(/-+$/, '')         // Trim hyphens from end
        .slice(0, 200);             // Limit length
}

async function cleanupAndMigrate() {
    console.log('--- Starting Task A: Image Wipe ---');

    try {
        // 1. Remove 'image' field from all products
        console.log('Fetching products to unset images...');
        const productsWithImages = await client.fetch(`*[_type == "product" && defined(image)]._id`);
        console.log(`Found ${productsWithImages.length} products with images. Unsetting...`);

        if (productsWithImages.length > 0) {
            // Chunking mutations to avoid rate limits/payload size issues
            const CHUNK_SIZE = 50;
            for (let i = 0; i < productsWithImages.length; i += CHUNK_SIZE) {
                const chunk = productsWithImages.slice(i, i + CHUNK_SIZE);
                let transaction = client.transaction();

                chunk.forEach(id => {
                    transaction.patch(id, p => p.unset(['image']));
                });

                await transaction.commit();
                console.log(`Unset image batch: ${i} - ${i + chunk.length}`);
            }
            console.log('✅ All product images unset.');
        }

        // 2. Delete all assets of type sanity.imageAsset
        console.log('Fetching image assets...');
        const imageAssets = await client.fetch(`*[_type == "sanity.imageAsset"]._id`);
        console.log(`Found ${imageAssets.length} image assets to delete.`);

        if (imageAssets.length > 0) {
            let assetDeletePromises = imageAssets.map(id => client.delete(id));
            await Promise.all(assetDeletePromises);
            console.log('✅ All image assets deleted.');
        }

        console.log('\n--- Starting Task B: Title Parsing & Slug Regeneration ---');

        console.log('Fetching all products...');
        const allProducts = await client.fetch(`*[_type == "product"]{_id, title}`);
        console.log(`Found ${allProducts.length} products to process.`);

        const CHUNK_SIZE = 50;

        for (let i = 0; i < allProducts.length; i += CHUNK_SIZE) {
            const chunk = allProducts.slice(i, i + CHUNK_SIZE);
            let transaction = client.transaction();

            for (const product of chunk) {
                if (!product.title) continue;

                // Regex for parsing
                // Matches e.g: 410г, 1 кг, 500 мл, 250 g
                const weightRegex = /(\d+(?:[.,]\d+)?\s*(?:г|кг|мл|л|g|kg|ml|l))/i;

                // Matches e.g: (15 шт/ящ), (8 шт/ящ), 24шт/ящ
                const packagingRegex = /\(?(\d+\s*шт\/?ящ)\)?/i;

                let newTitle = product.title;
                let weight = null;
                let packaging = null;

                // Extract and remove weight
                const weightMatch = newTitle.match(weightRegex);
                if (weightMatch) {
                    weight = weightMatch[0].trim();
                    newTitle = newTitle.replace(weightRegex, '');
                }

                // Extract and remove packaging
                const packagingMatch = newTitle.match(packagingRegex);
                if (packagingMatch) {
                    packaging = packagingMatch[0].trim().replace(/^\(|\)$/g, ''); // Remove surrounding brackets if they exist
                    newTitle = newTitle.replace(packagingRegex, '');
                }

                // Clean up title (remove trailing commas, brackets, excess spaces)
                newTitle = newTitle.replace(/[\(,\)]/g, '').trim().replace(/\s+/g, ' ');

                // Generate new slug
                const newSlug = generateSlug(newTitle);

                console.log(`Patching [${product._id}] -> Title: "${newTitle}", Slug: "${newSlug}", Weight: "${weight}", Packaging: "${packaging}"`);

                // Prepare patch operations
                const patchOps = {
                    title: newTitle,
                    slug: { _type: 'slug', current: newSlug }
                };

                if (weight) patchOps.weight = weight;
                if (packaging) patchOps.packaging = packaging;

                transaction.patch(product._id, p => p.set(patchOps));
            }

            await transaction.commit();
            console.log(`Processed products batch: ${i} - ${i + chunk.length}`);
        }

        console.log('✅ Title Parsing & Slug Regeneration complete.');
        console.log('\n🎉 Cleanup and Migration Script Finished Successfully!');

    } catch (error) {
        console.error('❌ An error occurred during migration:', error);
    }
}

cleanupAndMigrate();
