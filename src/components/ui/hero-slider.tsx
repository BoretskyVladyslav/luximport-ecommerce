'use client'

import Link from 'next/link'

const heroCopy = {
    title: 'Елітні продукти з самого серця Європи',
    description: 'Тільки оригінальна якість та перевірені бренди.',
    buttonText: 'Перейти до каталогу',
    href: '/catalog',
} as const

export function HeroSlider() {
    return (
        <section className="relative w-full overflow-hidden flex flex-col bg-[#011B44]">
            {/* Base Layer: Inline Picture that dictates aspect ratio and height */}
            <picture className="w-full h-auto block select-none">
                <source media="(max-width: 767px)" srcSet="/images/hero-bg-mobile.jpg" />
                <img 
                    src="/images/hero-bg-desktop.jpg" 
                    alt="Європейські продукти Lux Import Hero" 
                    className="w-full h-auto block"
                    loading="eager"
                    width={1920}
                    height={1080}
                />
            </picture>

            {/* Premium Editorial Overlay */}
            <div className="absolute inset-0 z-10 w-full h-full flex flex-col justify-start items-center pt-12 px-6 text-center md:justify-center md:items-start md:pt-0 md:px-16 lg:px-20 md:text-left">
                <div className="w-full flex flex-col items-center gap-10 md:items-start md:gap-8 md:w-[60%] lg:w-[45%]">
                    
                    {/* Heading: Sophisticated Serif */}
                    <div className="flex flex-col gap-4 items-center md:items-start">
                        <span className="text-[10px] md:text-[11px] font-bold tracking-[0.4em] text-white/80 uppercase mb-2">
                            Premium Selection
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] max-w-[15ch]">
                            {heroCopy.title}
                        </h1>
                    </div>
                    
                    {/* Subheader: Refined Sans-Serif */}
                    <p className="text-lg sm:text-xl md:text-lg lg:text-xl font-semibold leading-relaxed text-white max-w-[45ch] tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                        {heroCopy.description}
                    </p>

                    {/* Button: High-Conversion Premium Action */}
                    <Link
                        href={heroCopy.href}
                        className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden rounded-md bg-[#C5A059] transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:shadow-[0_15px_40px_rgba(197,160,89,0.4)]"
                    >
                        {/* Button Text */}
                        <span className="relative z-10 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white transition-colors duration-300">
                            {heroCopy.buttonText}
                        </span>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                    </Link>
                </div>
            </div>

            {/* Atmospheric Gradient for Depth */}
            <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/10 md:bg-gradient-to-r md:from-black/40 md:via-transparent md:to-transparent" />
        </section>
    )
}
