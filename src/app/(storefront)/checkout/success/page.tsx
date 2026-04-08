'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useOrderStore } from '@/store/orderStore'
import { useCartStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'
import { useUser } from '@/hooks/useUser'
import { SuccessSlider } from './success-slider'
import { revalidateProfilePath } from './actions'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeletons'
import styles from './page.module.scss'

export default function CheckoutSuccessPage() {
    const { lastOrder } = useOrderStore()
    const { clearCart } = useCartStore()
    const isHydrated = useHydration()
    const { refresh } = useUser()
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [didPostActions, setDidPostActions] = useState(false)

    useEffect(() => {
        if (!isHydrated) return
        let cancelled = false
        const t = setTimeout(async () => {
            if (cancelled) return
            try {
                await refresh()
            } finally {
                if (!cancelled) setIsCheckingSession(false)
            }
        }, 2000)
        return () => {
            cancelled = true
            clearTimeout(t)
        }
    }, [isHydrated, refresh])

    useEffect(() => {
        if (!isHydrated) return
        void revalidateProfilePath()
    }, [isHydrated])

    useEffect(() => {
        if (!isHydrated) return
        if (isCheckingSession) return
        if (didPostActions) return
        clearCart()
        toast.success('Замовлення успішно оформлено!')
        setDidPostActions(true)
    }, [clearCart, didPostActions, isCheckingSession, isHydrated])

    if (!isHydrated) {
        return (
            <div className={styles.fallback}>
                <Skeleton className="h-10 w-72 rounded-md" />
                <div className="mt-6 space-y-3">
                    <Skeleton className="h-4 w-60 rounded-sm" />
                    <Skeleton className="h-4 w-52 rounded-sm" />
                </div>
            </div>
        )
    }
    if (isCheckingSession) {
        return (
            <div className={styles.fallback}>
                <h1>Перевіряємо сесію...</h1>
            </div>
        )
    }

    if (!lastOrder) {
        return (
            <div className={styles.fallback}>
                <h1>Замовлення не знайдено</h1>
                <Link href="/" className={styles.actionButton}>
                    Повернутися до каталогу
                </Link>
            </div>
        )
    }

    return (
        <div className={styles.pageWrapper}>
            <SuccessSlider />
            <div className={styles.receiptContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className={styles.receiptCard}
                >
                    <div className={styles.receiptHeader}>
                        <div className={styles.orderStatusIcon}>
                            <CheckCircle2 strokeWidth={1} size={48} />
                        </div>
                        <p className={styles.orderId}>Замовлення #{lastOrder.id}</p>
                        <h2 className={styles.customerGreeting}>
                            Оформлено успішно
                        </h2>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Деталі замовлення</h3>

                        <table className={styles.orderTable}>
                            <thead>
                                <tr className={styles.tableHeader}>
                                    <th>Товар</th>
                                    <th className={styles.hideMobile}>Ціна</th>
                                    <th>Кіл-ть</th>
                                    <th>Сума</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastOrder.items.map((item: any) => {
                                    const threshold = item.piecesPerBox ?? item.wholesaleMinQuantity
                                    const isWholesale = threshold && item.quantity >= threshold
                                    const applyPrice = isWholesale ? item.wholesalePrice : item.price
                                    const itemTotal = (applyPrice || 0) * item.quantity
                                    const imageSrc = item.images && item.images.length > 0 ? item.images[0] : '/placeholder.jpg'

                                    return (
                                        <tr key={item.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.itemMeta}>
                                                    <div className={styles.itemImage}>
                                                        {item.images && item.images.length > 0 ? (
                                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                                <Image
                                                                    src={item.images[0]}
                                                                    alt={item.title}
                                                                    fill
                                                                    style={{ objectFit: 'cover' }}
                                                                    sizes="80px"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full bg-stone-200" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className={styles.itemName}>{item.title}</h4>
                                                        {isWholesale && (
                                                            <span className={styles.wholesaleBadge}>Гуртова ціна</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.hideMobile}>
                                                <span className={styles.itemPrice}>{applyPrice} ₴</span>
                                            </td>
                                            <td>
                                                <span className={styles.itemQuantity}>{item.quantity}x</span>
                                            </td>
                                            <td>
                                                <span className={styles.itemTotal}>{itemTotal.toLocaleString('uk-UA')} ₴</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        <div className={styles.summaryRow}>
                            <span className={styles.totalLabel}>Разом</span>
                            <span className={styles.totalAmount}>{lastOrder.total}</span>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoBlock}>
                                <h3 className={styles.sectionTitle}>Контактні дані</h3>
                                <div className={styles.infoValue}>
                                    <p>{lastOrder.customerName}</p>
                                    <p>{lastOrder.customerPhone || '—'}</p>
                                    <p className="text-sm mt-1 text-slate-500">{lastOrder.customerPhone || '—'}</p>
                                </div>
                            </div>
                            <div className={styles.infoBlock}>
                                <h3 className={styles.sectionTitle}>Доставка</h3>
                                <div className={styles.infoValue}>
                                    <p>{lastOrder.shippingAddress}</p>
                                    <p className="text-sm mt-1 text-slate-500">Доставка Новою Поштою (за тарифами перевізника)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.receiptFooter}>
                        <Link href="/catalog" className={styles.actionButton}>
                            Повернутися до каталогу
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
