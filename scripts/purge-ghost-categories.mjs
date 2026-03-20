import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-02-17',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function run() {
  console.log('Fetching all products and categories...');
  
  const products = await client.fetch(`*[_type == "product"]{ categories }`);
  const categories = await client.fetch(`*[_type == "category"]{ _id, title, parent }`);

  // Track referenced category IDs from products
  const productCategoryIds = new Set();
  products.forEach(p => {
    if (p.categories) {
      p.categories.forEach(c => {
        if (c._ref) productCategoryIds.add(c._ref);
      });
    }
  });

  // Track parent relationships
  const parentToChildren = new Map();
  categories.forEach(c => {
    if (c.parent && c.parent._ref) {
      if (!parentToChildren.has(c.parent._ref)) {
        parentToChildren.set(c.parent._ref, []);
      }
      parentToChildren.get(c.parent._ref).push(c._id);
    }
  });

  // Recursively determine if a category is "used"
  function isCategoryUsed(categoryId) {
    // Used if directly referenced by a product
    if (productCategoryIds.has(categoryId)) return true;
    
    // Used if any of its children are used
    const children = parentToChildren.get(categoryId) || [];
    for (const childId of children) {
      if (isCategoryUsed(childId)) return true;
    }
    
    return false;
  }

  const toDelete = [];
  categories.forEach(c => {
    if (!isCategoryUsed(c._id)) {
      toDelete.push(c);
    }
  });

  console.log(`Found ${categories.length} total categories.`);
  console.log(`Found ${toDelete.length} ghost categories to delete.`);

  for (const c of toDelete) {
    console.log(`Deleting ghost category: "${c.title}" (${c._id})`);
    try {
      await client.delete(c._id);
    } catch (e) {
      console.error(`Failed to delete ${c._id}:`, e.message);
    }
  }

  // Verification step for "Кондитерські вироби" / "Кондиторські Вироби"
  const confectionery = categories.find(c => c.title.toLowerCase().includes('кондитерські') || c.title.toLowerCase().includes('кондиторські'));
  if (confectionery) {
    const isUsed = isCategoryUsed(confectionery._id);
    console.log(`\n✅ VERIFICATION: Group "${confectionery.title}" exists and isUsed=${isUsed}.`);
    
    const childIds = parentToChildren.get(confectionery._id) || [];
    console.log(`   It has ${childIds.length} subcategories.`);
    
    let prodCount = 0;
    products.forEach(p => {
      let matches = false;
      if (p.categories) {
        if (p.categories.some(cat => cat._ref === confectionery._id || childIds.includes(cat._ref))) {
          matches = true;
        }
      }
      if (matches) prodCount++;
    });
    console.log(`   There are ${prodCount} products mapped to this group and its subcategories.`);
  } else {
    console.error('\n❌ VERIFICATION FAILED: Could not find Confectionery category!');
  }

  console.log('\nPurge complete.');
}

run().catch(console.error);
