'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
    {
        id: 'premium',
        title: 'Елітні продукти з самого серця Європи',
        description: 'Тільки оригінальна якість та перевірені бренди.',
        buttonText: 'Перейти до каталогу',
        href: '/catalog',
        label: 'Premium Selection',
        bg: '/images/hero-bg-desktop.jpg',
        bgMobile: '/images/hero-bg-mobile.jpg'
    },
    {
        id: 'gerard',
        title: 'Dr. Gerard — Смак Справжньої Європи',
        description: 'Єдиний офіційний дистриб\'ютор бренду Dr. Gerard в Україні.',
        buttonText: 'Дивитись бренди',
        href: '/catalog',
        label: 'Official Distributor',
        bg: '/images/hero-bg-desktop.jpg', // Fallback to same bg if specific ones are missing
        bgMobile: '/images/hero-bg-mobile.jpg'
    }
] as const

export function HeroSlider() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    return (
        <section className="relative w-full overflow-hidden flex flex-col bg-[#011B44]">
            {/* Background Layer: Stacked Images for Anti-Flicker */}
            <div className="relative w-full h-[600px] md:h-[85vh] select-none pointer-events-none">
                {slides.map((slide, index) => (
                    <motion.div
                        key={slide.id}
                        initial={false}
                        animate={{ opacity: currentIndex === index ? 1 : 0 }}
                        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="absolute inset-0 w-full h-full"
                    >
                        {/* Desktop Image */}
                        <div className="hidden md:block relative w-full h-full">
                            <Image
                                src={slide.bg}
                                alt={slide.title}
                                fill
                                priority={true}
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>
                        {/* Mobile Image */}
                        <div className="block md:hidden relative w-full h-full">
                            <Image
                                src={slide.bgMobile}
                                alt={slide.title}
                                fill
                                priority={true}
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Premium Editorial Overlay */}
            <div className="absolute inset-0 z-10 w-full h-full flex flex-col justify-start items-center pt-12 px-6 text-center md:justify-center md:items-start md:pt-0 md:px-16 lg:px-20 md:text-left">
                <div className="w-full flex flex-col items-center gap-10 md:items-start md:gap-8 md:w-[60%] lg:w-[45%]">
                    
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                            className="w-full flex flex-col items-center md:items-start"
                        >
                            {/* Heading: Sophisticated Serif */}
                            <div className="flex flex-col gap-4 items-center md:items-start">
                                <span className="text-[10px] md:text-[11px] font-bold tracking-[0.4em] text-white/80 uppercase mb-2">
                                    {slides[currentIndex].label}
                                </span>
                                <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] max-w-[15ch]">
                                    {slides[currentIndex].title}
                                </h1>
                            </div>
                            
                            {/* Subheader: Refined Sans-Serif */}
                            <p className="mt-8 text-lg sm:text-xl md:text-lg lg:text-xl font-semibold leading-relaxed text-white max-w-[45ch] tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                                {slides[currentIndex].description}
                            </p>

                            {/* Button: High-Conversion Premium Action */}
                            <Link
                                href={slides[currentIndex].href}
                                className="mt-10 group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden rounded-md bg-[#C5A059] transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:shadow-[0_15px_40px_rgba(197,160,89,0.4)]"
                            >
                                {/* Button Text */}
                                <span className="relative z-10 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white transition-colors duration-300">
                                    {slides[currentIndex].buttonText}
                                </span>
                                
                                {/* Shine Effect */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Atmospheric Gradient for Depth */}
            <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/10 md:bg-gradient-to-r md:from-black/40 md:via-transparent md:to-transparent" />
        </section>
    )
}
