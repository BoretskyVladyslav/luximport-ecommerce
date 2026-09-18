import { urlFor } from "@/lib/sanity";
import type { Product } from "@/types";

export function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function asFiniteNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
}

function asNonNegativeNumber(v: unknown): number | undefined {
  const n = asFiniteNumber(v);
  return n !== undefined && n >= 0 ? n : undefined;
}

function asPositiveInt(v: unknown): number | undefined {
  const n = asFiniteNumber(v);
  if (n === undefined || n <= 0) return undefined;
  return Math.trunc(n);
}

function asStock(v: unknown): number | null | undefined {
  const n = asFiniteNumber(v);
  if (n === undefined) return undefined;
  return Math.max(0, Math.trunc(n));
}

function pickId(input: { id?: unknown; _id?: unknown }): string {
  if (typeof input.id === "string" && input.id.trim()) return input.id.trim();
  if (typeof input._id === "string" && input._id.trim())
    return input._id.trim();
  return "";
}

function pickSlug(slug: unknown): string {
  if (typeof slug === "string") return slug.trim();
  if (slug && typeof slug === "object" && "current" in slug) {
    const current = (slug as { current?: unknown }).current;
    if (typeof current === "string") return current.trim();
  }
  return "";
}

export function resolveCartImageUrl(source: unknown): string | undefined {
  if (isHttpUrl(source)) return source.trim();
  if (!source || typeof source !== "object") return undefined;
  const rec = source as { asset?: { _ref?: unknown; _id?: unknown } };
  const ref = rec.asset?._ref ?? rec.asset?._id;
  if (typeof ref !== "string" || !ref.trim()) return undefined;
  try {
    const url = urlFor(source)
      .width(400)
      .height(400)
      .fit("fillmax")
      .bg("ffffff")
      .format("webp")
      .quality(80)
      .url();
    return isHttpUrl(url) ? url.trim() : undefined;
  } catch {
    return undefined;
  }
}

export type CartProductInput = {
  id?: unknown;
  _id?: unknown;
  title?: unknown;
  slug?: unknown;
  price?: unknown;
  wholesalePrice?: unknown;
  wholesaleMinQuantity?: unknown;
  piecesPerBox?: unknown;
  countInStock?: unknown;
  stock?: unknown;
  category?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  images?: unknown;
};

export function toCartProduct(input: CartProductInput): Product | null {
  const id = pickId(input);
  if (!id) return null;

  const fromImages =
    Array.isArray(input.images) && isHttpUrl(input.images[0])
      ? input.images[0].trim()
      : undefined;
  const imageUrl =
    (isHttpUrl(input.imageUrl) ? input.imageUrl.trim() : undefined) ??
    fromImages ??
    resolveCartImageUrl(input.image);

  const countInStock = asStock(
    input.countInStock !== undefined ? input.countInStock : input.stock,
  );

  return {
    id,
    title: typeof input.title === "string" ? input.title : "",
    slug: pickSlug(input.slug),
    price: asNonNegativeNumber(input.price) ?? 0,
    wholesalePrice: asNonNegativeNumber(input.wholesalePrice),
    wholesaleMinQuantity: asPositiveInt(input.wholesaleMinQuantity),
    piecesPerBox: asPositiveInt(input.piecesPerBox),
    countInStock,
    description: "",
    images: imageUrl ? [imageUrl] : [],
    category: typeof input.category === "string" ? input.category : "",
  };
}
