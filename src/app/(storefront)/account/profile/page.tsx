'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useUser } from '@/hooks/useUser'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations/profile'
import { useOrderStore } from '@/store/orderStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useHydration } from '@/hooks/useHydration'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { PhoneInput } from '@/components/ui/phone-input'
import { OrdersListSkeleton, Skeleton } from '@/components/ui/skeletons'
import type { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types'
import type { Order as LocalOrder } from '@/store/orderStore'
import type { ProfileOrderLine } from './ProfileOrderCard'
import { normalizeMerchantDomainName, WAYFORPAY_GOOGLE_PAY } from '@/lib/wayforpay-purchase'
import styles from './page.module.scss'

const OrdersListClient = lazy(() => import('./OrdersListClient'))

const premiumEase = [0.25, 0.1, 0.25, 1]

const orderListVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
}

const orderRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

const signOutToLogin = () => {
    if (typeof window === 'undefined') return
    void fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
        void signOut({ callbackUrl: '/account/login' })
    })
}

const FULFILLMENT_SET: ReadonlySet<string> = new Set([
    'pending',
    'paid',
    'processing',
    'shipped',
    'completed',
    'cancelled',
])

function parseFulfillment(raw: string): OrderFulfillmentStatus {
    return FULFILLMENT_SET.has(raw) ? (raw as OrderFulfillmentStatus) : 'pending'
}

function parsePayment(rawPayment: unknown, rawStatus: string): OrderPaymentStatus {
    if (rawPayment === 'pending' || rawPayment === 'paid' || rawPayment === 'cancelled' || rawPayment === 'failed') {
        return rawPayment
    }
    if (rawStatus === 'paid' || rawStatus === 'cancelled' || rawStatus === 'failed') {
        return rawStatus as OrderPaymentStatus
    }
    return 'pending'
}

const orderTabs = [
    { key: 'all', label: 'ВСІ' },
    { key: 'processing', label: 'АКТИВНІ' },
    { key: 'delivered', label: 'ДОСТАВЛЕНІ' },
    { key: 'cancelled', label: 'СКАСОВАНІ' },
]

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

type OrderListEntry = LocalOrder & {
    fulfillment?: OrderFulfillmentStatus
    payment?: OrderPaymentStatus
    isPaid?: boolean
    sanityOrderStatus?: string
    detailLines?: ProfileOrderLine[]
    sanityDocumentId?: string
    totalAmount?: number
}

function mapDetailLinesFromApi(raw: unknown): ProfileOrderLine[] {
    if (!Array.isArray(raw)) return []
    const out: ProfileOrderLine[] = []
    for (let i = 0; i < raw.length; i++) {
        const row = raw[i]
        if (!row || typeof row !== 'object') continue
        const r = row as Record<string, unknown>
        const productId = typeof r.productId === 'string' ? r.productId : `line-${i}`
        const title = typeof r.title === 'string' ? r.title : ''
        const quantity =
            typeof r.quantity === 'number' && Number.isFinite(r.quantity) ? Math.max(0, Math.trunc(r.quantity)) : 0
        const price = typeof r.price === 'number' && Number.isFinite(r.price) ? r.price : 0
        const image = r.image !== undefined && r.image !== null ? r.image : undefined
        out.push({ productId, title, quantity, price, image })
    }
    return out
}

function mapApiOrderRow(o: Record<string, unknown>): OrderListEntry | null {
    const createdAt = typeof o._createdAt === 'string' ? o._createdAt : ''
    const dt = createdAt ? new Date(createdAt) : null
    const date = dt && !Number.isNaN(dt.valueOf()) ? dt.toLocaleDateString('uk-UA') : ''
    const rawStatus = typeof o.status === 'string' ? o.status : 'pending'
    const payment = parsePayment(o.paymentStatus, rawStatus)
    const fulfillment = parseFulfillment(rawStatus)
    const isPaid = o.isPaid === true || payment === 'paid'
    const status =
        fulfillment === 'cancelled'
            ? ('cancelled' as const)
            : fulfillment === 'completed'
                ? ('delivered' as const)
                : ('processing' as const)
    const orderId = typeof o.orderId === 'string' && o.orderId ? o.orderId : typeof o._id === 'string' ? o._id : ''
    if (!orderId) return null
    const totalAmount = typeof o.totalAmount === 'number' && Number.isFinite(o.totalAmount) ? o.totalAmount : 0
    const detailLines = mapDetailLinesFromApi(o.items)
    const itemsCount =
        typeof o.itemsCount === 'number' && Number.isFinite(o.itemsCount)
            ? Math.max(0, Math.trunc(o.itemsCount))
            : detailLines.length
    const trackingNumber =
        typeof o.trackingNumber === 'string' && o.trackingNumber.trim() ? o.trackingNumber.trim() : undefined
    const sanityDocumentId = typeof o._id === 'string' ? o._id : undefined
    return {
        id: orderId,
        date,
        status,
        statusText: '',
        fulfillment,
        payment,
        isPaid,
        total: `${totalAmount.toLocaleString('uk-UA')} ₴`,
        shippingAddress: typeof o.shippingAddress === 'string' ? o.shippingAddress : '',
        customerName: typeof o.customerName === 'string' ? o.customerName : '',
        customerPhone: typeof o.customerPhone === 'string' ? o.customerPhone : '',
        customerEmail: typeof o.customerEmail === 'string' ? o.customerEmail : '',
        items: detailLines.map((l) => ({
            id: l.productId,
            title: l.title,
            quantity: l.quantity,
            price: l.price,
        })),
        itemsCount,
        trackingNumber,
        detailLines,
        sanityDocumentId,
        totalAmount,
        sanityOrderStatus: rawStatus,
    }
}

function buildDetailLines(order: OrderListEntry): ProfileOrderLine[] {
    if (order.detailLines && order.detailLines.length > 0) return order.detailLines
    return (order.items || []).map((it) => ({
        productId: it.id,
        title: it.title,
        quantity: it.quantity,
        price: it.price,
        imageUrl: it.imageUrl ?? it.images?.[0],
    }))
}

function fulfillmentForDisplay(order: OrderListEntry): OrderFulfillmentStatus {
    if (order.fulfillment) return order.fulfillment
    if (order.status === 'delivered') return 'completed'
    if (order.status === 'cancelled') return 'cancelled'
    return 'pending'
}

function paymentForDisplay(order: OrderListEntry): OrderPaymentStatus {
    const p = order.payment
    if (p === 'pending' || p === 'paid' || p === 'cancelled' || p === 'failed') return p
    return 'pending'
}

function itemsCountForOrder(order: OrderListEntry): number {
    if (typeof order.itemsCount === 'number' && Number.isFinite(order.itemsCount)) {
        return Math.max(0, Math.trunc(order.itemsCount))
    }
    return Array.isArray(order.items) ? order.items.length : 0
}

function orderPaymentUiFlags(order: OrderListEntry) {
    const status = order.sanityOrderStatus ?? 'pending'
    const canPay = !Boolean(order.isPaid) && status === 'pending'
    const isPaid =
        Boolean(order.isPaid) ||
        status === 'processing' ||
        status === 'shipped' ||
        status === 'paid' ||
        status === 'completed'
    const isCancelled = order.status === 'cancelled' || status === 'cancelled'
    return { canPay, isPaid, isCancelled }
}

function digitsPhoneForWidget(raw: string): string {
    const d = raw.replace(/\D/g, '')
    if (d.length >= 12 && d.startsWith('380')) return d
    if (d.length === 10 && d.startsWith('0')) return `38${d}`
    if (d.length === 9) return `380${d}`
    if (d.length >= 11 && d.startsWith('38')) return d
    return '380000000000'
}

function widgetClientNames(user: { firstName?: string; lastName?: string; name?: string } | null | undefined) {
    if (!user) {
        return { firstName: 'Клієнт', lastName: '—' }
    }
    const parts = (user.name || '').trim().split(/\s+/).filter(Boolean)
    const firstName = user.firstName?.trim() || parts[0] || 'Клієнт'
    const lastName = user.lastName?.trim() || (parts.length > 1 ? parts.slice(1).join(' ') : '—')
    return { firstName: firstName.slice(0, 120), lastName: lastName.slice(0, 120) }
}

export default function ProfilePage() {
    const router = useRouter()
    const { user, isAuthenticated, refresh, updateUser, destroySession } = useUser()
    const { data: session, status: sessionStatus, update: updateSession } = useSession()
    const sessionUserId = typeof session?.user?.id === 'string' ? session.user.id.trim() : ''
    const { orders } = useOrderStore()
    const wishlistCount = useWishlistStore((s) => (Array.isArray(s.items) ? s.items.length : 0))
    const isHydrated = useHydration()

    const [activeTab, setActiveTab] = useState('orders')
    const [orderFilter, setOrderFilter] = useState('all')

    const [email, setEmail] = useState('')
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [isLoadingOrders, setIsLoadingOrders] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [serverOrders, setServerOrders] = useState<OrderListEntry[]>([])
    const [wayforpayScriptReady, setWayforpayScriptReady] = useState(false)
    const [paymentLoadingOrderId, setPaymentLoadingOrderId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (window.Wayforpay) {
            setWayforpayScriptReady(true)
            return
        }
        let cancelled = false
        let attempts = 0
        const maxAttempts = 200
        const timer = window.setInterval(() => {
            if (cancelled) return
            if (window.Wayforpay) {
                window.clearInterval(timer)
                setWayforpayScriptReady(true)
                return
            }
            attempts += 1
            if (attempts >= maxAttempts) {
                window.clearInterval(timer)
            }
        }, 50)
        return () => {
            cancelled = true
            window.clearInterval(timer)
        }
    }, [])

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProfileUpdateFormData>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: { firstName: '', lastName: '', phone: '', address: '' },
        shouldFocusError: true,
    })

    const fetchServerOrders = useCallback(async (): Promise<OrderListEntry[]> => {
        const res = await fetch('/api/orders/me', { method: 'GET', cache: 'no-store' })
        const data = await res.json().catch(() => null)
        const raw = Array.isArray(data?.orders) ? data.orders : []
        return raw
            .map((row: unknown) => mapApiOrderRow(isRecord(row) ? row : {}))
            .filter((x): x is OrderListEntry => x !== null)
    }, [])

    useEffect(() => {
        void router.refresh()
    }, [router])

    useEffect(() => {
        if (!isHydrated) return
        reset({ firstName: '', lastName: '', phone: '', address: '' })
        setEmail('')
        setServerOrders([])
        setIsLoadingOrders(true)
        let cancelled = false
        async function run() {
            setIsLoadingProfile(true)
            setError(null)
            try {
                const nextUser = await refresh()
                if (!nextUser) {
                    if (!cancelled) signOutToLogin()
                    return
                }
                if (!cancelled) {
                    setEmail(nextUser.email)
                    setValue('firstName', nextUser.firstName || (nextUser.name || '').split(' ')[0] || '', { shouldValidate: false })
                    setValue('lastName', nextUser.lastName || (nextUser.name || '').split(' ').slice(1).join(' ') || '', { shouldValidate: false })
                    setValue('phone', nextUser.phone || '', { shouldValidate: false })
                    setValue('address', nextUser.address || '', { shouldValidate: false })
                }
            } catch (error) {
                console.error('[PROFILE_CRASH]:', error)
                if (!cancelled) setError('Не вдалося завантажити профіль')
            } finally {
                if (!cancelled) setIsLoadingProfile(false)
            }
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [isHydrated, sessionUserId, refresh, reset, setValue])

    useEffect(() => {
        if (!isHydrated || isLoadingProfile) return
        if (!isAuthenticated || !user) return
        let cancelled = false
        setIsLoadingOrders(true)
        setServerOrders([])
        void fetchServerOrders()
            .then((mapped) => {
                if (!cancelled) setServerOrders(mapped)
            })
            .catch((error: unknown) => {
                console.error('[PROFILE_ORDERS]:', error)
                if (!cancelled) toast.error('Не вдалося завантажити замовлення')
            })
            .finally(() => {
                if (!cancelled) setIsLoadingOrders(false)
            })
        return () => {
            cancelled = true
        }
    }, [isHydrated, isLoadingProfile, isAuthenticated, user, fetchServerOrders])

    useEffect(() => {
        if (!isHydrated || isLoadingProfile) return
        if (!isAuthenticated || !user) {
            signOutToLogin()
        }
    }, [isHydrated, isLoadingProfile, isAuthenticated, user])

    const startProfilePayment = useCallback(
        async (sanityDocumentId: string) => {
            if (typeof window === 'undefined') return
            if (!wayforpayScriptReady || !window.Wayforpay) {
                toast.error('Платіжна форма ще завантажується. Спробуйте за кілька секунд.')
                return
            }
            if (!user) return
            setPaymentLoadingOrderId(sanityDocumentId)
            try {
                const res = await fetch('/api/payment/generate-retry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: sanityDocumentId }),
                })
                const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
                if (!res.ok || !data || data.success !== true) {
                    toast.error(typeof data?.error === 'string' ? data.error : 'Не вдалося ініціювати оплату')
                    return
                }
                const od = data.orderDetails
                if (!od || typeof od !== 'object' || Array.isArray(od)) {
                    toast.error('Не вдалося ініціювати оплату')
                    return
                }
                const details = od as Record<string, unknown>
                const pubMerchant = process.env.NEXT_PUBLIC_WAYFORPAY_MERCHANT_ACCOUNT?.trim()
                const pubDomain = process.env.NEXT_PUBLIC_DOMAIN?.trim()
                const merchantAccount =
                    pubMerchant || (typeof details.merchantAccount === 'string' ? details.merchantAccount : '')
                const rawDomain =
                    pubDomain ||
                    (typeof details.merchantDomainName === 'string' ? details.merchantDomainName : '') ||
                    ''
                const merchantDomainName =
                    process.env.NODE_ENV === 'production' ? 'luximport.org' : normalizeMerchantDomainName(rawDomain)
                if (!merchantAccount || !merchantDomainName) {
                    toast.error('Налаштування оплати неповні. Зверніться до підтримки.')
                    return
                }
                const productName = details.productName
                const productPrice = details.productPrice
                const productCount = details.productCount
                if (!Array.isArray(productName) || !Array.isArray(productPrice) || !Array.isArray(productCount)) {
                    toast.error('Не вдалося ініціювати оплату')
                    return
                }
                const { firstName, lastName } = widgetClientNames(user)
                const clientPhone = digitsPhoneForWidget(user.phone || '')
                const wfp = new window.Wayforpay()
                wfp.run(
                    {
                        merchantAccount,
                        merchantDomainName,
                        authorizationType: 'SimpleSignature',
                        merchantSignature: String(data.signature),
                        orderReference: String(data.retryReference),
                        orderDate: String(details.orderDate),
                        amount: String(details.amount),
                        currency: typeof details.currency === 'string' ? details.currency : 'UAH',
                        productName,
                        productPrice,
                        productCount,
                        clientFirstName: firstName,
                        clientLastName: lastName,
                        clientPhone,
                        clientEmail: user.email,
                        googlePay:
                            typeof details.googlePay === 'string' && details.googlePay.trim()
                                ? details.googlePay.trim()
                                : WAYFORPAY_GOOGLE_PAY,
                        ...(typeof details.returnUrl === 'string' ? { returnUrl: details.returnUrl } : {}),
                        ...(typeof details.serviceUrl === 'string' ? { serviceUrl: details.serviceUrl } : {}),
                        language: 'UA',
                    },
                    () => {
                        void fetch('/api/orders/sync-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: sanityDocumentId }),
                        })
                            .then((res) => {
                                if (!res.ok) {
                                    throw new Error(String(res.status))
                                }
                                toast.success('Оплату успішно підтверджено!')
                                window.location.reload()
                            })
                            .catch((error: unknown) => {
                                console.error('Sync error:', error)
                                toast.error('Оплата пройшла, але статус оновлюється...')
                            })
                    },
                    () => {
                        toast.error('Оплату відхилено')
                    },
                    () => {
                        toast('Очікування оплати')
                    }
                )
            } catch {
                toast.error('Не вдалося ініціювати оплату')
            } finally {
                setPaymentLoadingOrderId(null)
            }
        },
        [user, wayforpayScriptReady]
    )

    if (sessionStatus === 'loading' || !sessionUserId || !isHydrated || isLoadingProfile) {
        return (
            <div className={styles.container}>
                <div className={styles.dashboardHero}>
                    <div className="animate-pulse">
                        <Skeleton className="h-10 w-64 rounded-md" />
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-lg border border-stone-200 bg-white px-6 py-5">
                                    <Skeleton className="h-8 w-24 rounded-sm" />
                                    <Skeleton className="mt-3 h-3 w-28 rounded-sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className="mb-8 flex flex-wrap items-center gap-3">
                        <Skeleton className="h-10 w-44 rounded-md" />
                        <Skeleton className="h-10 w-44 rounded-md" />
                        <Skeleton className="h-10 w-44 rounded-md" />
                    </div>
                    <div className="animate-pulse">
                        <div className="mb-6 flex flex-wrap gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-20 rounded-md" />
                            ))}
                        </div>
                        <OrdersListSkeleton count={6} />
                    </div>
                </div>
            </div>
        )
    }
    if (sessionStatus !== 'authenticated') return null
    if (!isAuthenticated || !user) return null

    const sourceOrders = serverOrders
    const filteredOrders =
        orderFilter === 'all'
            ? sourceOrders
            : sourceOrders.filter((o) => o.status === orderFilter)

    const orderCardItems = filteredOrders.map((order) => {
        const { canPay, isPaid, isCancelled } = orderPaymentUiFlags(order)
        return {
            id: order.id,
            date: order.date,
            total: order.total,
            itemsCount: itemsCountForOrder(order),
            fulfillment: fulfillmentForDisplay(order),
            payment: paymentForDisplay(order),
            canPay,
            isPaidDisplay: isPaid,
            isCancelled,
            trackingNumber: order.trackingNumber,
            lines: buildDetailLines(order),
            sanityDocumentId: order.sanityDocumentId,
        }
    })

    const handleLogout = async () => {
        toast.success('Ви вийшли з акаунта')
        await destroySession()
    }

    const onSaveSettings = async (values: ProfileUpdateFormData) => {
        setError(null)
        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    firstName: values.firstName.trim(),
                    lastName: values.lastName?.trim() ?? '',
                    phone: values.phone?.trim() ?? '',
                    address: values.address?.trim() ?? '',
                }),
            })
            const data = (await res.json().catch(() => null)) as any
            if (!res.ok) {
                const msg =
                    typeof data?.message === 'string'
                        ? data.message
                        : typeof data?.error === 'string'
                            ? data.error
                            : 'Виникла помилка. Перевірте дані та спробуйте ще раз.'
                setError(msg)
                toast.error(msg)
                return
            }
            const u = data?.user
            if (!u || typeof u !== 'object') {
                setError('Виникла помилка. Перевірте дані та спробуйте ще раз.')
                toast.error('Виникла помилка. Перевірте дані та спробуйте ще раз.')
                return
            }
            updateUser({
                id: String(u.id ?? user.id),
                email: String(u.email ?? user.email),
                name: typeof u.name === 'string' ? u.name : user.name,
                firstName: typeof u.firstName === 'string' ? u.firstName : values.firstName.trim(),
                lastName: typeof u.lastName === 'string' ? u.lastName : values.lastName?.trim() ?? '',
                phone: typeof u.phone === 'string' ? u.phone : values.phone?.trim() ?? '',
                address: typeof u.address === 'string' ? u.address : values.address?.trim() ?? '',
            })
            if (typeof u?.name === 'string') {
                await updateSession({ name: u.name })
            }
            toast.success('Дані збережено')
        } catch (error) {
            console.error('[PROFILE_CRASH]:', error)
            const msg = 'Виникла помилка. Перевірте дані та спробуйте ще раз.'
            setError(msg)
            toast.error(msg)
        }
    }

    return (
        <>
            <LoadingOverlay show={isSubmitting} />
        <div className={styles.container}>
            <div className={styles.dashboardHero}>
                <motion.h1
                    className={styles.welcomeTitle}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: premiumEase }}
                >
                    Привіт, {user.name || 'Vladyslav'}
                </motion.h1>
                <motion.div
                    className={styles.statsGrid}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: premiumEase, delay: 0.1 }}
                >
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>
                            {isLoadingOrders ? <Skeleton className="h-8 w-10 rounded-sm" /> : sourceOrders.length}
                        </span>
                        <span className={styles.statLabel}>ЗАМОВЛЕННЯ</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>
                            {!isHydrated ? <Skeleton className="h-8 w-10 rounded-sm" /> : wishlistCount}
                        </span>
                        <span className={styles.statLabel}>ОБРАНЕ</span>
                    </div>
                </motion.div>
            </div>

            <div className={styles.content}>
                <div className={styles.tabNavigation}>
                    {[
                        { key: 'orders', label: 'МОЇ ЗАМОВЛЕННЯ' },
                        { key: 'settings', label: 'ОСОБИСТІ ДАНІ' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            className={`${styles.tabBtn} ${activeTab === key ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab(key)}
                            style={{ position: 'relative' }}
                        >
                            {label}
                            {activeTab === key && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className={styles.activeTabUnderline}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-2px', left: 0, right: 0, height: '2px',
                                        backgroundColor: '#111'
                                    }}
                                    transition={{ duration: 0.4, ease: premiumEase }}
                                />
                            )}
                        </button>
                    ))}
                    <button className={styles.tabBtn} onClick={handleLogout}>ВИЙТИ З АКАУНТА</button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: premiumEase }}
                        >
                            <div className={styles.orderTabs}>
                                {orderTabs.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        className={`${styles.orderTabBtn} ${orderFilter === key ? styles.orderTabActive : ''}`}
                                        onClick={() => setOrderFilter(key)}
                                        style={{ position: 'relative' }}
                                    >
                                        {label}
                                        {orderFilter === key && (
                                            <motion.div
                                                layoutId="activeOrderStatusIndicator"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0, left: 0, right: 0, height: '1px',
                                                    backgroundColor: '#111'
                                                }}
                                                transition={{ duration: 0.4, ease: premiumEase }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="popLayout">
                                    {sourceOrders.length === 0 ? (
                                        <motion.div
                                            key="empty-orders"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.35, ease: 'easeOut' }}
                                            style={{ padding: '2rem 0', fontFamily: 'var(--font-body)' }}
                                            layout
                                        >
                                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#111' }}>ІСТОРІЯ ЗАМОВЛЕНЬ ПОРОЖНЯ</h3>
                                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                                Ви ще не здійснили жодного замовлення.
                                            </p>
                                            <Link
                                                href="/catalog"
                                                style={{ display: 'inline-block', padding: '1rem 3rem', background: '#111', color: '#fff', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px' }}
                                            >
                                                ПЕРЕЙТИ ДО КАТАЛОГУ
                                            </Link>
                                        </motion.div>
                                    ) : filteredOrders.length === 0 ? (
                                        <motion.p
                                            key="no-filtered-orders"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.35, ease: 'easeOut' }}
                                            style={{ fontFamily: 'var(--font-body)', color: '#888', fontSize: '0.9rem' }}
                                            layout
                                        >
                                            Немає замовлень у цій категорії.
                                        </motion.p>
                                    ) : (
                                        isLoadingOrders ? (
                                            <div className="flex flex-col gap-4">
                                                {Array.from({ length: 4 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="animate-pulse rounded-lg border border-stone-200 bg-white px-6 py-6"
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                                            <div className="min-w-[12rem] flex-1">
                                                                <div className="h-4 w-40 rounded bg-stone-200" />
                                                                <div className="mt-3 h-3 w-28 rounded bg-stone-200" />
                                                            </div>
                                                            <div className="flex w-44 flex-col items-end gap-3">
                                                                <div className="h-5 w-28 rounded bg-stone-200" />
                                                                <div className="h-3 w-24 rounded bg-stone-200" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-5 h-3 w-full rounded bg-stone-200" />
                                                        <div className="mt-2 h-3 w-11/12 rounded bg-stone-200" />
                                                        <div className="mt-2 h-3 w-10/12 rounded bg-stone-200" />
                                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
                                                            <div className="h-9 w-40 rounded bg-stone-200" />
                                                            <div className="h-9 w-32 rounded bg-stone-200" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <motion.div
                                                key={`orders-${orderFilter}`}
                                                className={styles.orderList}
                                                initial="hidden"
                                                animate="visible"
                                                variants={orderListVariants}
                                                layout
                                            >
                                                <Suspense
                                                    fallback={
                                                        <div className="flex flex-col gap-4">
                                                            {Array.from({ length: 3 }).map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="animate-pulse rounded-lg border border-stone-200 bg-white px-6 py-6"
                                                                >
                                                                    <div className="h-4 w-40 rounded bg-stone-200" />
                                                                    <div className="mt-3 h-3 w-28 rounded bg-stone-200" />
                                                                    <div className="mt-6 h-3 w-full rounded bg-stone-200" />
                                                                    <div className="mt-2 h-3 w-10/12 rounded bg-stone-200" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    }
                                                >
                                                    <OrdersListClient
                                                        items={orderCardItems}
                                                        onOrdersInvalidate={() => {
                                                            setIsLoadingOrders(true)
                                                            void fetchServerOrders()
                                                                .then((mapped) => {
                                                                    setServerOrders(mapped)
                                                                })
                                                                .finally(() => {
                                                                    setIsLoadingOrders(false)
                                                                })
                                                        }}
                                                        onProfilePay={startProfilePayment}
                                                        paymentLoadingOrderId={paymentLoadingOrderId}
                                                        wayforpayReady={wayforpayScriptReady}
                                                    />
                                                </Suspense>
                                            </motion.div>
                                        )
                                    )}
                                </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.form
                            key="settings-tab"
                            onSubmit={handleSubmit(onSaveSettings)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: premiumEase }}
                            noValidate
                        >
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Ім&#39;я</label>
                                <input
                                    type='text'
                                    className={styles.input}
                                    {...register('firstName')}
                                />
                                {errors.firstName?.message && (
                                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Прізвище</label>
                                <input
                                    type='text'
                                    className={styles.input}
                                    {...register('lastName')}
                                />
                                {errors.lastName?.message && (
                                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Телефон</label>
                                <PhoneInput id="phone" className={styles.input} {...register('phone')} />
                                {errors.phone?.message && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type='email'
                                    className={styles.input}
                                    value={email}
                                    readOnly
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Адреса доставки</label>
                                <input
                                    type='text'
                                    className={styles.input}
                                    {...register('address')}
                                />
                                {errors.address?.message && (
                                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                                )}
                            </div>
                            {error && (
                                <div style={{ fontFamily: 'var(--font-body)', color: '#b00020', fontSize: '0.85rem' }}>
                                    {error}
                                </div>
                            )}
                            <div>
                                <button type='submit' className={styles.saveBtn} disabled={isSubmitting}>
                                    {isSubmitting ? <span className={styles.spinner} aria-hidden="true" /> : null}
                                    {isSubmitting ? 'ОБРОБКА...' : 'ЗБЕРЕГТИ ЗМІНИ'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </>
    )
}
