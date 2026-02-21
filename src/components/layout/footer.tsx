'use client'

import React from 'react'
import styles from './footer.module.scss'

export function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p className={styles.copyright}>
                    © 2026 Luximport. Всі права захищено.
                </p>
            </div>
        </footer>
    )
}
