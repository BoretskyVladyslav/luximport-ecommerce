'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCartStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { CartRecommendationProduct } from '@/lib/sanity-queries'
import styles from './cart-sidebar.module.scss'

const FREE_SHIPPING_THRESHOLD_UAH = 15000

export function CartSidebar() {
    const { items, isOpen, toggleCart, removeItem, updateQuantity, totalPrice, addItem, validateCart, cartIssues, hasBlockingIssues, stockWarning, isValidating } = useCartStore()
    const isHydrated = useHydration()
    const pathname = usePathname()
    const router = useRouter()
    const [recommendations, setRecommendations] = useState<CartRecommendationProduct[]>([])
    const [recsLoading, setRecsLoading] = useState(false)
    const [validationLoading, setValidationLoading] = useState(false)

    const cartValidationKey = useMemo(() => {
        return items
            .filter((i) => i && typeof i.id === 'string' && i.id.trim())
            .map((i) => `${i.id}:${typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? Math.max(1, Math.trunc(i.quantity)) : 1}`)
            .sort()
            .join('|')
    }, [items])

    useEffect(() => {
        if (isOpen) toggleCart()
    }, [pathname, isOpen, toggleCart])

    useEffect(() => {
        if (!isHydrated) return
        if (!isOpen) return
        if (items.length === 0) return
        let cancelled = false
        setValidationLoading(true)
        const t = setTimeout(() => {
            validateCart()
                .catch(() => undefined)
                .finally(() => {
                    if (!cancelled) setValidationLoading(false)
                })
        }, 250)
        return () => {
            cancelled = true
            clearTimeout(t)
        }
    }, [isHydrated, isOpen, cartValidationKey, items.length, validateCart])

    const recommendationFetchKey = useMemo(() => {
        const ids = Array.from(new Set(items.map((i) => i.id)))
            .sort()
            .join(',')
        const cats = Array.from(
            new Set(items.map((i) => i.category).filter(Boolean) as string[])
        )
            .sort()
            .join(',')
        return `${ids}|${cats}`
    }, [items])

    useEffect(() => {
        if (!isOpen || items.length === 0) {
            setRecommendations([])
            setRecsLoading(false)
            return
        }
        const excludeIds = items.map((i) => i.id)
        const categoryTitles = Array.from(
            new Set(items.map((i) => i.category).filter(Boolean) as string[])
        )

        const ctrl = new AbortController()
        setRecsLoading(true)
        fetch('/api/cart/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ excludeIds, categoryTitles }),
            signal: ctrl.signal,
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((data: { products?: CartRecommendationProduct[] }) => {
                setRecommendations(Array.isArray(data?.products) ? data.products : [])
            })
            .catch(() => {
                if (!ctrl.signal.aborted) setRecommendations([])
            })
            .finally(() => {
                if (!ctrl.signal.aborted) setRecsLoading(false)
            })

        return () => ctrl.abort()
    }, [isOpen, recommendationFetchKey, items])

    const total = totalPrice()
    const amountToFreeShipping = Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD_UAH - total) * 100) / 100)
    const progressPercentage = Math.min(100, (total / FREE_SHIPPING_THRESHOLD_UAH) * 100)

    const handleCheckout = () => {
        toggleCart()
        router.push('/checkout')
    }

    const handleAddRecommendation = (p: CartRecommendationProduct) => {
        const slug = p.slug ?? ''
        const imgUrl = p.image ? urlFor(p.image).width(120).height(150).fit('fillmax').format('webp').quality(85).url() : ''
        addItem({
            id: p._id,
            title: p.title ?? '',
            slug,
            price: p.price,
            wholesalePrice: p.wholesalePrice ?? undefined,
            wholesaleMinQuantity: p.wholesaleMinQuantity ?? undefined,
            piecesPerBox: p.piecesPerBox ?? undefined,
            description: '',
            images: imgUrl ? [imgUrl] : [],
            category: p.category ?? '',
        })
    }

    return (
        <>
            {isOpen && (
                <div className={styles.overlay} onClick={toggleCart} />
            )}

            <div
                className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white`}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-200 px-6 py-5">
                    <span className="font-heading text-xl uppercase tracking-tight text-stone-900">Кошик</span>
                    <button
                        type="button"
                        className="flex text-stone-400 transition-colors hover:text-stone-900"
                        onClick={toggleCart}
                        aria-label="Закрити кошик"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6">
                        <div style={{ display: isHydrated ? 'block' : 'none' }}>
                            {items.length === 0 ? (
                                <p className="mt-8 text-center font-body text-sm text-stone-500">Кошик порожній</p>
                            ) : (
                                <>
                                    {stockWarning && (
                                        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 font-body text-xs text-amber-900">
                                            {stockWarning}
                                        </div>
                                    )}
                                    <motion.ul className="space-y-6 pb-2" layout>
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {items
                                                .filter((item) => item && typeof item.id === 'string' && item.id.trim())
                                                .map((item) => {
                                            const issue = cartIssues[item.id]
                                            const threshold = item.piecesPerBox ?? item.wholesaleMinQuantity
                                            const isWholesale =
                                                item.wholesalePrice && threshold && item.quantity >= threshold
                                            const max =
                                                typeof item.countInStock === 'number' && Number.isFinite(item.countInStock)
                                                    ? Math.max(0, Math.trunc(item.countInStock))
                                                    : 0
                                            const canInc = max > 0 ? item.quantity < max : false
                                            return (
                                                <motion.li
                                                    key={item.id}
                                                    className="flex gap-4 border-b border-stone-100 pb-6 last:border-b-0 last:pb-2"
                                                    layout
                                                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                                                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                                >
                                                    <div className="relative h-[7.5rem] w-20 shrink-0 overflow-hidden bg-stone-100 ring-1 ring-stone-200/80">
                                                        {item.images && item.images.length > 0 ? (
                                                            <Image
                                                                src={item.images[0]}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover"
                                                                sizes="80px"
                                                            />
                                                        ) : (
                                                            <span className="flex h-full items-center justify-center font-body text-[0.5rem] uppercase tracking-widest text-stone-300">
                                                                IMG
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                                                        <div>
                                                            <p className="font-body text-[15px] font-semibold leading-snug text-stone-900">
                                                                {item.title}
                                                            </p>
                                                            {typeof item.piecesPerBox === 'number' && item.piecesPerBox > 0 && (
                                                                <p className="mt-1 font-body text-[0.7rem] uppercase tracking-wide text-stone-500">
                                                                    В ящику: {Math.trunc(item.piecesPerBox)} шт.
                                                                </p>
                                                            )}
                                                            {issue && (
                                                                <p className="mt-1 font-body text-[0.7rem] text-red-600">
                                                                    {issue.message}
                                                                </p>
                                                            )}
                                                            {isWholesale ? (
                                                                <div className="mt-1.5 space-y-0.5">
                                                                    <span className="block font-body text-[0.65rem] font-medium uppercase tracking-wide text-amber-700">
                                                                        Гуртова ціна
                                                                    </span>
                                                                    <span className="block font-body text-xs text-stone-400 line-through">
                                                                        {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                                                                    </span>
                                                                    <span className="font-heading text-lg text-stone-900">
                                                                        {(item.wholesalePrice! * item.quantity).toLocaleString('uk-UA')} ₴
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <p className="mt-1.5 font-heading text-lg text-stone-900">
                                                                    {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="inline-flex items-stretch overflow-hidden rounded-md border-2 border-stone-900">
                                                                <button
                                                                    type="button"
                                                                    className="min-h-[44px] min-w-[44px] font-body text-lg text-stone-900 transition-colors hover:bg-stone-100"
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    aria-label="Зменшити кількість"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="flex min-w-[2.75rem] items-center justify-center border-x-2 border-stone-900 bg-white font-body text-sm font-bold tabular-nums text-stone-900">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="min-h-[44px] min-w-[44px] font-body text-lg text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    aria-label="Збільшити кількість"
                                                                    disabled={!canInc}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="font-body text-xs text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                                                                onClick={() => removeItem(item.id)}
                                                            >
                                                                Видалити
                                                            </button>
                                                        </div>
                                                        {item.wholesalePrice && (() => {
                                                            if (!threshold) return null
                                                            return item.quantity >= threshold ? (
                                                                <p className="font-body text-[0.65rem] uppercase tracking-wide text-emerald-700/90">
                                                                    Оптова знижка застосована ✓
                                                                </p>
                                                            ) : (
                                                                <p className="font-body text-[0.65rem] text-stone-500">
                                                                    Додайте ще {threshold - item.quantity} шт. для оптової ціни
                                                                </p>
                                                            )
                                                        })()}
                                                    </div>
                                                </motion.li>
                                            )
                                        })}
                                        </AnimatePresence>
                                    </motion.ul>

                                    {!recsLoading && recommendations.length > 0 && (
                                        <div className="mx-[-1.5rem] mt-2 border-t border-[#e5e5e5] bg-[#fafafa] px-6 py-3">
                                            <h3 className="mb-2 font-body text-[0.65rem] font-normal uppercase tracking-[0.2em] text-[#888]">
                                                Ідеально пасує
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {recommendations.slice(0, 2).map((p) => (
                                                    <div
                                                        key={p._id}
                                                        className="flex min-w-0 gap-2 border border-[#e5e5e5] bg-white p-2 transition-colors duration-300 hover:bg-[#fafafa]"
                                                    >
                                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-[#f9fafb]">
                                                            {p.image ? (
                                                                <Image
                                                                    src={urlFor(p.image)
                                                                        .width(80)
                                                                        .height(80)
                                                                        .fit('fillmax')
                                                                        .bg('ffffff')
                                                                        .format('webp')
                                                                        .quality(75)
                                                                        .url()}
                                                                    alt={p.title ?? ''}
                                                                    fill
                                                                    className="object-contain object-center"
                                                                    sizes="40px"
                                                                />
                                                            ) : null}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="line-clamp-2 font-body text-[0.7rem] font-medium leading-snug text-[#111]">
                                                                {p.title}
                                                            </p>
                                                            <p className="mt-0.5 font-heading text-xs font-semibold text-[#111]">
                                                                {p.price.toLocaleString('uk-UA')} ₴
                                                            </p>
                                                            <button
                                                                type="button"
                                                                className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center border border-[#111] bg-transparent text-[#111] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#111] hover:text-white"
                                                                onClick={() => handleAddRecommendation(p)}
                                                                aria-label={`Додати ${p.title ?? 'товар'} у кошик`}
                                                            >
                                                                <Plus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {items.length > 0 && (
                        <footer className="sticky bottom-0 z-10 shrink-0 border-t border-stone-200 bg-white px-6 pb-6 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
                            {isHydrated && (
                                <div className="mb-4">
                                    <p className="mb-2 text-center font-body text-[0.65rem] uppercase leading-relaxed tracking-wide text-stone-600">
                                        {amountToFreeShipping > 0
                                            ? `ЗАЛИШИЛОСЬ ${amountToFreeShipping.toLocaleString('uk-UA')} ₴ ДО БЕЗКОШТОВНОЇ ДОСТАВКИ`
                                            : 'БЕЗКОШТОВНА ДОСТАВКА АКТИВОВАНА'}
                                    </p>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                                        <div
                                            className="h-full rounded-full bg-stone-900 transition-[width] duration-300"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="mb-4 flex items-baseline justify-between">
                                <span className="font-body text-xs uppercase tracking-[0.2em] text-stone-500">Разом</span>
                                <span className="font-heading text-2xl text-stone-900">
                                    {total.toLocaleString('uk-UA')} ₴
                                </span>
                            </div>
                            <button
                                type="button"
                                className="w-full bg-stone-900 py-4 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleCheckout}
                                disabled={validationLoading || isValidating || hasBlockingIssues()}
                            >
                                {validationLoading ? 'Перевірка...' : 'Оформити замовлення'}
                            </button>
                        </footer>
                    )}
                </div>
            </div>
        </>
    )
}
