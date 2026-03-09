'use client'

import { useState, useCallback } from 'react'

import { motion, PanInfo } from 'framer-motion'
import { Store, User, Users, Droplets } from 'lucide-react'
import styles from './success-slider.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1]
const SWIPE_THRESHOLD = 50

export function SuccessSlider() {
    const [current, setCurrent] = useState(0)

    const slides = [
        { id: 'dr-gerard' },
        { id: 'juices-placeholder' }
    ]

    const goTo = useCallback((index: number) => {
        const clamped = (index + slides.length) % slides.length
        setCurrent(clamped)
    }, [slides.length])

    const next = useCallback(() => goTo(current + 1), [current, goTo])
    const prev = useCallback(() => goTo(current - 1), [current, goTo])

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const { offset, velocity } = info
        if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
            if (offset.x < 0) next()
            else prev()
        }
    }

    return (
        <section className={styles.sliderSection}>
            <motion.div
                className={styles.track}
                animate={{ x: `-${current * 100}%` }}
                transition={{ duration: 0.6, ease: premiumEase }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={handleDragEnd}
            >
                {/* Slide 1: Dr. Gerard */}
                <div className={styles.slide}>
                    <motion.div
                        className={styles.slideText}
                        initial={{ opacity: 0, x: -20 }}
                        animate={current === 0 ? { opacity: 1, x: 0 } : { opacity: 0.4, x: -20 }}
                        transition={{ duration: 0.6, ease: premiumEase, delay: 0.2 }}
                    >
                        <h2 className={styles.successHeading}>Дякуємо за замовлення!</h2>
                        <h1 className={styles.brandHeading}>Dr. Gerard</h1>
                        <p className={styles.brandSubline}>
                            Єдиний офіційний дистриб&apos;ютор в Україні
                        </p>

                        <div className={styles.featuresList}>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Store size={22} strokeWidth={1.5} />
                                </div>
                                <span className={styles.featureText}>Маленькі формати для касових зон</span>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <User size={22} strokeWidth={1.5} />
                                </div>
                                <span className={styles.featureText}>Індивідуальні упаковки для 1 людини</span>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Users size={22} strokeWidth={1.5} />
                                </div>
                                <span className={styles.featureText}>Великі сімейні грамажі</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className={styles.slideVisual}>
                        <div className="w-full h-full bg-stone-200" />
                        <div className={styles.visualLogoBadge}>
                            <span className={styles.visualLogo}>Luximport</span>
                            <span className={styles.visualLogoSub}>Офіційний дистриб&apos;ютор</span>
                        </div>
                    </div>
                </div>

                {/* Slide 2: Juices Placeholder */}
                <div className={`${styles.slide} ${styles.placeholderSlide}`}>
                    <div className={styles.placeholderIcon}>
                        <Droplets size={64} strokeWidth={1} />
                    </div>
                    <div className={styles.placeholderText}>
                        <p>Натуральні Соки (Placeholder)</p>
                        <p className="text-sm mt-2 font-body text-slate-500">
                            Swipeable banner space for future brand features
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Dot indicators positioned slightly below */}
            <div className={styles.dots} style={{ bottom: '1rem' }}>
                {slides.map((_, i) => (
                    <button
                        key={i}
                        className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                        onClick={() => goTo(i)}
                        aria-label={`Слайд ${i + 1}`}
                    />
                ))}
            </div>
        </section>
    )
}
