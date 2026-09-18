import { NextResponse } from "next/server";
import { z } from "zod";
import { client } from "@/lib/sanity";
import { errorResponse, getCorrelationId } from "@/lib/api-errors";
import {
  PRODUCTS_SEARCH_INDEX_QUERY,
  type SanityImageField,
  type SearchIndexProduct,
} from "@/lib/sanity-queries";
import {
  SEARCH_DROPDOWN_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  productMatchesQuery,
} from "@/lib/search";

export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().max(SEARCH_MAX_QUERY_LENGTH).optional().default(""),
});

const INDEX_TTL_MS = 60_000;

let cachedIndex: SearchIndexProduct[] | null = null;
let cachedAt = 0;

async function getSearchIndex(): Promise<SearchIndexProduct[]> {
  const now = Date.now();
  if (cachedIndex && now - cachedAt < INDEX_TTL_MS) return cachedIndex;
  const rows = await client.fetch<SearchIndexProduct[]>(
    PRODUCTS_SEARCH_INDEX_QUERY,
  );
  cachedIndex = rows ?? [];
  cachedAt = now;
  return cachedIndex;
}

export type SearchHit = {
  _id: string;
  title: string | null;
  brand: string | null;
  slug: string | null;
  price: number;
  image: SanityImageField;
  categoryTitle: string | null;
};

function toHit(row: SearchIndexProduct): SearchHit {
  const categoryTitle =
    row.categoryTitles?.find(
      (t): t is string => typeof t === "string" && t.length > 0,
    ) ?? null;
  return {
    _id: row._id,
    title: row.title ?? null,
    brand: row.brand ?? null,
    slug: row.slug ?? null,
    price:
      typeof row.price === "number" && Number.isFinite(row.price)
        ? row.price
        : 0,
    image: row.image ?? null,
    categoryTitle,
  };
}

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return errorResponse(
      "Invalid query",
      400,
      "SEARCH_INVALID_QUERY",
      correlationId,
    );
  }

  const normalized = normalizeSearchQuery(parsed.data.q);
  if (normalized.length < SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json({ products: [] as SearchHit[], total: 0 });
  }

  try {
    const index = await getSearchIndex();
    const matched = index.filter((p) => productMatchesQuery(p, parsed.data.q));
    const products = matched.slice(0, SEARCH_DROPDOWN_LIMIT).map(toHit);
    return NextResponse.json({ products, total: matched.length });
  } catch (e) {
    console.error("[search]", e);
    return errorResponse(
      "Failed to search",
      500,
      "SEARCH_FAILED",
      correlationId,
    );
  }
}
