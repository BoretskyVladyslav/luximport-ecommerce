import { Suspense } from "react";
import { client } from "@/lib/sanity";
import {
  PRODUCTS_HOME_TEASER_QUERY,
  type HomeTeaserProduct,
} from "@/lib/sanity-queries";
import { HomeBestSellersSkeleton } from "@/components/ui/skeletons";
import { HomePageFrame, HomeBestSellers } from "./HomeClient";
import { STOREFRONT_REVALIDATE, storefrontFetch } from "@/lib/cache";
import { pageMetadata } from "@/lib/seo";
import { withHeroRev } from "@/lib/hero-assets";
import styles from "./page.module.scss";

export const revalidate = STOREFRONT_REVALIDATE;

export const metadata = pageMetadata({
  title: "Оптовий магазин європейських продуктів",
  description:
    "LuxImport — оптовий імпорт преміальних європейських продуктів з доставкою по Україні.",
  path: "/",
  image: "/images/hero/default/desktop.jpg",
});

async function HomeBestSellersLoader() {
  let products: HomeTeaserProduct[] = [];
  try {
    products = await client.fetch<HomeTeaserProduct[]>(
      PRODUCTS_HOME_TEASER_QUERY,
      {},
      storefrontFetch,
    );
  } catch (e) {
    console.error("Home: failed to fetch products", e);
  }
  return <HomeBestSellers products={products} />;
}

export default function Home() {
  return (
    <div className={styles.pageRouteRoot}>
      <link
        rel="preload"
        as="image"
        href={withHeroRev("/images/hero/default/mobile.webp")}
        type="image/webp"
        media="(max-width: 767px)"
        fetchPriority="high"
        imageSizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 50vw"
      />
      <link
        rel="preload"
        as="image"
        href={withHeroRev("/images/hero/default/desktop.jpg")}
        media="(min-width: 1024px), (orientation: landscape)"
        fetchPriority="high"
      />
      <HomePageFrame>
        <Suspense fallback={<HomeBestSellersSkeleton count={4} />}>
          <HomeBestSellersLoader />
        </Suspense>
      </HomePageFrame>
    </div>
  );
}
