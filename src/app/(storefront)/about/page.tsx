import Image from "next/image";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.scss";

export const metadata = pageMetadata({
  title: "Про нас",
  description:
    "LuxImport — ексклюзивна селекція європейських продуктів оптом. Прямі поставки та контроль якості.",
  path: "/about",
  image: "/images/about/hero.png",
});

export default function AboutPage() {
  return (
    <>
      <section className={styles.heroSection}>
        <Image
          src="/images/about/hero.png"
          alt="LuxImport — смак Європи для вашого столу"
          width={1920}
          height={886}
          sizes="100vw"
          className={styles.heroImage}
          priority
        />
      </section>

      <div className={styles.introSection}>
        <div className={styles.contentWrapper}>
          <div className={styles.meta}>ПРО КОМПАНІЮ</div>
          <h1 className={styles.title}>
            Ексклюзивна селекція для вашого столу
          </h1>
          <p className={styles.description}>
            Ми відбираємо найкращі продукти з усієї Європи, щоб ви могли
            насолоджуватися преміальною якістю кожного дня. Кожен товар у нашому
            каталозі проходить особистий контроль.
          </p>
          <div className={styles.signature}>Founder</div>
        </div>
      </div>

      <section className={styles.valuesSection}>
        <div className={styles.valueCard}>
          <div className={styles.valueNumber}>01</div>
          <h2 className={styles.valueTitle}>Безкомпромісна якість</h2>
          <p className={styles.valueText}>
            Співпрацюємо лише з перевіреними виробниками.
          </p>
        </div>
        <div className={styles.valueCard}>
          <div className={styles.valueNumber}>02</div>
          <h2 className={styles.valueTitle}>Прямі поставки</h2>
          <p className={styles.valueText}>
            Контролюємо кожен етап від складу в Європі до вашого столу.
          </p>
        </div>
        <div className={styles.valueCard}>
          <div className={styles.valueNumber}>03</div>
          <h2 className={styles.valueTitle}>Ексклюзивність</h2>
          <p className={styles.valueText}>
            Знаходимо унікальні бренди, які важко знайти у звичайних магазинах.
          </p>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>5+</span>
          <span className={styles.statLabel}>Років на ринку</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>300+</span>
          <span className={styles.statLabel}>Преміальних товарів</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>10k</span>
          <span className={styles.statLabel}>Задоволених клієнтів</span>
        </div>
      </section>
    </>
  );
}
