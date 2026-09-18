export const STOREFRONT_REVALIDATE = 60;

export const storefrontFetch = {
  next: { revalidate: STOREFRONT_REVALIDATE },
} as const;
