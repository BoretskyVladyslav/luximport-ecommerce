'use client'

import { motion } from 'framer-motion'
import styles from './page.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1];

export default function AboutPage() {
    return (
        <>
            <div className={styles.container}>
                <div className={styles.imageWrapper} style={{ overflow: 'hidden' }}>
                    <motion.div
                        className={styles.imagePlaceholder}
                        initial={{ scale: 1.05, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 1.5, ease: premiumEase }}
                    >
                        FOUNDER PORTRAIT
                    </motion.div>
                </div>

                <motion.div
                    className={styles.contentWrapper}
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
                    }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    <motion.div
                        className={styles.meta}
                        variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        ПРО КОМПАНІЮ
                    </motion.div>
                    <motion.h1
                        className={styles.title}
                        variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        Ексклюзивна селекція для вашого столу
                    </motion.h1>
                    <motion.p
                        className={styles.description}
                        variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        Ми відбираємо найкращі продукти з усієї Європи, щоб ви могли насолоджуватися преміальною якістю кожного дня. Кожен товар у нашому каталозі проходить особистий контроль.
                    </motion.p>
                    <motion.div
                        className={styles.signature}
                        variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                        }}
                    >
                        Founder
                    </motion.div>
                </motion.div>
            </div>

            <motion.section
                className={styles.valuesSection}
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.2 } }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
            >
                <motion.div
                    className={styles.valueCard}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                    }}
                >
                    <div className={styles.valueNumber}>01</div>
                    <div className={styles.valueTitle}>Безкомпромісна якість</div>
                    <p className={styles.valueText}>Співпрацюємо лише з перевіреними виробниками.</p>
                </motion.div>
                <motion.div
                    className={styles.valueCard}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                    }}
                >
                    <div className={styles.valueNumber}>02</div>
                    <div className={styles.valueTitle}>Прямі поставки</div>
                    <p className={styles.valueText}>Контролюємо кожен етап від складу в Європі до вашого столу.</p>
                </motion.div>
                <motion.div
                    className={styles.valueCard}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
                    }}
                >
                    <div className={styles.valueNumber}>03</div>
                    <div className={styles.valueTitle}>Ексклюзивність</div>
                    <p className={styles.valueText}>Знаходимо унікальні бренди, які важко знайти у звичайних магазинах.</p>
                </motion.div>
            </motion.section>

            <motion.section
                className={styles.statsSection}
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.2 } }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
            >
                <motion.div
                    className={styles.statItem}
                    variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: premiumEase } }
                    }}
                >
                    <span className={styles.statNumber}>5+</span>
                    <span className={styles.statLabel}>Років на ринку</span>
                </motion.div>
                <motion.div
                    className={styles.statItem}
                    variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: premiumEase } }
                    }}
                >
                    <span className={styles.statNumber}>300+</span>
                    <span className={styles.statLabel}>Преміальних товарів</span>
                </motion.div>
                <motion.div
                    className={styles.statItem}
                    variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: premiumEase } }
                    }}
                >
                    <span className={styles.statNumber}>10k</span>
                    <span className={styles.statLabel}>Задоволених клієнтів</span>
                </motion.div>
            </motion.section>
        </>
    )
}
