import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { PortableText } from "@portabletext/react";
import { client, urlFor } from "@/lib/sanity";
import {
  PRODUCT_BY_SLUG_QUERY,
  type ProductDetail,
  type SanityImageField,
} from "@/lib/sanity-queries";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { ProductGallery } from "./ProductGallery";
import { JsonLd } from "@/components/seo/json-ld";
import { STOREFRONT_REVALIDATE, storefrontFetch } from "@/lib/cache";
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from "@/lib/seo";
import styles from "./page.module.scss";

export const revalidate = STOREFRONT_REVALIDATE;

function portableTextToPlainText(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const text = value
    .flatMap((block) => {
      if (!block || typeof block !== "object") return [];
      const children = (block as { _type?: string; children?: unknown[] })
        .children;
      if (!Array.isArray(children)) return [];
      return children
        .map((child) => {
          if (!child || typeof child !== "object") return "";
          return typeof (child as { text?: unknown }).text === "string"
            ? (child as { text: string }).text
            : "";
        })
        .filter(Boolean);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length ? text : null;
}

function hasImageAsset(img: SanityImageField | undefined | null): boolean {
  return Boolean(img && img.asset?._ref);
}

function imageUrl(img: SanityImageField, size: number) {
  return urlFor(img)
    .width(size)
    .height(size)
    .fit("fillmax")
    .bg("ffffff")
    .format("webp")
    .quality(90)
    .url();
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const doc = await client.fetch<ProductDetail | null>(
      PRODUCT_BY_SLUG_QUERY,
      { slug },
      storefrontFetch,
    );
    if (!doc?.slug?.current) {
      return null;
    }
    return doc;
  } catch (e) {
    console.error("getProduct fetch failed", e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) {
    return { robots: { index: false, follow: false } };
  }
  const title = product.title ?? "Товар";
  const plainDescription =
    typeof product.description === "string"
      ? product.description
      : portableTextToPlainText(product.description);
  const description = plainDescription ?? `Купити ${title} оптом в LuxImport.`;
  const image = hasImageAsset(product.image)
    ? imageUrl(product.image, 1200)
    : undefined;
  const path = `/products/${product.slug?.current ?? params.slug}`;
  return pageMetadata({
    title,
    description,
    path,
    image,
  });
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const displayTitle = product.title ?? "Товар";
  const isOutOfStock =
    typeof product.stock === "number" && Number.isFinite(product.stock)
      ? product.stock <= 0
      : false;

  const gallerySources: SanityImageField[] = [];
  const seenAsset = new Set<string>();
  for (const img of [product.image, ...(product.gallery ?? [])]) {
    if (!hasImageAsset(img) || !img?.asset?._ref) continue;
    if (seenAsset.has(img.asset._ref)) continue;
    seenAsset.add(img.asset._ref);
    gallerySources.push(img);
  }

  const galleryUrls = gallerySources.map((img) => imageUrl(img, 900));

  const categoryHref = product.categorySlug
    ? `/catalog?category=${encodeURIComponent(product.categorySlug)}`
    : "/catalog";

  return (
    <div className={styles.pageRouteRoot}>
      <div className={styles.page}>
        <JsonLd
          data={productJsonLd({
            name: displayTitle,
            description: portableTextToPlainText(product.description),
            sku: product.sku,
            brand: product.brand,
            images: galleryUrls,
            price: Number.isFinite(product.price) ? product.price : 0,
            availability: isOutOfStock ? "OutOfStock" : "InStock",
            path: `/products/${product.slug.current}`,
          })}
        />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Головна", path: "/" },
            { name: "Каталог", path: "/catalog" },
            ...(product.category
              ? [
                  {
                    name: product.category,
                    path: categoryHref,
                  },
                ]
              : []),
            {
              name: displayTitle,
              path: `/products/${product.slug.current}`,
            },
          ])}
        />
        <nav className={styles.crumbs} aria-label="Навігація">
          <Link href="/" className={styles.crumbLink}>
            Головна
          </Link>
          <span className={styles.crumbSep} aria-hidden>
            /
          </span>
          <Link href="/catalog" className={styles.crumbLink}>
            Каталог
          </Link>
          {product.category ? (
            <>
              <span className={styles.crumbSep} aria-hidden>
                /
              </span>
              <Link href={categoryHref} className={styles.crumbLink}>
                {product.category}
              </Link>
            </>
          ) : null}
          <span className={styles.crumbSep} aria-hidden>
            /
          </span>
          <span className={styles.crumbCurrent}>{displayTitle}</span>
        </nav>

        <div className={styles.pdpGrid}>
          <ProductGallery
            images={galleryUrls}
            title={displayTitle}
            isOutOfStock={isOutOfStock}
          />

          <div className={styles.info}>
            {product.brand ? (
              <p className={styles.brand}>{product.brand}</p>
            ) : null}
            <h1 className={styles.title}>{displayTitle}</h1>
            {product.origin ? (
              <span className={styles.origin}>{product.origin}</span>
            ) : null}
            {typeof product.description === "string" &&
            product.description.trim() ? (
              <p className={styles.description}>{product.description}</p>
            ) : Array.isArray(product.description) &&
              product.description.length ? (
              <div className={styles.prose}>
                <PortableText value={product.description as any} />
              </div>
            ) : null}

            <AddToCartButton
              id={product._id}
              title={displayTitle}
              slug={product.slug.current}
              price={Number.isFinite(product.price) ? product.price : 0}
              wholesalePrice={
                typeof product.wholesalePrice === "number" &&
                Number.isFinite(product.wholesalePrice)
                  ? product.wholesalePrice
                  : undefined
              }
              wholesaleMinQuantity={
                typeof product.wholesaleMinQuantity === "number" &&
                Number.isFinite(product.wholesaleMinQuantity) &&
                product.wholesaleMinQuantity > 0
                  ? Math.trunc(product.wholesaleMinQuantity)
                  : undefined
              }
              piecesPerBox={
                typeof product.piecesPerBox === "number" &&
                Number.isFinite(product.piecesPerBox) &&
                product.piecesPerBox > 0
                  ? Math.trunc(product.piecesPerBox)
                  : undefined
              }
              countInStock={
                typeof product.stock === "number" &&
                Number.isFinite(product.stock)
                  ? Math.max(0, Math.trunc(product.stock))
                  : null
              }
              category={product.category ?? undefined}
              imageUrl={galleryUrls[0]}
              image={product.image ?? undefined}
            />

            <div className={styles.specs}>
              {product.sku ? <p>Артикул: {product.sku}</p> : null}
              {product.weight ? <p>Вага/Об&apos;єм: {product.weight}</p> : null}
              {product.piecesPerBox ? (
                <p>В ящику: {product.piecesPerBox} шт.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
