import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
// These are pre-filled based on your existing project scripts so you don't have to search for them!
// The configuration is placed directly into the createClient call below.
const sanityClient = createClient({
    projectId: '70cr4se4', 
    dataset: 'production',
    apiVersion: '2024-02-17',
    token: 'skMPXynKj9BPipFIWJ7V6E2jqDfmeSfWF2XtJtSTZFoAiPb1KWKZjdkgHTbAcrLxGxZiKLCDf134aRYHac4Fsy2jr1cqYc44oWGKy5icnCpKP3Boquxw3UUyBstjfUviXqjyKgwH1y4YoLjxhWrVXdgouwKY31yPzbpiQKlSmchZIxKJhkpq', // Token with editor/write access
    useCdn: false,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function manageMediaLibrary() {
    console.log("🚀 Starting Sanity Media Library Automation...");
    console.log("-----------------------------------------------");

    try {
        // --- 0. UNSET REFERENCES FROM ALL PRODUCTS AND CATEGORIES ---
        console.log("\n🧹 Phase 0: Removing image references from all documents...");
        
        // Fetch all documents (including drafts) that have an 'image' field defined
        const referencingDocs = await sanityClient.fetch(`*[defined(image)]{_id}`);
        
        if (referencingDocs.length > 0) {
            console.log(`⚠️ Found ${referencingDocs.length} document(s) with image references. Unsetting them...`);
            let unsetCount = 0;
            let failedUnset = 0;
            
            for (const doc of referencingDocs) {
                try {
                    await sanityClient.patch(doc._id).unset(['image']).commit();
                    unsetCount++;
                    if (unsetCount % 50 === 0 || unsetCount === referencingDocs.length) {
                        console.log(`🔌 Unset images on ${unsetCount}/${referencingDocs.length} documents...`);
                    }
                } catch (err) {
                    failedUnset++;
                    console.error(`❌ Failed to unset image on ${doc._id}: ${err.message}`);
                }
            }
            console.log(`✅ Phase 0 Complete: Unset ${unsetCount} references. (Failed: ${failedUnset})`);
        } else {
            console.log("✅ No documents holding image references found.");
        }

        // --- 1. WIPE OLD DATA ---
        console.log("\n🧹 Phase 1: Wiping old image assets...");
        
        // Fetch ALL image assets
        const existingAssets = await sanityClient.fetch(`*[_type == "sanity.imageAsset"]{_id}`);
        
        if (existingAssets.length === 0) {
            console.log("✅ No existing image assets found to delete.");
        } else {
            console.log(`⚠️ Found ${existingAssets.length} existing image asset(s). Starting deletion...`);
            let deletedCount = 0;
            let failedCount = 0;
            
            for (const asset of existingAssets) {
                try {
                    await sanityClient.delete(asset._id);
                    deletedCount++;
                    
                    if (deletedCount % 20 === 0 || deletedCount === existingAssets.length) {
                        console.log(`🗑️ Deleted ${deletedCount}/${existingAssets.length} old assets...`);
                    }
                } catch (err) {
                    failedCount++;
                    console.error(`❌ Failed to delete asset ${asset._id}: ${err.message}`);
                }
            }
            console.log(`✅ Phase 1 Complete: Deleted ${deletedCount} assets. (Failed: ${failedCount})`);
        }

        // --- 2. BULK UPLOAD ---
        console.log("\n📤 Phase 2: Uploading new images from Catalog directory...");
        
        const catalogDir = path.join(__dirname, '..', 'Catalog');
        
        if (!fs.existsSync(catalogDir)) {
            console.error(`❌ Error: Catalog directory not found at path: ${catalogDir}`);
            return;
        }

        // Read all image files from Catalog directory
        const files = fs.readdirSync(catalogDir).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext);
        });

        if (files.length === 0) {
            console.log("⚠️ No valid image files found in the Catalog directory.");
            return;
        }

        console.log(`📦 Found ${files.length} image(s) to upload. Starting upload process...`);
        let uploadedCount = 0;
        let uploadFailures = 0;

        for (const file of files) {
            const filePath = path.join(catalogDir, file);
            const fileStream = fs.createReadStream(filePath);
            
            try {
                // Determine content type roughly based on extension if needed, but Sanity auto-detects
                await sanityClient.assets.upload('image', fileStream, {
                    filename: file
                });
                uploadedCount++;
                console.log(`⬆️ Uploaded ${uploadedCount}/${files.length}... (${file})`);
            } catch (uploadError) {
                uploadFailures++;
                console.error(`❌ Failed to upload ${file}:`, uploadError.message);
            }
        }

        console.log(`\n🎉 Automation complete!`);
        console.log(`📊 Summary: Uploaded ${uploadedCount} images. (Failed: ${uploadFailures})`);
        console.log("-----------------------------------------------");

    } catch (error) {
        console.error("\n❌ Fatal Error during execution:", error);
    }
}

manageMediaLibrary();
