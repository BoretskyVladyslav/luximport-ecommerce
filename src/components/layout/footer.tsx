import React from 'react'
import Link from 'next/link'
import styles from './footer.module.scss'
import { InstagramIcon, FacebookIcon, ViberIcon, TiktokIcon } from '@/components/ui/social-icons'

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

                <div className={styles.column}>
                    <h4 className={styles.columnTitle}>Контакти</h4>
                    <p className={styles.text}>Київ, Україна</p>
                    <a href="mailto:info@luximport.ua" className={styles.link}>info@luximport.ua</a>
                    <a href="tel:+380441234567" className={styles.link}>+38 044 123 45 67</a>
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
                        <a href="#" target="_blank" rel="noopener noreferrer" className={styles.link} title="TikTok">
                            <TiktokIcon />
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
