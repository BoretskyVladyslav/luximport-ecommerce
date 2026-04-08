'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const HERO_IMAGE_SRC = '/banners/main-hero.jpg'

const heroCopy = {
    subtitle: 'OFFICIAL DR. GERARD DISTRIBUTOR',
    title: "Офіційний дистриб'ютор",
    description:
        'Dr. Gerard: найкращі європейські смаколики. Ексклюзивні формати для будь-яких потреб: від індивідуальних до сімейних упаковок.',
    buttonText: 'Переглянути продукцію',
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
        <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-stone-900">
            <div
                className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-black"
                aria-hidden
            />

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

            <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full bg-gradient-to-r from-black/80 to-transparent md:w-[60%]"
                aria-hidden
            />

            <div className="absolute inset-0 z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-start justify-center px-5 py-14 sm:px-8 lg:px-12">
                <div className="w-full max-w-xl md:max-w-[min(36rem,55%)]">
                    <p className="mb-4 font-medium uppercase tracking-[0.18em] text-[10px] text-stone-300 sm:text-xs">
                        {heroCopy.subtitle}
                    </p>
                    <h1 className="mb-5 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                        {heroCopy.title}
                    </h1>
                    <p className="mb-8 text-base font-normal leading-relaxed text-gray-200 sm:text-lg">
                        {heroCopy.description}
                    </p>
                    <Link
                        href={heroCopy.href}
                        className="inline-block rounded-md bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-100 sm:text-base"
                    >
                        {heroCopy.buttonText}
                    </Link>
                </div>
            </div>
        </section>
    )
}
