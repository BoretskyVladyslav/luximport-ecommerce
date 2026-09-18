export const SEARCH_MAX_QUERY_LENGTH = 80;
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_DROPDOWN_LIMIT = 8;

export type SearchableProduct = {
  title?: string | null;
  brand?: string | null;
  categories?: Array<{ title?: string | null } | null> | null;
  categoryTitles?: Array<string | null> | null;
};

export function catalogSearchHref(query: string): string {
  const q = query.trim().slice(0, SEARCH_MAX_QUERY_LENGTH);
  if (!q) return "/catalog";
  return `/catalog?search=${encodeURIComponent(q)}`;
}

export function normalizeSearchQuery(q: string): string {
  return q
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("uk")
    .slice(0, SEARCH_MAX_QUERY_LENGTH);
}

export function productMatchesQuery(
  product: SearchableProduct,
  query: string,
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return false;
  const tokens = q.split(" ").filter(Boolean);
  const haystack = [
    product.title,
    product.brand,
    ...(product.categoryTitles ?? []),
    ...(product.categories?.map((c) => c?.title) ?? []),
  ]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ")
    .toLocaleLowerCase("uk");
  return tokens.every((token) => haystack.includes(token));
}
