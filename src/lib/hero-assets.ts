export const HERO_ASSET_REV = "20260923";

export function withHeroRev(src: string) {
  return `${src}?v=${HERO_ASSET_REV}`;
}
