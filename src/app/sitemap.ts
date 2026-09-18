import { MetadataRoute } from "next";
import { client } from "@/lib/sanity";
import { GROQ_ORDER_MANUAL_SORT_THEN_NEWEST } from "@/lib/sanity-queries";
import { getSiteUrl } from "@/lib/site-url";
import { STOREFRONT_REVALIDATE, storefrontFetch } from "@/lib/cache";

export const revalidate = STOREFRONT_REVALIDATE;

type SitemapDoc = { slug: string; _updatedAt?: string };

function lastMod(value?: string) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const products = await client.fetch<SitemapDoc[]>(
    `*[_type == "product" && defined(slug.current)] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}){ "slug": slug.current, _updatedAt }`,
    {},
    storefrontFetch,
  );

  const categorySlugs = await client.fetch<SitemapDoc[]>(
    `*[_type in ["category", "subcategory"] && defined(slug.current)] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}){ "slug": slug.current, _updatedAt }`,
    {},
    storefrontFetch,
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contacts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: lastMod(product._updatedAt),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((row) => ({
    url: `${baseUrl}/catalog?category=${encodeURIComponent(row.slug)}`,
    lastModified: lastMod(row._updatedAt),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
