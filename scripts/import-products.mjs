import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createClient } from '@sanity/client';

// ESM setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sanity Client setup
// Expects environment variables from .env.local
const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-03-09',
});

// Helper: Upload image from URL to Sanity
async function uploadImageFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: ${res.statusCode}`));
                return;
            }
            client.assets
                .upload('image', res, { filename: path.basename(imageUrl) })
                .then((asset) => resolve(asset._id))
                .catch(reject);
        }).on('error', reject);
    });
}

// Helper: Upload local image file to Sanity
async function uploadLocalImage(filePath) {
    const stream = fs.createReadStream(filePath);
    const asset = await client.assets.upload('image', stream, {
        filename: path.basename(filePath),
    });
    return asset._id;
}

// Helper: Determine image type (URL or local) and upload
async function uploadImage(imagePathOrUrl) {
    if (!imagePathOrUrl) return null;
    try {
        if (imagePathOrUrl.startsWith('http')) {
            return await uploadImageFromUrl(imagePathOrUrl);
        } else {
            const fullPath = path.resolve(__dirname, '..', imagePathOrUrl);
            if (fs.existsSync(fullPath)) {
                return await uploadLocalImage(fullPath);
            } else {
                console.warn(`Local image not found: ${fullPath}`);
                return null;
            }
        }
    } catch (error) {
        console.error(`Failed to upload image ${imagePathOrUrl}:`, error.message);
        return null;
    }
}

// Helper: Generate unique slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9а-яіїєґ]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

// Placeholder data if no source file is provided
const placeholderProducts = [
    {
        title: 'Dr. Gerard Макаруни 150г',
        description: 'Смачні європейські макаруни.',
        price: 120,
        category: 'Печиво',
        brand: 'Dr. Gerard',
        weight: 0.15,
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=600&auto=format&fit=crop'
    },
    {
        title: 'Преміум Оливкова Олія Extra Virgin 500мл',
        description: 'Оригінальна італійська оливкова олія холодного віджиму.',
        price: 450,
        category: 'Олії',
        brand: 'Luximport',
        weight: 0.5,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop'
    }
];

async function importProducts() {
    console.log('Starting bulk import...');

    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
        console.error('ERROR: Missing required Sanity environment variables.');
        console.error('Please ensure NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are set.');
        process.exit(1);
    }

    let dataToImport = placeholderProducts;

    // You can point this to a parsed JSON file or implement CSV parsing (e.g., using 'papaparse') 
    // simply by reading a local .csv and setting dataToImport to the parsed rows.
    const dataFilePath = path.resolve(__dirname, '..', 'products_import.json');
    if (fs.existsSync(dataFilePath)) {
        try {
            const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
            dataToImport = JSON.parse(fileContent);
            console.log(`Loaded ${dataToImport.length} products from ${dataFilePath}`);
        } catch (e) {
            console.error('Error parsing JSON file:', e.message);
        }
    } else {
        console.log('No products_import.json found, using placeholder product array.');
    }

    let currentIndex = 1;
    const total = dataToImport.length;

    for (const item of dataToImport) {
        console.log(`[${currentIndex}/${total}] Processing product: ${item.title}`);

        let imageAssetId = null;
        if (item.image) {
            imageAssetId = await uploadImage(item.image);
        }

        const doc = {
            _type: 'product',
            title: item.title,
            slug: {
                _type: 'slug',
                current: generateSlug(item.title) + '-' + Math.random().toString(36).substring(2, 6)
            },
            description: item.description || '',
            price: Number(item.price) || 0,
            category: item.category || 'Загальна',
            brand: item.brand || '',
            weight: Number(item.weight) || 0,
            sku: `LUX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        };

        if (imageAssetId) {
            doc.image = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAssetId,
                },
            };
        }

        try {
            await client.create(doc);
            console.log(` ---> Successfully imported: ${item.title}`);
        } catch (error) {
            console.error(` ---> Error importing ${item.title}:`, error.message);
        }

        // Delay to prevent hitting Sanity API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        currentIndex++;
    }

    console.log('Bulk import completed!');
}

importProducts();
