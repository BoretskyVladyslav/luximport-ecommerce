'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const premiumEase = [0.25, 0.1, 0.25, 1]

interface Slide {
    id: string
    metaLabel: string
    title: string
    subtitle: string
    ctaText: string
    ctaHref: string
    image: string
}

const slides: Slide[] = [
    {
        id: 'dr-gerard',
        metaLabel: 'OFFICIAL DISTRIBUTOR',
        title: "Офіційний дистриб'ютор Dr. Gerard",
        subtitle: 'Ексклюзивні формати для будь-яких потреб: від індивідуальних до сімейних упаковок.',
        ctaText: 'Переглянути продукцію',
        ctaHref: '/catalog',
        image: 'https://images.unsplash.com/photo-1615840287214-7ff58936c4cf?q=80&w=2187&auto=format&fit=crop',
    },
    {
        id: 'luximport-hero',
        metaLabel: 'PREMIUM SELECTION',
        title: 'LUXIMPORT',
        subtitle: 'Селекція преміальних продуктів з Європи для справжніх поціновувачів та гурманів.',
        ctaText: 'Відкрити каталог',
        ctaHref: '/catalog',
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=2000&auto=format&fit=crop',
    },
    {
        id: 'brands-coming',
        metaLabel: 'NEW ARRIVALS',
        title: 'Розширення асортименту',
        subtitle: 'Ми постійно поповнюємо наше портфоліо кращими європейськими брендами.',
        ctaText: 'Про компанію',
        ctaHref: '/about',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop',
    },
]

const AUTO_PLAY_MS = 7000

export function HeroSlider() {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(1)
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const isPausedRef = useRef(false)

    const goTo = useCallback(
        (index: number, newDirection: number) => {
            setDirection(newDirection)
            setCurrent((prev) => {
                let nextIndex = index
                if (nextIndex < 0) nextIndex = slides.length - 1
                if (nextIndex >= slides.length) nextIndex = 0
                return nextIndex
            })
        },
        []
    )

    const next = useCallback(() => goTo(current + 1, 1), [current, goTo])
    const prev = useCallback(() => goTo(current - 1, -1), [current, goTo])

    useEffect(() => {
        const start = () => {
            autoPlayRef.current = setInterval(() => {
                if (!isPausedRef.current) {
                    goTo(current + 1, 1)
                }
            }, AUTO_PLAY_MS)
        }
        start()
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current)
        }
    }, [current, goTo])

    const pauseAutoPlay = () => {
        isPausedRef.current = true
    }
    const resumeAutoPlay = () => {
        isPausedRef.current = false
    }

    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 1.05,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (dir: number) => ({
            zIndex: 0,
            x: dir < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    }

    return (
        <section
            className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-stone-900 group"
            onMouseEnter={pauseAutoPlay}
            onMouseLeave={resumeAutoPlay}
            onTouchStart={pauseAutoPlay}
            onTouchEnd={resumeAutoPlay}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={current}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.6 },
                        scale: { duration: 0.8, ease: premiumEase }
                    }}
                    className="absolute inset-0 w-full h-full"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x)
                        if (swipe < -10000) {
                            next()
                        } else if (swipe > 10000) {
                            prev()
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-stone-300 w-full h-full" />
                    <div className="absolute inset-0 bg-black/40" />

                    <div className="absolute inset-0 flex flex-col items-start justify-center h-full px-4 sm:px-8 max-w-7xl mx-auto z-10">
                        <motion.div
                            className="max-w-2xl"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: premiumEase }}
                        >
                            <span className="mb-4 inline-block tracking-[0.2em] text-[10px] sm:text-xs font-semibold text-stone-300 uppercase">
                                {slides[current].metaLabel}
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                                {slides[current].title}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
                                {slides[current].subtitle}
                            </p>
                            <Link
                                href={slides[current].ctaHref}
                                className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-md hover:bg-gray-100 transition-colors"
                            >
                                {slides[current].ctaText}
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <button
                className="absolute left-4 sm:left-8 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/20 opacity-0 sm:group-hover:opacity-100"
                onClick={prev}
                aria-label="Попередній слайд"
            >
                <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
                className="absolute right-4 sm:right-8 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/20 opacity-0 sm:group-hover:opacity-100"
                onClick={next}
                aria-label="Наступний слайд"
            >
                <ChevronRight size={20} strokeWidth={1.5} />
            </button>

            <div className="absolute bottom-6 sm:bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        className={`h-1.5 transition-all duration-500 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                            } rounded-full`}
                        onClick={() => goTo(i, i > current ? 1 : -1)}
                        aria-label={`Слайд ${i + 1}`}
                    />
                ))}
            </div>
        </section>
    )
}

const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
}
