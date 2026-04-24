'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TOTAL_BRANDS = 29
const brands = Array.from({ length: TOTAL_BRANDS }, (_, i) => `/images/brands/brand-${i + 1}.png`)

export function BrandSlider() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % TOTAL_BRANDS)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    // Visible window offsets
    const offsets = [-2, -1, 0, 1, 2]

    return (
        <section className="py-20 bg-neutral-50 overflow-hidden border-t border-neutral-200">
            <div className="container mx-auto px-6 mb-16 text-center">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-2xl md:text-3xl font-heading font-medium tracking-[0.3em] text-neutral-800 uppercase"
                >
                    Наші Бренди
                </motion.h2>
                <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-4 w-24 h-[2px] bg-[#C5A059] mx-auto origin-center" 
                />
            </div>

            <div className="relative w-full max-w-[1400px] mx-auto px-4 h-48 flex items-center justify-center">
                <div className="flex items-center justify-center gap-6 md:gap-12 lg:gap-16">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {offsets.map((offset) => {
                            const index = (currentIndex + offset + TOTAL_BRANDS) % TOTAL_BRANDS
                            const isActive = offset === 0
                            
                            return (
                                <motion.div
                                    key={`brand-${index}-${offset}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ 
                                        opacity: isActive ? 1 : 0.4, 
                                        scale: isActive ? 1.15 : 0.9,
                                        filter: isActive ? 'grayscale(0)' : 'grayscale(1)',
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    className={`
                                        flex-shrink-0
                                        ${offset < -1 || offset > 1 ? 'hidden lg:block' : ''}
                                        ${offset === -1 || offset === 1 ? 'hidden sm:block' : ''}
                                    `}
                                >
                                    <div className={`
                                        relative p-6 md:p-8 bg-white rounded-2xl shadow-sm transition-all duration-500
                                        ${isActive ? 'shadow-2xl border-b-4 border-[#C5A059] ring-1 ring-black/5' : 'border-b-4 border-transparent'}
                                    `}>
                                        <img
                                            src={brands[index]}
                                            alt={`Brand Logo ${index + 1}`}
                                            className="h-12 md:h-16 lg:h-20 w-auto object-contain pointer-events-none"
                                        />
                                        
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-glow"
                                                className="absolute inset-0 rounded-2xl bg-[#C5A059]/5 blur-2xl -z-10"
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )
}
