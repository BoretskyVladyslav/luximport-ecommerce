require('dotenv').config({ path: '.env.local' });
const { createClient } = require('next-sanity');
const fs = require('fs');
const path = require('path');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-02-21',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

console.log('Sanity Client Initialized');

function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function importProducts() {
  try {
    const productsPath = path.join(__dirname, 'products.json');
    const productsRaw = fs.readFileSync(productsPath, 'utf8');
    const products = JSON.parse(productsRaw);

    for (const item of products) {
      const document = {
        _type: 'product',
        title: item.title,
        slug: { _type: 'slug', current: generateSlug(item.title) },
        price: item.price,
        category: item.category,
        origin: item.origin || '',
        stock: item.stock || 0
      };

      try {
        await client.create(document);
        console.log(`Imported: ${document.title}`);
      } catch (err) {
        console.error(`Failed to import ${document.title}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importProducts();
