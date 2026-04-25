'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

const TOTAL_BRANDS = 29
const brands = Array.from({ length: TOTAL_BRANDS }, (_, i) => ({
    id: i + 1,
    src: `/images/brands/brand-${i + 1}.png`
}))

// Triple the brands to allow for a seamless infinite loop
const extendedBrands = [...brands, ...brands, ...brands]

export function BrandSlider() {
    const [activeIndex, setActiveIndex] = useState(TOTAL_BRANDS) // Start at the beginning of the middle set
    const [isTransitioning, setIsTransitioning] = useState(true)

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex((prev) => prev + 1)
            setIsTransitioning(true)
        }, 2500)
        return () => clearInterval(timer)
    }, [])

    // Handle the infinite loop jump
    useEffect(() => {
        if (activeIndex >= TOTAL_BRANDS * 2) {
            const timer = setTimeout(() => {
                setIsTransitioning(false)
                setActiveIndex(TOTAL_BRANDS)
            }, 700) // Match the duration of the transition
            return () => clearTimeout(timer)
        }
    }, [activeIndex])

    const itemWidth = 160 // w-40 = 160px

    return (
        <section className="py-8 md:py-12 bg-white overflow-hidden border-t border-neutral-100">
            <div className="container mx-auto px-6 mb-6 md:mb-8 text-center">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl font-heading font-medium tracking-[0.3em] text-neutral-800 uppercase"
                >
                    Наші Бренди
                </motion.h2>
                <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-2 w-12 md:w-16 h-[1px] md:h-[1.5px] bg-[#C5A059] mx-auto origin-center" 
                />
            </div>

            <div className="relative flex items-center justify-center h-28 md:h-36">
                <div 
                    className={`flex items-center ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{ 
                        transform: `translateX(calc(50% - ${(activeIndex * itemWidth) + (itemWidth / 2)}px))` 
                    }}
                >
                    {extendedBrands.map((brand, index) => {
                        // For the center logic, we use activeIndex
                        // But since we have extendedBrands, we need to handle the visual state correctly
                        const isActive = index === activeIndex
                        
                        return (
                            <div 
                                key={`${brand.id}-${index}`}
                                className="w-40 flex-shrink-0 flex items-center justify-center transition-all duration-700 ease-in-out"
                                style={{
                                    transform: isActive ? 'scale(1.1)' : 'scale(0.95)',
                                    opacity: isActive ? 1 : 0.5,
                                    filter: isActive ? 'grayscale(0)' : 'grayscale(1)'
                                }}
                            >
                                <div className="relative h-14 w-28 md:h-16 md:w-32 lg:h-20 lg:w-40">
                                    <Image
                                        src={brand.src}
                                        alt={`Brand ${brand.id}`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 112px, 160px"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
