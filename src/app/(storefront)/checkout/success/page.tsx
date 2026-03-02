'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useOrderStore } from '@/store/orderStore'
import { useCartStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'

export default function CheckoutSuccessPage() {
    const { lastOrder } = useOrderStore()
    const { clearCart } = useCartStore()
    const isHydrated = useHydration()

    useEffect(() => {
        if (isHydrated) {
            clearCart()
        }
    }, [isHydrated, clearCart])

    if (!isHydrated) return null

    if (!lastOrder) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <h1 className="text-2xl font-light mb-6 uppercase tracking-wider">Замовлення не знайдено</h1>
                <Link href="/" className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 uppercase tracking-wider text-xs px-8 h-12 rounded-none">
                    Повернутися до каталогу
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white"
            >
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-light text-slate-900 mb-4 tracking-tight">
                        Дякуємо за замовлення!
                    </h1>
                    <p className="text-slate-600 leading-relaxed text-lg font-light">
                        Ваше замовлення <span className="text-slate-900 font-medium">{lastOrder.id}</span> успішно оформлено. Ми зв&#39;яжемося з вами найближчим часом.
                    </p>
                </div>

                <div className="border border-slate-200/60 p-6 md:p-8 mb-8">
                    <h2 className="text-lg font-medium text-slate-900 mb-6 border-b border-slate-200/60 pb-4 tracking-wide uppercase text-sm">
                        Деталі замовлення
                    </h2>

                    <div className="space-y-6 mb-8 text-slate-600 font-light">
                        {lastOrder.items.map((item: any) => {
                            const isWholesale = item.wholesaleMinQuantity && item.quantity >= item.wholesaleMinQuantity
                            const applyPrice = isWholesale ? item.wholesalePrice : item.price
                            const itemTotal = (applyPrice || 0) * item.quantity
                            const imageSrc = item.images && item.images.length > 0 ? item.images[0] : '/placeholder.jpg'

                            return (
                                <div key={item.id} className="flex gap-4 items-center">
                                    <div className="relative w-20 h-24 bg-slate-50 flex-shrink-0">
                                        <Image
                                            src={imageSrc}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-base text-slate-900 font-medium">{item.title}</h3>
                                        <p className="text-sm mt-1">Кількість: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base text-slate-900 font-medium">{itemTotal.toLocaleString('uk-UA')} ₴</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t border-slate-200/60 pt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 font-light text-base">Разом</span>
                            <span className="text-slate-900 font-medium text-xl">{lastOrder.total}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="border border-slate-200/60 p-6">
                        <h2 className="text-lg font-medium text-slate-900 mb-4 tracking-wide uppercase text-sm">
                            Контактні дані
                        </h2>
                        <div className="space-y-2 text-slate-600 font-light text-base z-10 relative">
                            <p><span className="mr-2">Ім&#39;я:</span> <span className="text-slate-900 font-medium">{lastOrder.customerName}</span></p>
                            <p><span className="mr-2">Телефон:</span> <span className="text-slate-900 font-medium">{lastOrder.customerPhone || '—'}</span></p>
                        </div>
                    </div>
                    <div className="border border-slate-200/60 p-6">
                        <h2 className="text-lg font-medium text-slate-900 mb-4 tracking-wide uppercase text-sm">
                            Доставка
                        </h2>
                        <div className="space-y-2 text-slate-600 font-light text-base">
                            <p className="leading-relaxed"><span className="text-slate-900 font-medium">{lastOrder.shippingAddress}</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Link href="/" className="inline-flex items-center justify-center uppercase tracking-wider text-sm px-12 h-14 rounded-none bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium">
                        Повернутися до каталогу
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
