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
      <HomePageFrame>
        <Suspense fallback={<HomeBestSellersSkeleton count={4} />}>
          <HomeBestSellersLoader />
        </Suspense>
      </HomePageFrame>
    </div>
  );
}
