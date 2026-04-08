import React from 'react'
import Link from 'next/link'
import styles from './footer.module.scss'
import { InstagramIcon, FacebookIcon, ViberIcon } from '@/components/ui/social-icons'

export function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.grid}>
                <div className={styles.column}>
                    <Link href="/" className={styles.logo}>
                        LUXIMPORT
                    </Link>
                    <p className={styles.aboutText}>
                        Ексклюзивні продукти з Європи для вашого столу. Селекція преміум якості.
                    </p>
                </div>

                <nav className={styles.column}>
                    <h4 className={styles.columnTitle}>Навігація</h4>
                    <Link href="/catalog" className={styles.link}>Каталог</Link>
                    <Link href="/about" className={styles.link}>Про нас</Link>
                    <Link href="/contacts" className={styles.link}>Контакти</Link>
                </nav>

                <nav className={styles.column}>
                    <h4 className={styles.columnTitle}>Інформація</h4>
                    <Link href="/terms" className={styles.link}>Публічна оферта</Link>
                    <Link href="/privacy" className={styles.link}>Політика конфіденційності</Link>
                    <Link href="/returns" className={styles.link}>Повернення та обмін</Link>
                </nav>

                <div className={styles.column}>
                    <h4 className={styles.columnTitle}>Контакти</h4>
                    <a href="mailto:oljacenuk88@gmail.com" className={styles.link}>oljacenuk88@gmail.com</a>
                    <p className={styles.text}>Пн-Пт, 9:00 - 18:00</p>
                    <div className={styles.social}>
                        <a href="https://www.instagram.com/iryna_luximport?igsh=OXlrZWpmaXVzZG95" target="_blank" rel="noopener noreferrer" className={styles.link} title="Instagram">
                            <InstagramIcon />
                        </a>
                        <a href="https://www.facebook.com/share/14RHhHNs66Y/" target="_blank" rel="noopener noreferrer" className={styles.link} title="Facebook">
                            <FacebookIcon />
                        </a>
                        <a href="https://invite.viber.com/?g2=AQAIa9r%2FFoLyx1MKtQoVzLSKE3Wfg38mY1N%2FIO4RtY6JHK2rBjNpkkGrkvQZK9mA" target="_blank" rel="noopener noreferrer" className={styles.link} title="Viber">
                            <ViberIcon />
                        </a>
                    </div>
                </div>
            </div>

            <div className={styles.bottomBarWrapper}>
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © 2026 LUXIMPORT. ВСІ ПРАВА ЗАХИЩЕНО.
                    </p>
                    <p className={styles.designer}>
                        DESIGNED BY VLADYSLAV
                    </p>
                </div>
            </div>
        </footer>
    )
}
