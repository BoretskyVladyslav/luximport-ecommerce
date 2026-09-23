import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const SITE_NAME = "LuxImport";
export const DEFAULT_TITLE = "LuxImport | Оптовий магазин";
export const DEFAULT_DESCRIPTION =
  "Ексклюзивні товари оптом з доставкою по Україні";
export const DEFAULT_OG_IMAGE = "/images/hero/default/desktop.jpg";
export const ORGANIZATION_LOGO = "/images/brand/logo.png";

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: "LuxImport",
  telephone: "+380964652707",
  email: "oljacenuk88@gmail.com",
  addressLocality: "Львів",
  addressCountry: "UA",
  sameAs: [
    "https://www.instagram.com/lux_import_ua",
    "https://www.facebook.com/share/14RHhHNs66Y/",
    "https://www.tiktok.com/@lux_import_ua",
  ],
} as const;

export function absUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: absUrl("/"),
    logo: absUrl(ORGANIZATION_LOGO),
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    address: {
      "@type": "PostalAddress",
      addressLocality: ORGANIZATION.addressLocality,
      addressCountry: ORGANIZATION.addressCountry,
    },
    sameAs: [...ORGANIZATION.sameAs],
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: ORGANIZATION.name,
    url: absUrl("/contacts"),
    telephone: ORGANIZATION.telephone,
    email: ORGANIZATION.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: ORGANIZATION.addressLocality,
      addressCountry: ORGANIZATION.addressCountry,
    },
    openingHours: "Mo-Fr 09:00-18:00",
    sameAs: [...ORGANIZATION.sameAs],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function productJsonLd(input: {
  name: string;
  description?: string | null;
  sku?: string | null;
  brand?: string | null;
  images: string[];
  price: number;
  availability: "InStock" | "OutOfStock";
  path: string;
}) {
  const images = input.images.filter(Boolean);
  const price =
    Number.isFinite(input.price) && input.price > 0 ? input.price : null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description || undefined,
    sku: input.sku || undefined,
    image: images.length ? images : undefined,
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    offers:
      price != null
        ? {
            "@type": "Offer",
            url: absUrl(input.path),
            priceCurrency: "UAH",
            price,
            availability: `https://schema.org/${input.availability}`,
            seller: {
              "@type": "Organization",
              name: ORGANIZATION.name,
              url: absUrl("/"),
            },
          }
        : undefined,
  };
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const canonical = absUrl(opts.path);
  const image = opts.image ?? DEFAULT_OG_IMAGE;
  const index = opts.index !== false;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: `${opts.title} | ${SITE_NAME}`,
      description: opts.description,
      url: canonical,
      locale: "uk_UA",
      type: "website",
      siteName: SITE_NAME,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${opts.title} | ${SITE_NAME}`,
      description: opts.description,
      images: [image],
    },
  };
}
