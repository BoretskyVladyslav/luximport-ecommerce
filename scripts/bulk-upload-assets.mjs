import fs from 'fs';
import path from 'path';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
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
    onsole.error('Please ensure NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are set.');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    useCdn: false, // Must be false for mutations/uploads
    apiVersion: '2024-03-10', // Use current date
    token,
});

// Configurable Options
const PHOTOS_DIR_NAME = 'new_photos'; // Change this if your folder name is different
const CONCURRENCY_LIMIT = 4;          // Upload 4 images at a time (adjust 3-5 as requested)
const UPLOAD_DELAY_MS = 1000;         // 1-second delay between batches to avoid rate limits

const PHOTOS_DIR = path.resolve(__dirname, `../${PHOTOS_DIR_NAME}`);

// Valid image extensions
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadAssets() {
    try {
        if (!fs.existsSync(PHOTOS_DIR)) {
            console.error(`❌ Directory not found: ${PHOTOS_DIR}`);
            console.log(`Please create a "${PHOTOS_DIR_NAME}" directory in the project root and add your images there.`);
            process.exit(1);
        }

        const files = fs.readdirSync(PHOTOS_DIR);

        // Filter out non-image files and hidden files (like .DS_Store)
        const imageFiles = files.filter(file => {
            if (file.startsWith('.')) return false;
            const ext = path.extname(file).toLowerCase();
            return VALID_EXTENSIONS.has(ext);
        });

        if (imageFiles.length === 0) {
            console.log(`No valid image files found in the "${PHOTOS_DIR_NAME}" directory.`);
            return;
        }

        console.log(`Found ${imageFiles.length} images to upload.\n`);

        let successCount = 0;
        let errorCount = 0;

        // Helper to process a batch of uploads
        const processBatch = async (batch, startIndex) => {
            const uploadPromises = batch.map(async (file, i) => {
                const fileIndex = startIndex + i + 1;
                const filePath = path.join(PHOTOS_DIR, file);

                console.log(`[${fileIndex}/${imageFiles.length}] Uploading: ${file}...`);

                try {
                    const fileStream = fs.createReadStream(filePath);
                    await client.assets.upload('image', fileStream, {
                        filename: file
                    });

                    console.log(`✅ Success! Uploaded ${file}`);
                    successCount++;
                } catch (err) {
                    console.error(`❌ Error uploading ${file}:`, err.message);
                    errorCount++;
                }
            });

            await Promise.all(uploadPromises);
        };

        // Process files in batches
        for (let i = 0; i < imageFiles.length; i += CONCURRENCY_LIMIT) {
            const batch = imageFiles.slice(i, i + CONCURRENCY_LIMIT);

            await processBatch(batch, i);

            // Add delay between batches, except after the very last batch
            if (i + CONCURRENCY_LIMIT < imageFiles.length) {
                console.log(`⏳ Waiting ${UPLOAD_DELAY_MS}ms before next batch to prevent rate limits...`);
                await delay(UPLOAD_DELAY_MS);
            }
        }

        console.log('\n--- Upload Complete ---');
        console.log(`Total Success: ${successCount}`);
        console.log(`Total Errors:  ${errorCount}`);

    } catch (err) {
        console.error('An unexpected error occurred:', err);
    }
}

uploadAssets();
