import React from 'react'
import styles from '../legal.module.scss'

export const metadata = {
    title: 'Політика конфіденційності | LUXIMPORT',
    description: 'Політика конфіденційності інтернет-магазину LUXIMPORT.',
}

export default function PrivacyPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Політика конфіденційності
            </h1>

            <h2 className={styles.sectionTitle}>
                1. Збір та використання даних
            </h2>
            <p className={styles.text}>
                Ми збираємо лише ті персональні дані, які необхідні для оформлення та доставки ваших замовлень (ім&#39;я, електронна пошта, телефон, адреса доставки).
            </p>

            <h2 className={styles.sectionTitle}>
                2. Захист інформації
            </h2>
            <p className={styles.text}>
                Ми вживаємо відповідних технічних та організаційних заходів для захисту ваших персональних даних від несанкціонованого доступу, зміни, розкриття або знищення.
            </p>

            <h2 className={styles.sectionTitle}>
                3. Використання файлів cookie
            </h2>
            <p className={styles.text}>
                Наш сайт використовує файли cookie для покращення користувацького досвіду, аналітики відвідувань та запам&#39;ятовування ваших налаштувань, таких як товари в кошику.
            </p>

            <h2 className={styles.sectionTitle}>
                4. Передача даних третім особам
            </h2>
            <p className={styles.text}>
                Ми не передаємо ваші персональні дані третім особам, за винятком кур&#39;єрських служб для здійснення доставки замовлення.
            </p>

            <h2 className={styles.sectionTitle}>
                5. Зміни до політики
            </h2>
            <p className={styles.text}>
                Ми залишаємо за собою право оновлювати цю Політику конфіденційності. Будь-які зміни будуть опубліковані на цій сторінці.
            </p>
        </div>
    )
}
