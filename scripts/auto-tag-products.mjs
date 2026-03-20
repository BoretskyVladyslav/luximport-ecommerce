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
  const products = await client.fetch(`*[_type == "product"]{ _id, title, categories }`);
  const categories = await client.fetch(`*[_type == "category"]{ _id, title }`);

  const catMap = new Map();
  for (const c of categories) {
    if (c.title) catMap.set(c.title.trim(), c._id);
  }

  const rules = [
    { target: "Печиво Dr. Gerard", match: (t) => t.includes("gerard") },
    { target: "Желейні цукерки", match: (t) => t.includes("желейн") || t.includes("жуйк") },
    { target: "Драже", match: (t) => t.includes("драже") },
    { target: "Батончики", match: (t) => t.includes("батончик") },
    { target: "Вафлі та печиво", match: (t) => t.includes("вафл") },
    { target: "Шоколадні цукерки", match: (t) => t.includes("шоколадн") && t.includes("цукерк") }
  ];

  for (const p of products) {
    if (!p.title) continue;
    const t = p.title.toLowerCase();
    
    let added = false;
    let newCats = p.categories ? [...p.categories] : [];
    
    for (const rule of rules) {
      if (rule.match(t)) {
        const catId = catMap.get(rule.target);
        if (catId) {
          const exists = newCats.some(c => c._ref === catId);
          if (!exists) {
            newCats.push({ _type: 'reference', _ref: catId, _key: catId });
            added = true;
          }
        }
      }
    }

    if (added) {
      await client.patch(p._id).set({ categories: newCats }).commit();
    }
  }
}

run().catch(() => {});
