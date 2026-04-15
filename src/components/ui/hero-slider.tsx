'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const HERO_IMAGE_SRC = '/images/hero-bg.jpg'

const heroCopy = {
    title: 'Елітні продукти з самого серця Європи',
    description: 'Тільки оригінальна якість та перевірені бренди.',
    buttonText: 'Перейти до каталогу',
    href: '/catalog',
} as const

export function HeroSlider() {
    const [heroImageOk, setHeroImageOk] = useState(false)

    useEffect(() => {
        let mounted = true
        fetch(HERO_IMAGE_SRC, { method: 'HEAD' })
            .then((r) => {
                if (mounted) setHeroImageOk(r.ok)
            })
            .catch(() => {
                if (mounted) setHeroImageOk(false)
            })
        return () => {
            mounted = false
        }
    }, [])

    return (
        <section className="relative w-full overflow-hidden bg-stone-100 min-h-[500px] md:min-h-[70vh]">
            {heroImageOk && (
                <Image
                    src={HERO_IMAGE_SRC}
                    alt="Європейські продукти Lux Import"
                    fill
                    className="object-cover object-right"
                    sizes="100vw"
                    priority
                />
            )}

            <div className="absolute inset-0 z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-start justify-center px-5 sm:px-8 lg:px-12">
                <div className="w-full max-w-xl md:w-1/2">
                    <h1 className="mb-5 text-3xl font-bold leading-tight text-[#FFFFFF] font-heading sm:text-4xl md:text-5xl lg:text-6xl">
                        {heroCopy.title}
                    </h1>
                    <p className="text-base font-medium leading-relaxed text-[#FFFFFF] sm:text-lg">
                        {heroCopy.description}
                    </p>
                    <Link
                        href={heroCopy.href}
                        className="inline-block mt-6 w-max rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 hover:bg-neutral-800"
                    >
                        {heroCopy.buttonText}
                    </Link>
                </div>
            </div>
        </section>
    )
}
