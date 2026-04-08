'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useUser } from '@/hooks/useUser'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations/profile'
import { useOrderStore } from '@/store/orderStore'
import { useHydration } from '@/hooks/useHydration'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { PhoneInput } from '@/components/ui/phone-input'
import { OrdersListSkeleton, Skeleton } from '@/components/ui/skeletons'
import styles from './page.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1];

const statusClass: Record<string, string> = {
    processing: styles.statusProcessing,
    delivered: styles.statusDelivered,
    cancelled: styles.statusCancelled,
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

export default function ProfilePage() {
    const { user, isAuthenticated, refresh, updateUser, destroySession } = useUser()
    const { orders } = useOrderStore()
    const isHydrated = useHydration()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState('orders')
    const [orderFilter, setOrderFilter] = useState('all')

    const [email, setEmail] = useState('')
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [serverOrders, setServerOrders] = useState<Array<{
        id: string
        date: string
        status: 'processing' | 'delivered' | 'cancelled'
        statusText: string
        total: string
        shippingAddress: string
        itemsCount: number
    }>>([])

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProfileUpdateFormData>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: { firstName: '', lastName: '', phone: '', address: '' },
        shouldFocusError: true,
    })

    useEffect(() => {
        if (!isHydrated) return
        let cancelled = false
        async function run() {
            setIsLoadingProfile(true)
            setError(null)
            try {
                const nextUser = await refresh()
                if (!nextUser) {
                    if (!cancelled) router.push('/account/login')
                    return
                }
                if (!cancelled) {
                    setEmail(nextUser.email)
                    setValue('firstName', nextUser.firstName || (nextUser.name || '').split(' ')[0] || '', { shouldValidate: false })
                    setValue('lastName', nextUser.lastName || (nextUser.name || '').split(' ').slice(1).join(' ') || '', { shouldValidate: false })
                    setValue('phone', nextUser.phone || '', { shouldValidate: false })
                    setValue('address', nextUser.address || '', { shouldValidate: false })
                }

                const res = await fetch('/api/orders/me', { method: 'GET' })
                const data = await res.json().catch(() => null)
                const raw = Array.isArray(data?.orders) ? data.orders : []
                const mapped = raw
                    .map((o: any) => {
                        const createdAt = typeof o?._createdAt === 'string' ? o._createdAt : ''
                        const dt = createdAt ? new Date(createdAt) : null
                        const date = dt && !Number.isNaN(dt.valueOf()) ? dt.toLocaleDateString('uk-UA') : ''
                        const statusRaw = typeof o?.status === 'string' ? o.status : 'pending'
                        const status =
                            statusRaw === 'cancelled' || statusRaw === 'failed'
                                ? ('cancelled' as const)
                                : statusRaw === 'paid'
                                    ? ('delivered' as const)
                                    : ('processing' as const)
                        const statusText =
                            statusRaw === 'paid'
                                ? 'ОПЛАЧЕНО'
                                : statusRaw === 'cancelled'
                                    ? 'СКАСОВАНО'
                                    : statusRaw === 'failed'
                                        ? 'НЕУСПІШНО'
                                        : 'ОЧІКУЄ ОПЛАТИ'
                        const orderId = typeof o?.orderId === 'string' && o.orderId ? o.orderId : String(o?._id ?? '')
                        const totalAmount = typeof o?.totalAmount === 'number' && Number.isFinite(o.totalAmount) ? o.totalAmount : 0
                        const itemsCount = Array.isArray(o?.items) ? o.items.length : 0
                        return {
                            id: orderId,
                            date,
                            status,
                            statusText,
                            total: `${totalAmount.toLocaleString('uk-UA')} ₴`,
                            shippingAddress: typeof o?.shippingAddress === 'string' ? o.shippingAddress : '',
                            itemsCount,
                        }
                    })
                    .filter((x: any) => x && typeof x.id === 'string' && x.id)

                if (!cancelled) setServerOrders(mapped)
            } catch {
                if (!cancelled) setError('Не вдалося завантажити профіль')
            } finally {
                if (!cancelled) setIsLoadingProfile(false)
            }
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [isHydrated, refresh, router, setValue])

    if (!isHydrated || isLoadingProfile) {
        return (
            <div className={styles.container}>
                <div className={styles.dashboardHero}>
                    <div className="animate-pulse">
                        <Skeleton className="h-10 w-64 rounded-md bg-stone-200/70" />
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
                        <Skeleton className="h-10 w-44 rounded-md bg-stone-200/70" />
                        <Skeleton className="h-10 w-44 rounded-md bg-stone-200/70" />
                        <Skeleton className="h-10 w-44 rounded-md bg-stone-200/70" />
                    </div>
                    <div className="animate-pulse">
                        <div className="mb-6 flex flex-wrap gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-20 rounded-md bg-stone-200/70" />
                            ))}
                        </div>
                        <OrdersListSkeleton count={6} />
                    </div>
                </div>
            </div>
        )
    }
    if (!isAuthenticated || !user) return null

    const sourceOrders = serverOrders.length > 0 ? serverOrders : orders
    const filteredOrders =
        orderFilter === 'all'
            ? sourceOrders
            : sourceOrders.filter((o) => o.status === orderFilter)

    const handleLogout = async () => {
        await destroySession()
        toast.success('Ви вийшли з акаунта')
        router.push('/')
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
            toast.success('Дані збережено')
        } catch {
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
                        <span className={styles.statValue}>{orders.length}</span>
                        <span className={styles.statLabel}>ЗАМОВЛЕННЯ</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>4</span>
                        <span className={styles.statLabel}>ОБРАНЕ</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>PREMIUM</span>
                        <span className={styles.statLabel}>СТАТУС КЛІЄНТА</span>
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

                            <motion.div className={styles.orderList} layout>
                                <AnimatePresence mode="popLayout">
                                    {sourceOrders.length === 0 ? (
                                        <motion.div
                                            key="empty-orders"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
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
                                            transition={{ duration: 0.4 }}
                                            style={{ fontFamily: 'var(--font-body)', color: '#888', fontSize: '0.9rem' }}
                                            layout
                                        >
                                            Немає замовлень у цій категорії.
                                        </motion.p>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <motion.div
                                                key={order.id}
                                                className={styles.orderItem}
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.4, ease: premiumEase }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <span className={styles.orderId}>{order.id}</span>
                                                    <span className={styles.orderDate}>{order.date}</span>
                                                </div>
                                                <span className={`${styles.orderStatus} ${statusClass[order.status]}`}>
                                                    {order.statusText}
                                                </span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '150px' }}>
                                                    <span className={styles.orderTotal}>{order.total}</span>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        {'itemsCount' in order ? (order as any).itemsCount : order.items?.length || 0} Товарів
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </motion.div>
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
