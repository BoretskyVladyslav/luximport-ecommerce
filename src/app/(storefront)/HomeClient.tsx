import dynamic from "next/dynamic";
import { HeroSlider } from "@/components/ui/hero-slider";
import { ProductCard } from "@/components/ui/product-card";
import type { HomeTeaserProduct } from "@/lib/sanity-queries";
import styles from "./page.module.scss";

const BrandSlider = dynamic(
  () => import("@/components/ui/BrandSlider").then((m) => m.BrandSlider),
  {
    loading: () => (
      <section
        className="h-[220px] border-t border-neutral-100 bg-white md:h-[260px]"
        aria-hidden
      />
    ),
  },
);

export function HomePageFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">
        LuxImport — оптовий магазин європейських продуктів
      </h1>
      <HeroSlider />
      <BrandSlider />

      <section className={styles.advantagesSection}>
        <div className={styles.advantagesGrid}>
          <div className={styles.advantageEditorial}>
            <span className={styles.advantageNumber}>01</span>
            <div className={styles.advantageContent}>
              <h2 className={styles.advantageTitle}>ШВИДКА ДОСТАВКА</h2>
              <p className={styles.advantageText}>
                Ми дбаємо про те, щоб ваше замовлення прибуло вчасно та в
                ідеальному стані.
              </p>
            </div>
          </div>

          <div className={styles.advantageEditorial}>
            <span className={styles.advantageNumber}>02</span>
            <div className={styles.advantageContent}>
              <h2 className={styles.advantageTitle}>ПРЕМІАЛЬНА ЯКІСТЬ</h2>
              <p className={styles.advantageText}>
                Тільки перевірені постачальники та сертифіковані продукти з
                Європи.
              </p>
            </div>
          </div>

          <div className={styles.advantageEditorial}>
            <span className={styles.advantageNumber}>03</span>
            <div className={styles.advantageContent}>
              <h2 className={styles.advantageTitle}>ПІДТРИМКА КЛІЄНТІВ</h2>
              <p className={styles.advantageText}>
                Наші менеджери завжди готові допомогти вам з вибором та
                оформленням замовлення.
              </p>
            </div>
          </div>
        </div>
      </section>

      {children}
    </>
  );
}

export function HomeBestSellers({
  products,
}: {
  products: HomeTeaserProduct[];
}) {
  return (
    <section className={styles.bestSellersSection}>
      <div className={styles.bestSellersHeader}>
        <p className={styles.bestSellersMeta}>SEASONAL SELECTION</p>
        <h2 className={styles.bestSellersTitle}>ХІТИ ПРОДАЖУ</h2>
      </div>
      <div className={styles.bestSellersGrid}>
        {products.map((product, index) => (
          <ProductCard
            key={product._id}
            id={product._id}
            index={index}
            title={product.title ?? ""}
            slug={product.slug ?? undefined}
            price={
              typeof product.price === "number" &&
              Number.isFinite(product.price)
                ? `${product.price} ₴`
                : "—"
            }
            wholesalePrice={product.wholesalePrice}
            wholesaleMinQuantity={product.wholesaleMinQuantity}
            piecesPerBox={product.piecesPerBox}
            weight={product.weight}
            category={product.category}
            image={product.image}
            stock={product.stock}
          />
        ))}
      </div>
    </section>
  );
}
