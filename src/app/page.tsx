import Link from 'next/link'
import { Truck, Star, Headphones } from 'lucide-react'
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

      <section className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>СЕЛЕКЦІЯ</h2>
          <span className={styles.sectionMeta}>04 КАТЕГОРІЇ</span>
        </div>
        <div className={styles.categoriesGrid}>
          {categories.map(({ name, count }) => (
            <div key={name} className={styles.categoryCard}>
              <div className={styles.imagePlaceholder}>IMG</div>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryName}>{name}</span>
                <span className={styles.categoryCount}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>НАШІ ПЕРЕВАГИ</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <Truck size={48} strokeWidth={1} className={styles.advantageIcon} />
            <h3 className={styles.advantageTitle}>Швидка доставка</h3>
            <p className={styles.advantageText}>
              Ми дбаємо про те, щоб ваше замовлення прибуло вчасно та в ідеальному стані.
            </p>
          </div>
          <div className={styles.card}>
            <Star size={48} strokeWidth={1} className={styles.advantageIcon} />
            <h3 className={styles.advantageTitle}>Преміальна якість</h3>
            <p className={styles.advantageText}>
              Тільки перевірені постачальники та сертифіковані продукти з Європи.
            </p>
          </div>
          <div className={styles.card}>
            <Headphones size={48} strokeWidth={1} className={styles.advantageIcon} />
            <h3 className={styles.advantageTitle}>Підтримка клієнтів</h3>
            <p className={styles.advantageText}>
              Наші менеджери завжди готові допомогти вам з вибором та оформленням замовлення.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ХІТИ ПРОДАЖУ</h2>
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.productImage}>Фото товару</div>
              <h3 className={styles.productTitle}>Товар {i}</h3>
              <p className={styles.productPrice}>1 200 ₴</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}