import styles from './page.module.scss'

export default function ContactsPage() {
    return (
        <div className={styles.container}>

            <div className={styles.header}>
                <h1 className={styles.title}>КОНТАКТИ</h1>
                <p className={styles.meta}>ЗВ&#39;ЯЗОК З НАМИ</p>
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.infoPanel}>
                    <div className={styles.infoBlock}>
                        <div className={styles.label}>Телефон</div>
                        <div className={styles.value}>
                            <a href='tel:+380970000000' className={styles.valueLink}>
                                +38 (097) 000-00-00
                            </a>
                        </div>
                    </div>

                    <div className={styles.infoBlock}>
                        <div className={styles.label}>Email</div>
                        <div className={styles.value}>
                            <a href='mailto:info@luximport.com' className={styles.valueLink}>
                                info@luximport.com
                            </a>
                        </div>
                    </div>

                    <div className={styles.infoBlock}>
                        <div className={styles.label}>Адреса</div>
                        <div className={styles.value}>
                            м. Київ (офіс / склад)
                        </div>
                    </div>

                    <div className={styles.infoBlock}>
                        <div className={styles.label}>Графік роботи</div>
                        <div className={styles.value}>
                            Пн–Пт: 10:00 – 19:00<br />
                            Сб–Нд: Вихідний
                        </div>
                    </div>
                </div>

                <div className={styles.formPanel}>
                    <form>
                        <div className={styles.inputGroup}>
                            <label htmlFor='name' className={styles.inputLabel}>Ім&#39;я</label>
                            <input
                                type='text'
                                id='name'
                                className={styles.inputField}
                                placeholder="Ваше ім'я"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor='email' className={styles.inputLabel}>Email</label>
                            <input
                                type='email'
                                id='email'
                                className={styles.inputField}
                                placeholder='example@mail.com'
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor='message' className={styles.inputLabel}>Повідомлення</label>
                            <textarea
                                id='message'
                                className={styles.textareaField}
                                placeholder='Текст повідомлення...'
                            />
                        </div>

                        <button type='submit' className={styles.submitBtn}>
                            НАДІСЛАТИ
                        </button>
                    </form>
                </div>
            </div>

            <div className={styles.mapPlaceholder}>MAP AREA</div>

        </div>
    )
}
