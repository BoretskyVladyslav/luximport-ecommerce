import { isHttpUrl } from "@/lib/cart/product-to-cart";
import { urlFor } from "@/lib/sanity";

export function hasSanityImageAsset(source: unknown): boolean {
  if (!source || typeof source !== "object") return false;
  const rec = source as { asset?: { _ref?: unknown; _id?: unknown } };
  const ref = rec.asset?._ref ?? rec.asset?._id;
  return typeof ref === "string" && ref.trim().length > 0;
}

export function sanityImageUrl(
  source: unknown,
  opts?: { width?: number; height?: number },
): string | null {
  if (isHttpUrl(source)) return source.trim();
  if (!hasSanityImageAsset(source)) return null;
  try {
    let builder = urlFor(source);
    if (opts?.width) builder = builder.width(opts.width);
    if (opts?.height) builder = builder.height(opts.height);
    const url = builder
      .fit("fillmax")
      .bg("ffffff")
      .format("webp")
      .quality(90)
      .url();
    return isHttpUrl(url) ? url : null;
  } catch {
    return null;
  }
}
