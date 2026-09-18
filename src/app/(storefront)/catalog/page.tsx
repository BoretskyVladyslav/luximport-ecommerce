import { Suspense } from "react";
import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import {
  GROQ_ORDER_MANUAL_SORT_THEN_NEWEST,
  PRODUCTS_CATALOG_QUERY,
  type CatalogProduct,
} from "@/lib/sanity-queries";
import { CatalogPageSkeleton } from "@/components/ui/skeletons";
import { ClientCatalog } from "./ClientCatalog";
import { STOREFRONT_REVALIDATE, storefrontFetch } from "@/lib/cache";
import { pageMetadata } from "@/lib/seo";

export const revalidate = STOREFRONT_REVALIDATE;

type CatalogSearch = {
  category?: string;
  search?: string;
  sort?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: CatalogSearch;
}): Promise<Metadata> {
  const categorySlug =
    typeof searchParams.category === "string"
      ? searchParams.category.trim()
      : "";
  let categoryTitle: string | null = null;
  if (categorySlug) {
    try {
      const row = await client.fetch<{ title?: string } | null>(
        `*[_type in ["category", "subcategory"] && slug.current == $slug][0]{ title }`,
        { slug: categorySlug },
        storefrontFetch,
      );
      categoryTitle = row?.title?.trim() || null;
    } catch {
      categoryTitle = null;
    }
  }

  const canonicalPath = categorySlug
    ? `/catalog?category=${encodeURIComponent(categorySlug)}`
    : "/catalog";

  return pageMetadata({
    title: categoryTitle ? `${categoryTitle}` : "Каталог",
    description: categoryTitle
      ? `Оптовий каталог ${categoryTitle} — LuxImport.`
      : "Каталог преміальних європейських продуктів оптом від LuxImport.",
    path: canonicalPath,
  });
}

export default async function CatalogPage() {
  let products: CatalogProduct[] = [];
  try {
    products = await client.fetch<CatalogProduct[]>(
      PRODUCTS_CATALOG_QUERY,
      {},
      storefrontFetch,
    );
  } catch (e) {
    console.error("CatalogPage: failed to fetch products", e);
  }

  const categories = await client.fetch(
    `*[_type == "category"] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
            _id,
            title,
            sortOrder,
            _createdAt,
            "slug": slug.current,
            "parent": { "_id": parent._ref }
        }`,
    {},
    storefrontFetch,
  );

  const subcategories = await client.fetch(
    `*[_type == "subcategory"] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
            _id,
            title,
            sortOrder,
            _createdAt,
            "slug": slug.current,
            "parent": { "_id": parent._ref }
        }`,
    {},
    storefrontFetch,
  );

  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <ClientCatalog
        products={products}
        categories={categories}
        subcategories={subcategories}
      />
    </Suspense>
  );
}
