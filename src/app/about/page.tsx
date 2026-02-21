import styles from './page.module.scss'

export default function AboutPage() {
    return (
        <>
            <div className={styles.container}>
                <div className={styles.imageWrapper}>
                    <div className={styles.imagePlaceholder}>FOUNDER PORTRAIT</div>
                </div>

                <div className={styles.contentWrapper}>
                    <div className={styles.meta}>ПРО КОМПАНІЮ</div>
                    <h1 className={styles.title}>
                        Ексклюзивна селекція для вашого столу
                    </h1>
                    <p className={styles.description}>
                        Ми відбираємо найкращі продукти з усієї Європи, щоб ви могли насолоджуватися преміальною якістю кожного дня. Кожен товар у нашому каталозі проходить особистий контроль.
                    </p>
                    <div className={styles.signature}>Founder</div>
                </div>
            </div>

            <section className={styles.valuesSection}>
                <div className={styles.valueCard}>
                    <div className={styles.valueNumber}>01</div>
                    <div className={styles.valueTitle}>Безкомпромісна якість</div>
                    <p className={styles.valueText}>Співпрацюємо лише з перевіреними виробниками.</p>
                </div>
                <div className={styles.valueCard}>
                    <div className={styles.valueNumber}>02</div>
                    <div className={styles.valueTitle}>Прямі поставки</div>
                    <p className={styles.valueText}>Контролюємо кожен етап від складу в Європі до вашого столу.</p>
                </div>
                <div className={styles.valueCard}>
                    <div className={styles.valueNumber}>03</div>
                    <div className={styles.valueTitle}>Ексклюзивність</div>
                    <p className={styles.valueText}>Знаходимо унікальні бренди, які важко знайти у звичайних магазинах.</p>
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
    )
}
