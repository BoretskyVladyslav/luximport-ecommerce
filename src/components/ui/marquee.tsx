import React from 'react'
import styles from './marquee.module.scss'

export function Marquee() {
    const text = 'PREMIUM IMPORTED GOODS • EUROPEAN QUALITY • SELECTIVE SELECTION • EXCLUSIVE GASTRONOMY • '

    return (
        <div className={styles.marqueeContainer}>
            <div className={styles.marqueeContent}>
                <span className={styles.marqueeText}>{text}</span>
                <span className={styles.marqueeText}>{text}</span>
                <span className={styles.marqueeText}>{text}</span>
                <span className={styles.marqueeText}>{text}</span>
            </div>
        </div>
    )
}
