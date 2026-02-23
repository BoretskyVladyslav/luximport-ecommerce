'use client'

import { motion } from 'framer-motion'
import styles from './page.module.scss'
import { InstagramIcon, FacebookIcon, ViberIcon, TiktokIcon } from '@/components/ui/social-icons'

const premiumEase = [0.25, 0.1, 0.25, 1];

export default function ContactsPage() {
    return (
        <div className={styles.container}>

            <div className={styles.header}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: premiumEase }}
                >
                    КОНТАКТИ
                </motion.h1>
                <motion.p
                    className={styles.meta}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: premiumEase, delay: 0.1 }}
                >
                    ЗВ&#39;ЯЗОК З НАМИ
                </motion.p>
            </div>

            <div className={styles.contentWrapper}>
                <motion.div
                    className={styles.infoPanel}
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    <motion.div
                        className={styles.infoBlock}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        <div className={styles.label}>Телефон</div>
                        <div className={styles.value}>
                            <a href='tel:+380970000000' className={styles.valueLink}>
                                +38 (097) 000-00-00
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.infoBlock}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        <div className={styles.label}>Email</div>
                        <div className={styles.value}>
                            <a href='mailto:info@luximport.com' className={styles.valueLink}>
                                info@luximport.com
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.infoBlock}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        <div className={styles.label}>Адреса</div>
                        <div className={styles.value}>
                            м. Київ (офіс / склад)
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.infoBlock}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        <div className={styles.label}>Графік роботи</div>
                        <div className={styles.value}>
                            Пн–Пт: 10:00 – 19:00<br />
                            Сб–Нд: Вихідний
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.infoBlock}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        <div className={styles.label}>Соцмережі</div>
                        <div className={styles.socialRow}>
                            <a href="https://www.instagram.com/iryna_luximport?igsh=OXlrZWpmaXVzZG95" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Instagram">
                                <InstagramIcon />
                            </a>
                            <a href="https://www.facebook.com/share/14RHhHNs66Y/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Facebook">
                                <FacebookIcon />
                            </a>
                            <a href="https://invite.viber.com/?g2=AQAIa9r%2FFoLyx1MKtQoVzLSKE3Wfg38mY1N%2FIO4RtY6JHK2rBjNpkkGrkvQZK9mA" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Viber">
                                <ViberIcon />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="TikTok">
                                <TiktokIcon />
                            </a>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    className={styles.formPanel}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: premiumEase }}
                    viewport={{ once: true }}
                >
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
                </motion.div>
            </div>

            <motion.div
                className={styles.mapPlaceholder}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, ease: premiumEase }}
                viewport={{ once: true }}
            >
                MAP AREA
            </motion.div>

        </div>
    )
}
