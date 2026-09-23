/**
 * One-shot / idempotent import of luximport_shablon_produktiv.xlsx
 * (sheet "Товари для імпорту") into Sanity product documents.
 *
 * Identity: SKU first. New docs use _id `product-${sku}` + createOrReplace.
 * Existing SKUs keep their current _id (no cart/order id breakage) and are
 * patched on the allowlist — images/slug are preserved unless the file
 * supplies a real image URL.
 *
 * Untracked inventory: `stock: null` (storefront maps this to countInStock).
 *
 * Usage:
 *   npx tsx scripts/import-products.ts --dry-run
 *   npx tsx scripts/import-products.ts
 */
import { createHash, randomBytes } from "crypto";
import path from "path";
import { createClient, type SanityClient } from "@sanity/client";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

import { slugifyTitleForSlug } from "../src/sanity/schema/slugify-title";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SOURCE_FILE = path.resolve(
  process.cwd(),
  "luximport_shablon_produktiv.xlsx",
);
const SOURCE_SHEET = "Товари для імпорту";
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 50;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-02-17";
const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local");
  process.exit(1);
}
if (!token) {
  console.error(
    "Missing SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) in .env.local",
  );
  process.exit(1);
}

const client: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

type FieldKey =
  | "sku"
  | "title"
  | "category"
  | "price"
  | "wholesalePrice"
  | "barcode"
  | "weight"
  | "piecesPerBox"
  | "imageUrl"
  | "description";

const HEADER_ALIASES: Record<string, FieldKey> = {
  "артикул (sku)": "sku",
  артикул: "sku",
  sku: "sku",
  "назва товару": "title",
  назва: "title",
  title: "title",
  категорія: "category",
  category: "category",
  "ціна (грн)": "price",
  ціна: "price",
  price: "price",
  "оптова ціна (грн)": "wholesalePrice",
  "оптова ціна": "wholesalePrice",
  оптова: "wholesalePrice",
  wholesale: "wholesalePrice",
  штрихкод: "barcode",
  barcode: "barcode",
  "вага (кг)": "weight",
  вага: "weight",
  weight: "weight",
  "кількість в ящику": "piecesPerBox",
  "шт в ящику": "piecesPerBox",
  "шт в ящиу": "piecesPerBox",
  piecesperbox: "piecesPerBox",
  "посилання на зображення": "imageUrl",
  фото: "imageUrl",
  image: "imageUrl",
  "опис товару": "description",
  опис: "description",
  description: "description",
};

const CATEGORY_ALIASES: Record<string, string> = {
  "молочні продукти": "Молочна продукція",
  "молочна продукці": "Молочна продукція",
  кава: "Кава",
};

type ParsedRow = {
  rowNumber: number;
  sku: string;
  title: string;
  category: string;
  price: number;
  wholesalePrice?: number;
  barcode?: string;
  weightKg?: number;
  piecesPerBox?: number;
  imageUrl?: string;
  description?: string;
};

type CatalogDoc = {
  _id: string;
  _type: string;
  title?: string | null;
  slug?: string | null;
};

type ExistingProduct = {
  _id: string;
  sku?: string | null;
  slug?: { current?: string | null } | null;
  images?: unknown;
  image?: unknown;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.w === "string" && rec.w.trim()) return rec.w.trim();
    if (typeof rec.text === "string") return rec.text.trim();
    if (typeof rec.result === "string" || typeof rec.result === "number") {
      return cellToString(rec.result);
    }
  }
  return String(value).trim();
}

function toNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  const cleaned = cellToString(value)
    .replace(/[^\d.,-]/g, "")
    .replace(",", ".");
  if (!cleaned) return undefined;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function barcodeToString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const formatted =
      typeof rec.w === "string" ? rec.w.trim().replace(/\s/g, "") : "";
    if (/^\d+$/.test(formatted)) return formatted;
    if (rec.v !== undefined) return barcodeToString(rec.v);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 0,
    });
  }
  const raw = String(value).trim().replace(/\s/g, "");
  if (!raw) return undefined;
  if (/e[+-]?\d+/i.test(raw)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    return n.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 0,
    });
  }
  return raw;
}

function catalogKey(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

function productIdFromSku(sku: string): string {
  const safe = sku.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
  return `product-${safe}`;
}

function categoryIdFromSlug(slug: string): string {
  return `category-${slug}`.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 120);
}

function blockKey(): string {
  return randomBytes(6).toString("hex");
}

function textToPortableText(text: string) {
  return [
    {
      _type: "block",
      _key: blockKey(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: blockKey(), text, marks: [] }],
    },
  ];
}

function formatWeightLabel(kg: number): string {
  const label = Number.isInteger(kg) ? String(kg) : String(kg);
  return `${label} кг`;
}

function uniqueSlug(base: string, sku: string, used: Set<string>): string {
  let slug = base || slugifyTitleForSlug(sku) || `imported-${sku}`;
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  const suffix =
    slugifyTitleForSlug(sku) ||
    createHash("sha1").update(sku).digest("hex").slice(0, 8);
  slug = `${slug.slice(0, 180)}-${suffix}`;
  let n = 2;
  while (used.has(slug)) {
    slug = `${slug.slice(0, 180)}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

function detectHeaders(rows: unknown[][]): {
  headerRowIndex: number;
  columns: Partial<Record<FieldKey, number>>;
} | null {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row) continue;
    const columns: Partial<Record<FieldKey, number>> = {};
    for (let c = 0; c < row.length; c++) {
      const alias = HEADER_ALIASES[normalizeHeader(row[c])];
      if (!alias || columns[alias] !== undefined) continue;
      columns[alias] = c;
    }
    if (columns.title !== undefined || columns.sku !== undefined) {
      return { headerRowIndex: i, columns };
    }
  }
  return null;
}

function readCell(row: unknown[], index: number | undefined): unknown {
  if (index === undefined || index < 0 || index >= row.length) return undefined;
  return row[index];
}

function parseWorkbook(): {
  headerRowIndex: number;
  columns: Partial<Record<FieldKey, number>>;
  rows: ParsedRow[];
  skippedEmptyTitle: number;
  skippedInvalid: number;
} {
  const workbook = XLSX.readFile(SOURCE_FILE, {
    cellDates: true,
    raw: true,
    cellText: true,
  });
  const sheetName =
    workbook.SheetNames.find((n) => n === SOURCE_SHEET) ??
    workbook.SheetNames[0];
  if (!sheetName) throw new Error("Workbook has no sheets");
  if (sheetName !== SOURCE_SHEET) {
    console.warn(`Sheet "${SOURCE_SHEET}" not found; using "${sheetName}"`);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const detected = detectHeaders(rows);
  if (!detected) {
    throw new Error(
      'Could not detect header row (need "Назва товару*" or "Артикул (SKU)*")',
    );
  }

  const { headerRowIndex, columns } = detected;
  const parsed: ParsedRow[] = [];
  let skippedEmptyTitle = 0;
  let skippedInvalid = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const rowNumber = i + 1;
    const title = cellToString(readCell(row, columns.title)).trim();
    const sku = cellToString(readCell(row, columns.sku)).trim();
    if (!title) {
      skippedEmptyTitle += 1;
      continue;
    }
    const price = toNumber(readCell(row, columns.price));
    if (!sku || price === undefined || price <= 0) {
      skippedInvalid += 1;
      continue;
    }

    const wholesalePrice = toNumber(readCell(row, columns.wholesalePrice));
    const weightKg = toNumber(readCell(row, columns.weight));
    const piecesRaw = toNumber(readCell(row, columns.piecesPerBox));
    const piecesPerBox =
      piecesRaw !== undefined && Number.isInteger(piecesRaw) && piecesRaw >= 1
        ? piecesRaw
        : undefined;

    parsed.push({
      rowNumber,
      sku,
      title,
      category: cellToString(readCell(row, columns.category)).trim(),
      price,
      wholesalePrice:
        wholesalePrice !== undefined && wholesalePrice >= 0
          ? wholesalePrice
          : undefined,
      barcode: barcodeToString(readCell(row, columns.barcode)),
      weightKg: weightKg !== undefined && weightKg >= 0 ? weightKg : undefined,
      piecesPerBox,
      imageUrl:
        cellToString(readCell(row, columns.imageUrl)).trim() || undefined,
      description:
        cellToString(readCell(row, columns.description)).trim() || undefined,
    });
  }

  return {
    headerRowIndex,
    columns,
    rows: parsed,
    skippedEmptyTitle,
    skippedInvalid,
  };
}

function resolveExistingCategoryId(
  rawTitle: string,
  catalog: CatalogDoc[],
): string | undefined {
  if (!rawTitle) return undefined;
  const aliased = CATEGORY_ALIASES[catalogKey(rawTitle)] ?? rawTitle;
  const keys = new Set([catalogKey(rawTitle), catalogKey(aliased)]);
  const slugKeys = new Set(
    Array.from(keys)
      .map((k) => slugifyTitleForSlug(k))
      .filter(Boolean),
  );

  const byTitle = catalog.filter(
    (d) => d.title && keys.has(catalogKey(d.title)),
  );
  const sub = byTitle.find((d) => d._type === "subcategory");
  if (sub) return sub._id;
  if (byTitle[0]) return byTitle[0]._id;

  const bySlug = catalog.filter((d) => d.slug && slugKeys.has(d.slug));
  const subSlug = bySlug.find((d) => d._type === "subcategory");
  if (subSlug) return subSlug._id;
  return bySlug[0]?._id;
}

async function ensureCategory(
  rawTitle: string,
  catalog: CatalogDoc[],
  createdTitles: Set<string>,
): Promise<{ id: string; created: boolean; title: string }> {
  const displayTitle = CATEGORY_ALIASES[catalogKey(rawTitle)] ?? rawTitle;
  const existingId = resolveExistingCategoryId(rawTitle, catalog);
  if (existingId) {
    const existing = catalog.find((d) => d._id === existingId);
    return {
      id: existingId,
      created: false,
      title: existing?.title?.trim() || displayTitle,
    };
  }

  const slug =
    slugifyTitleForSlug(displayTitle) || `category-${catalog.length + 1}`;
  const id = categoryIdFromSlug(slug);
  const alreadyQueued = catalog.find((d) => d._id === id);
  if (alreadyQueued) {
    return {
      id,
      created: false,
      title: alreadyQueued.title?.trim() || displayTitle,
    };
  }

  if (!DRY_RUN) {
    await client.createIfNotExists({
      _id: id,
      _type: "category",
      title: displayTitle,
      slug: { _type: "slug", current: slug },
      sortOrder: 99,
    });
  }

  catalog.push({ _id: id, _type: "category", title: displayTitle, slug });
  createdTitles.add(displayTitle);
  return { id, created: true, title: displayTitle };
}

function usableImageUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  const host = url.hostname.toLowerCase();
  if (host === "example.com" || host.endsWith(".example.com")) return undefined;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  return raw;
}

async function uploadImageFromUrl(rawUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 5 * 1024 * 1024) return null;
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const base =
      new URL(rawUrl).pathname.split("/").filter(Boolean).pop() ||
      `product.${ext}`;
    const filename = /\.(jpe?g|png|webp|gif)$/i.test(base)
      ? base
      : `${base}.${ext}`;
    const asset = await client.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  if (DRY_RUN) console.log("DRY RUN — no writes\n");
  console.log(`File: ${path.basename(SOURCE_FILE)}`);
  console.log(`Sheet: ${SOURCE_SHEET}`);

  const parsed = parseWorkbook();
  const headerSample = Object.entries(parsed.columns)
    .map(([field, idx]) => `${field}@${idx}`)
    .join(", ");
  console.log(`Header row: ${parsed.headerRowIndex + 1} (${headerSample})`);
  console.log(`Parsed: ${parsed.rows.length}`);
  console.log(`Skipped empty title: ${parsed.skippedEmptyTitle}`);
  if (parsed.skippedInvalid) {
    console.log(
      `Skipped invalid (missing sku/price): ${parsed.skippedInvalid}`,
    );
  }

  if (parsed.rows.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  const catalog = await client.fetch<CatalogDoc[]>(
    `*[_type in ["category", "subcategory"]]{ _id, _type, title, "slug": slug.current }`,
  );
  const existingProducts = await client.fetch<ExistingProduct[]>(
    `*[_type == "product"]{ _id, sku, slug, images, image }`,
  );

  const skuMap = new Map<string, ExistingProduct>();
  const usedSlugs = new Set<string>();
  for (const p of existingProducts) {
    if (p.sku) skuMap.set(p.sku.trim(), p);
    if (p.slug?.current) usedSlugs.add(p.slug.current);
  }

  const createdCategoryTitles = new Set<string>();
  const categoryHits = new Map<string, { id: string; title: string }>();
  const categoryCounts = new Map<string, number>();

  for (const row of parsed.rows) {
    const label = row.category || "(uncategorized)";
    categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
    if (!row.category) continue;
    if (categoryHits.has(row.category)) continue;
    const resolved = await ensureCategory(
      row.category,
      catalog,
      createdCategoryTitles,
    );
    categoryHits.set(row.category, { id: resolved.id, title: resolved.title });
  }

  console.log("\nCategories:");
  for (const [source, count] of categoryCounts) {
    const mapped = categoryHits.get(source);
    const created = mapped && createdCategoryTitles.has(mapped.title);
    console.log(
      `  ${source} ×${count} → ${mapped ? mapped.title : "UNMAPPED"} [${created ? "created" : "existing"}]`,
    );
  }

  type ProductWrite = Record<string, unknown> & {
    _id: string;
    _type: string;
  };
  type Prepared = {
    row: ParsedRow;
    doc: ProductWrite;
    action: "created" | "updated";
  };
  const prepared: Prepared[] = [];
  const errors: { rowNumber: number; sku: string; message: string }[] = [];

  for (const row of parsed.rows) {
    const existing = skuMap.get(row.sku);
    const _id = existing?._id ?? productIdFromSku(row.sku);
    const categoryRef = categoryHits.get(row.category);
    const slugCurrent = existing?.slug?.current
      ? existing.slug.current
      : uniqueSlug(slugifyTitleForSlug(row.title), row.sku, usedSlugs);

    let imageAssetId: string | null = null;
    const imageUrl = usableImageUrl(row.imageUrl);
    if (imageUrl && !DRY_RUN) {
      imageAssetId = await uploadImageFromUrl(imageUrl);
    }

    const doc: ProductWrite = {
      _id,
      _type: "product",
      title: row.title,
      sku: row.sku,
      slug: { _type: "slug", current: slugCurrent },
      price: row.price,
      stock: null,
      isActive: true,
    };

    if (row.wholesalePrice !== undefined)
      doc.wholesalePrice = row.wholesalePrice;
    if (row.piecesPerBox !== undefined) doc.piecesPerBox = row.piecesPerBox;
    if (row.barcode) doc.barcode = row.barcode;
    if (row.weightKg !== undefined) {
      doc.weightKg = row.weightKg;
      doc.weight = formatWeightLabel(row.weightKg);
    }
    if (row.description) doc.description = textToPortableText(row.description);
    if (categoryRef) {
      doc.categories = [
        {
          _type: "reference",
          _ref: categoryRef.id,
          _key: `cat-${categoryRef.id}`.slice(0, 64),
        },
      ];
    }
    if (imageAssetId) {
      doc.images = [
        {
          _type: "image",
          _key: blockKey(),
          asset: { _type: "reference", _ref: imageAssetId },
        },
      ];
    } else if (existing?.images) {
      doc.images = existing.images;
    }
    if (!imageAssetId && existing?.image) {
      doc.image = existing.image;
    }

    prepared.push({
      row,
      doc,
      action: existing ? "updated" : "created",
    });
    skuMap.set(row.sku, {
      _id,
      sku: row.sku,
      slug: { current: slugCurrent },
    });
  }

  let created = 0;
  let updated = 0;

  if (DRY_RUN) {
    created = prepared.filter((p) => p.action === "created").length;
    updated = prepared.filter((p) => p.action === "updated").length;
  } else {
    const totalBatches = Math.ceil(prepared.length / BATCH_SIZE);
    for (let b = 0; b < totalBatches; b++) {
      const chunk = prepared.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const tx = client.transaction();
      for (const item of chunk) tx.createOrReplace(item.doc);
      try {
        await tx.commit({ visibility: "async" });
        for (const item of chunk) {
          if (item.action === "created") created += 1;
          else updated += 1;
        }
        console.log(
          `Batch ${b + 1}/${totalBatches}: ${chunk.length} createOrReplace`,
        );
      } catch (err) {
        console.error(
          `Batch ${b + 1} failed, retrying row-by-row:`,
          err instanceof Error ? err.message : err,
        );
        for (const item of chunk) {
          try {
            await client.createOrReplace(item.doc);
            if (item.action === "created") created += 1;
            else updated += 1;
          } catch (rowErr) {
            errors.push({
              rowNumber: item.row.rowNumber,
              sku: item.row.sku,
              message:
                rowErr instanceof Error ? rowErr.message : "write failed",
            });
          }
        }
      }
    }
  }

  console.log("\n========== IMPORT SUMMARY ==========");
  if (DRY_RUN) console.log("Mode            : dry-run");
  console.log(`Imported        : ${created + updated}`);
  console.log(`  created       : ${created}`);
  console.log(`  updated       : ${updated}`);
  console.log(`Categories mapped: ${categoryHits.size}`);
  console.log(`Categories created: ${createdCategoryTitles.size}`);
  if (createdCategoryTitles.size) {
    console.log(
      `  new           : ${Array.from(createdCategoryTitles).join(", ")}`,
    );
  }
  console.log(`Errors          : ${errors.length}`);
  for (const e of errors) {
    console.log(`  row ${e.rowNumber} ${e.sku}: ${e.message}`);
  }
  console.log("====================================");

  if (errors.length) process.exitCode = 1;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
