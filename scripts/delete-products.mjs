import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID!");
}

if (!process.env.SANITY_API_TOKEN) {
    throw new Error("Missing SANITY_API_TOKEN! Cannot delete documents.");
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-03-09',
});

async function deleteAllProducts() {
    console.log('Fetching all products from Sanity...');

    try {
        const products = await client.fetch('*[_type == "product"]{_id}');

        if (products.length === 0) {
            console.log('No products found to delete.');
            return;
        }

        console.log(`Found ${products.length} products to delete...`);

        let count = 1;
        for (const product of products) {
            try {
                await client.delete(product._id);
                console.log(`[${count}/${products.length}] Deleted product with ID: ${product._id}`);
            } catch (err) {
                console.error(`Error deleting product ${product._id}:`, err.message);
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
            count++;
        }

        console.log('All products have been successfully deleted!');
    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
}

deleteAllProducts();
