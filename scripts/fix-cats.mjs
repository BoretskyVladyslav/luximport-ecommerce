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

function generateSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 200);
}

async function ensureCategory(title) {
  const existing = await client.fetch(`*[_type == "category" && title == $title][0]`, { title });
  if (existing) return existing._id;
  
  const created = await client.create({
    _type: 'category',
    title,
    slug: { _type: 'slug', current: generateSlug(title) }
  });
  return created._id;
}

async function run() {
  const vafliId = await ensureCategory("Вафлі та печиво");
  const jeleId = await ensureCategory("Желейні цукерки");

  const products = await client.fetch(`*[_type == "product"]{ _id, title, categories }`);

  for (const p of products) {
    if (!p.title) continue;
    const t = p.title.toLowerCase();
    
    let added = false;
    let newCats = p.categories ? [...p.categories] : [];

    if (
      t.includes("желе") || 
      t.includes("желейн") || 
      t.includes("жуйк") || 
      t.includes("жувальн") || 
      t.includes("мармелад") || 
      t.includes("цукерки желейні")
    ) {
      if (!newCats.some(c => c._ref === jeleId)) {
        newCats.push({ _type: 'reference', _ref: jeleId, _key: jeleId });
        added = true;
      }
    }

    if (
      (t.includes("вафл") || t.includes("вафел") || t.includes("печив") || t.includes("печен")) &&
      !t.includes("gerard") && !t.includes("жерард")
    ) {
      if (!newCats.some(c => c._ref === vafliId)) {
        newCats.push({ _type: 'reference', _ref: vafliId, _key: vafliId });
        added = true;
      }
    }

    if (added) {
      await client.patch(p._id).set({ categories: newCats }).commit();
    }
  }
}

run().catch(() => {});
