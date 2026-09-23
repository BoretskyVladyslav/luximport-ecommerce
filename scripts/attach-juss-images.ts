/**
 * Attach the 4 Juss promo photos to imported product documents.
 *
 * Drop files into public/images/products/juss/ using the names below, then:
 *   npx tsx scripts/attach-juss-images.ts
 */
import fs from "fs";
import path from "path";
import { createClient, type SanityClient } from "@sanity/client";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DIR = path.resolve(process.cwd(), "public/images/products/juss");

const TARGETS: Array<{
  sku: string;
  titleHint: string;
  files: string[];
}> = [
  {
    sku: "523",
    titleHint: "Нектар JUSS Гранат 1 Л",
    files: ["pomegranate-1l.jpg", "pomegranate-1l.png", "pomegranate-1l.webp"],
  },
  {
    sku: "530",
    titleHint: "Напій JUSS Лохини та насіння базиліка",
    files: [
      "basil-blueberry.jpg",
      "basil-blueberry.png",
      "basil-blueberry.webp",
    ],
  },
  {
    sku: "508",
    titleHint: "Напій JUSS Яблуко/Вишня 200 мл",
    files: [
      "sourcherry-apple-cooler-200ml.jpg",
      "sourcherry-apple-cooler-200ml.png",
      "sourcherry-apple-cooler-200ml.webp",
    ],
  },
  {
    sku: "501",
    titleHint: "Сік JUSS Абрикос 200 мл скло",
    files: [
      "apricot-200ml-glass.jpg",
      "apricot-200ml-glass.png",
      "apricot-200ml-glass.webp",
    ],
  },
];

function writeToken(): string | undefined {
  return process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
}

function resolveFile(candidates: string[]): string | null {
  for (const name of candidates) {
    const full = path.join(DIR, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

async function attach(
  client: SanityClient,
  productId: string,
  filePath: string,
  sku: string,
) {
  const buf = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buf, {
    filename: path.basename(filePath),
    contentType: filePath.toLowerCase().endsWith(".png")
      ? "image/png"
      : filePath.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg",
  });
  const image = {
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: asset._id },
  };
  await client
    .patch(productId)
    .set({
      image,
      images: [{ ...image, _key: `juss-${sku}` }],
    })
    .commit();
}

async function main() {
  const token = writeToken();
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !token) {
    console.error("Missing Sanity project id or write token");
    process.exit(1);
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-02-17",
    token,
    useCdn: false,
  });

  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  let attached = 0;
  const missing: string[] = [];

  for (const target of TARGETS) {
    const filePath = resolveFile(target.files);
    if (!filePath) {
      missing.push(`${target.sku} (${target.files[0]})`);
      continue;
    }
    const product = await client.fetch<{ _id: string; title?: string } | null>(
      `*[_type=="product" && sku==$sku][0]{ _id, title }`,
      { sku: target.sku },
    );
    if (!product?._id) {
      missing.push(`${target.sku} (product not found)`);
      continue;
    }
    await attach(client, product._id, filePath, target.sku);
    attached += 1;
    console.log(
      `Attached ${path.basename(filePath)} → ${target.sku} ${product.title}`,
    );
  }

  console.log(`Attached: ${attached}/${TARGETS.length}`);
  if (missing.length) {
    console.log(`Missing files in ${DIR}:`);
    for (const row of missing) console.log(`  ${row}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
