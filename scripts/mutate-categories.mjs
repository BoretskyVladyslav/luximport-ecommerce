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

const EXACT_CATEGORY_TREE = {
  "Кондитерські вироби": [
    "Печиво Dr. Gerard",
    "Желейні цукерки",
    "Драже",
    "Батончики",
    "Вафлі та печиво",
    "Шоколадні цукерки",
    "Шоколадні пасти (креми)"
  ],
  "Гарячі напої": [
    "Кава",
    "Капучіно",
    "Чай"
  ],
  "Бакалія": [
    "Соуси та Кетчупи",
    "Консерви",
    "Олія",
    "Консервація"
  ],
  "Молочна продукція": [
    "Молоко"
  ],
  "Снеки": [
    "Горіхи"
  ]
};

const CATEGORY_ALIASES = {
  "кондиторські вироби": "Кондитерські вироби",
  "гарячі нопої": "Гарячі напої",
  "бакалійна група товарів": "Бакалія",
  "бакалійні вироби": "Бакалія",
  "молочна продукці": "Молочна продукція",
  "печево dr. gerard": "Печиво Dr. Gerard",
  "печево dr gerard": "Печиво Dr. Gerard",
  "печево dr gerard ": "Печиво Dr. Gerard",
  "печиво dr.gerard": "Печиво Dr. Gerard"
};

function standardizeTitle(rawName) {
  if (!rawName) return '';
  const clean = rawName.toString().trim().toLowerCase();
  if (CATEGORY_ALIASES[clean]) return CATEGORY_ALIASES[clean];
  const cleanSpaced = clean.replace(/\s+/g, ' ');
  if (CATEGORY_ALIASES[cleanSpaced]) return CATEGORY_ALIASES[cleanSpaced];
  if (clean.includes('печево dr') || clean.includes('печиво dr')) return "Печиво Dr. Gerard";
  if (clean.includes('кондитер') || clean.includes('кондитор')) return "Кондитерські вироби";
  if (clean.includes('гарячі') || clean.includes('напої')) return "Гарячі напої";
  if (clean.includes('бакалі')) return "Бакалія";
  if (clean.includes('молочн')) return "Молочна продукція";
  if (clean.includes('снек')) return "Снеки";
  return rawName.toString().trim();
}

function generateSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 200);
}

async function run() {
  console.log('Fetching all products and categories...');
  
  const products = await client.fetch(`*[_type == "product"]{ _id, title, categories }`);
  const categories = await client.fetch(`*[_type == "category"]{ _id, title, slug, parent }`);

  console.log(`Found ${products.length} products and ${categories.length} categories.`);

  // Stage 1: Standardize Category Records themselves
  let patchCount = 0;
  for (const cat of categories) {
    if (!cat.title) continue;
    const stdTitle = standardizeTitle(cat.title);
    if (stdTitle !== cat.title) {
        console.log(`Fixing category typo: "${cat.title}" -> "${stdTitle}"`);
        await client.patch(cat._id).set({ title: stdTitle }).commit();
        patchCount++;
    }
  }

  // Reload categories after patch
  const updatedCategories = await client.fetch(`*[_type == "category"]{ _id, title, parent }`);

  // Stage 2: Consolidate duplicates. If there are multiple categories with exactly the same title,
  // we pick one "master" ID, update all products pointing to the duplicates to point to the master, 
  // and then delete the duplicates.
  const titlesMap = new Map();
  for (const cat of updatedCategories) {
    if (!titlesMap.has(cat.title)) {
      titlesMap.set(cat.title, { masterId: cat._id, duplicates: [] });
    } else {
      titlesMap.get(cat.title).duplicates.push(cat._id);
    }
  }

  const idRemap = new Map();
  for (const [title, entry] of titlesMap.entries()) {
    for (const dupId of entry.duplicates) {
      idRemap.set(dupId, entry.masterId);
    }
  }

  console.log(`Found ${idRemap.size} duplicate categories to consolidate.`);

  if (idRemap.size > 0) {
    let productPatchCount = 0;
    for (const p of products) {
      if (!p.categories) continue;
      let needsPatch = false;
      const newCats = p.categories.map(c => {
        if (c._ref && idRemap.has(c._ref)) {
          needsPatch = true;
          return { _type: 'reference', _ref: idRemap.get(c._ref), _key: idRemap.get(c._ref) };
        }
        return c;
      });

      if (needsPatch) {
        // filter out exact duplicates inside the array if they coalesced to the same master
        const uniqueRefs = [];
        const finalCats = [];
        for (const c of newCats) {
          if (!uniqueRefs.includes(c._ref)) {
            uniqueRefs.push(c._ref);
            finalCats.push(c);
          }
        }
        await client.patch(p._id).set({ categories: finalCats }).commit();
        productPatchCount++;
      }
    }
    console.log(`Updated ${productPatchCount} products matching duplicate categories.`);

    // Now delete the duplicates
    for (const dupId of idRemap.keys()) {
      try {
        await client.delete(dupId);
        console.log(`Deleted duplicate category ID: ${dupId}`);
      } catch (e) {
        console.error(`Failed to delete duplicate category: ${dupId}`);
      }
    }
  }

  // Stage 3: Purge remaining ghost categories (no products mapping to them or their children)
  const finalCategories = await client.fetch(`*[_type == "category"]{ _id, title, parent }`);
  const finalProducts = await client.fetch(`*[_type == "product"]{ categories }`);
  
  const productCategoryIds = new Set();
  finalProducts.forEach(p => {
    if (p.categories) {
      p.categories.forEach(c => {
        if (c._ref) productCategoryIds.add(c._ref);
      });
    }
  });

  const parentToChildren = new Map();
  finalCategories.forEach(c => {
    if (c.parent && c.parent._ref) {
      if (!parentToChildren.has(c.parent._ref)) {
        parentToChildren.set(c.parent._ref, []);
      }
      parentToChildren.get(c.parent._ref).push(c._id);
    }
  });

  function isCategoryUsed(categoryId) {
    if (productCategoryIds.has(categoryId)) return true;
    const children = parentToChildren.get(categoryId) || [];
    for (const childId of children) {
      if (isCategoryUsed(childId)) return true;
    }
    return false;
  }

  let ghostsDeleted = 0;
  for (const c of finalCategories) {
    if (!isCategoryUsed(c._id)) {
      try {
        await client.delete(c._id);
        console.log(`Deleted ghost category: "${c.title}"`);
        ghostsDeleted++;
      } catch (e) {}
    }
  }
  
  console.log(`\nMutation complete. Standardized ${patchCount} typod categories. Deleted ${idRemap.size} duplicates. Deleted ${ghostsDeleted} ghosts.`);
}

run().catch(console.error);
