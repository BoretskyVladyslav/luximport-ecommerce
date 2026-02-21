import Link from 'next/link'
import { Marquee } from '@/components/ui/marquee'
import styles from './page.module.scss'

const categories = [
  { name: 'КАВА ТА ЧАЙ', count: '24 ITEMS' },
  { name: 'СОЛОДОЩІ', count: '18 ITEMS' },
  { name: "М'ЯСО ТА СИРИ", count: '31 ITEMS' },
  { name: 'БАКАЛІЯ', count: '42 ITEMS' },
]

export default function Home() {
  return (
    <main>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.metaLabel}>EST. 2026 / PREMIUM SELECTION</p>
          <h1 className={styles.heroTitle}>LUXIMPORT</h1>
          <p className={styles.heroSubtitle}>
            Ексклюзивні продукти з Європи для вашого столу
          </p>
          <Link href="/catalog" className={styles.ctaButton}>
            ПЕРЕГЛЯНУТИ КАТАЛОГ
          </Link>
        </div>
        <div className={styles.heroVisual}>MAIN VISUAL</div>
      </section>

      <Marquee />

      <section className={styles.advantagesSection}>
        <div className={styles.advantagesGrid}>
          <div className={styles.advantageEditorial}>
            <span className={styles.advantageNumber}>01</span>
            <div className={styles.advantageContent}>
              <h3 className={styles.advantageTitle}>ШВИДКА ДОСТАВКА</h3>
              <p className={styles.advantageText}>
                Ми дбаємо про те, щоб ваше замовлення прибуло вчасно та в ідеальному стані.
              </p>
            </div>
          </div>
          <div className={styles.advantageEditorial}>
            <span className={styles.advantageNumber}>02</span>
            <div className={styles.advantageContent}>
              <h3 className={styles.advantageTitle}>ПРЕМІАЛЬНА ЯКІСТЬ</h3>
              <p className={styles.advantageText}>
                Тільки перевірені постачальники та сертифіковані продукти з Європи.
              </p>
            </div>
          </div>
          <div className={styles.advantageEditorial}>
            <span className={styles.advantageNumber}>03</span>
            <div className={styles.advantageContent}>
              <h3 className={styles.advantageTitle}>ПІДТРИМКА КЛІЄНТІВ</h3>
              <p className={styles.advantageText}>
                Наші менеджери завжди готові допомогти вам з вибором та оформленням замовлення.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bestSellersSection}>
        <div className={styles.bestSellersHeader}>
          <p className={styles.bestSellersMeta}>SEASONAL SELECTION</p>
          <h2 className={styles.bestSellersTitle}>ХІТИ ПРОДАЖУ</h2>
        </div>
        <div className={styles.bestSellersGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.bestSellerCard}>
              <div className={styles.bestSellerBadge}>BEST SELLER</div>
              <div className={styles.bestSellerImage}>IMG</div>
              <h3 className={styles.bestSellerName}>ЕКСКЛЮЗИВНИЙ ТОВАР {i}</h3>
              <p className={styles.bestSellerPrice}>1 200 ₴</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}