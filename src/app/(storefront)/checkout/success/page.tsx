'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useOrderStore } from '@/store/orderStore'
import { useStore } from '@/store/cart'
import { useCheckoutDraftStore } from '@/store/checkout'
import { useHydration } from '@/hooks/useHydration'
import { useUser } from '@/hooks/useUser'
import { revalidateProfilePath } from './actions'
import { Skeleton } from '@/components/ui/skeletons'
import styles from './page.module.scss'

const deepEmerald = '#064e3b'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.08 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
}

function formatOrderDisplay(lastId: string | undefined, urlOrder: string): string {
    const raw = (lastId?.trim() || urlOrder.trim()).replace(/^#/, '')
    if (!raw) return ''
    return raw.startsWith('#') ? raw : `#${raw}`
}

export default function CheckoutSuccessPage() {
    const { lastOrder } = useOrderStore()
    const clearCart = useStore((state) => state.clearCart)
    const isHydrated = useHydration()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refresh } = useUser()
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [resolvedPaymentState, setResolvedPaymentState] = useState<'loading' | 'paid' | 'pending' | 'failed'>('loading')
    const didPostPurchaseCleanup = useRef(false)

    const orderFromUrl = searchParams.get('order')?.trim() ?? ''

    useEffect(() => {
        if (!isHydrated) return
        void router.refresh()
    }, [isHydrated, router])

    useEffect(() => {
        if (!isHydrated) return
        if (didPostPurchaseCleanup.current) return
        const fromWfp = searchParams.get('from') === 'wfp'
        let expectFlag = false
        try {
            expectFlag = sessionStorage.getItem('luximport_checkout_expect_success') === '1'
        } catch {
            expectFlag = false
        }
        if (!fromWfp && !expectFlag) return
        didPostPurchaseCleanup.current = true
        try {
            sessionStorage.removeItem('luximport_checkout_expect_success')
        } catch {
            void 0
        }
        void router.refresh()
        clearCart()
        useCheckoutDraftStore.getState().clearDraft()
        toast.success('Замовлення успішно оформлено!')
    }, [isHydrated, router, clearCart, searchParams])

    useEffect(() => {
        if (!isHydrated) return
        let cancelled = false
        void (async () => {
            try {
                await refresh()
            } finally {
                if (!cancelled) setIsCheckingSession(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [isHydrated, refresh])

    useEffect(() => {
        if (!isHydrated) return
        if (!orderFromUrl) {
            setResolvedPaymentState(lastOrder?.isPaid ? 'paid' : 'pending')
            return
        }
        let cancelled = false
        let attempts = 0
        const maxAttempts = 8
        let timer: number | null = null
        const runCheck = async () => {
            const res = await fetch(`/api/orders/by-reference?order=${encodeURIComponent(orderFromUrl)}`, {
                method: 'GET',
                cache: 'no-store',
            }).catch(() => null)
            const data = await res?.json().catch(() => null)
            const order = data?.order
            if (cancelled) return
            if (!order) {
                setResolvedPaymentState('pending')
                return false
            }
            if (order.isPaid === true || order.paymentStatus === 'paid' || order.status === 'processing' || order.status === 'shipped') {
                setResolvedPaymentState('paid')
                return true
            }
            if (order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled') {
                setResolvedPaymentState('failed')
                return true
            }
            setResolvedPaymentState('pending')
            return false
        }
        void (async () => {
            const done = await runCheck()
            if (done || cancelled) return
            timer = window.setInterval(async () => {
                attempts += 1
                const complete = await runCheck()
                if (complete || attempts >= maxAttempts) {
                    if (timer !== null) window.clearInterval(timer)
                }
            }, 2500)
        })()
        return () => {
            cancelled = true
            if (timer !== null) window.clearInterval(timer)
        }
    }, [isHydrated, orderFromUrl, lastOrder?.isPaid])

    useEffect(() => {
        if (!isHydrated) return
        void revalidateProfilePath()
    }, [isHydrated])

    const orderDisplay = formatOrderDisplay(lastOrder?.id, orderFromUrl)
    const hasOrderContext = Boolean(lastOrder || orderFromUrl)

    if (!isHydrated) {
        return (
            <div className={styles.shell}>
                <div className={styles.inner}>
                    <Skeleton className={`${styles.skelIcon} rounded-full`} />
                    <Skeleton className={`${styles.skelTitle} rounded-sm`} />
                    <Skeleton className={`${styles.skelLine} rounded-sm`} />
                    <Skeleton className={`${styles.skelLineShort} rounded-sm`} />
                    <div className={styles.skelButtons}>
                        <Skeleton className={`${styles.skelBtn} rounded-none`} />
                        <Skeleton className={`${styles.skelBtn} rounded-none`} />
                    </div>
                </div>
            </div>
        )
    }

    if (isCheckingSession) {
        return (
            <div className={styles.shell}>
                <div className={styles.inner}>
                    <p className={styles.loadingText}>Перевіряємо сесію...</p>
                </div>
            </div>
        )
    }

    if (resolvedPaymentState === 'loading') {
        return (
            <div className={styles.shell}>
                <div className={styles.inner}>
                    <p className={styles.loadingText}>Перевіряємо статус оплати...</p>
                </div>
            </div>
        )
    }

    if (!hasOrderContext) {
        return (
            <div className={styles.shell}>
                <motion.div
                    className={styles.inner}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className={styles.fallbackTitle}>Замовлення не знайдено</h1>
                    <p className={styles.fallbackSub}>Перейдіть на головну або до каталогу.</p>
                    <Link href="/" className={styles.btnPrimary}>
                        НА ГОЛОВНУ
                    </Link>
                </motion.div>
            </div>
        )
    }

    if (resolvedPaymentState === 'failed') {
        return (
            <div className={styles.shell}>
                <motion.div className={styles.inner} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className={styles.fallbackTitle}>Оплату не підтверджено</h1>
                    <p className={styles.fallbackSub}>Спробуйте оплатити замовлення повторно в кабінеті.</p>
                    <div className={styles.actions}>
                        <Link href="/account/profile" className={styles.btnPrimary}>ПЕРЕЙТИ ДО ЗАМОВЛЕНЬ</Link>
                        <Link href="/checkout" className={styles.btnSecondary}>СПРОБУВАТИ ЩЕ РАЗ</Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className={styles.shell}>
            <motion.div
                className={styles.inner}
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={itemVariants} className={styles.iconWrap}>
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                    >
                        <CheckCircle2
                            className={styles.icon}
                            strokeWidth={1}
                            size={112}
                            color={deepEmerald}
                            aria-hidden
                        />
                    </motion.div>
                </motion.div>

                <motion.h1 variants={itemVariants} className={styles.heading}>
                    ДЯКУЄМО ЗА ЗАМОВЛЕННЯ!
                </motion.h1>

                <motion.p variants={itemVariants} className={styles.subheading}>
                    {resolvedPaymentState === 'paid'
                        ? 'Ваше замовлення успішно прийнято в обробку. Лист із деталями вже надіслано на вашу пошту.'
                        : 'Платіж обробляється. Ми оновимо статус замовлення автоматично протягом кількох хвилин.'}
                </motion.p>

                <motion.p variants={itemVariants} className={styles.orderLine}>
                    Номер замовлення:{' '}
                    <span className={styles.orderStrong}>{orderDisplay || '—'}</span>
                </motion.p>

                <motion.div variants={itemVariants} className={styles.actions}>
                    <Link href="/account/profile" className={styles.btnPrimary}>
                        ПЕРЕЙТИ ДО ЗАМОВЛЕНЬ
                    </Link>
                    <Link href="/" className={styles.btnSecondary}>
                        ПРОДОВЖИТИ ПОКУПКИ
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    )
}
