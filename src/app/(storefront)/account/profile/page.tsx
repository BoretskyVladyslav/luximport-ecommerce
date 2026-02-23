'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useOrderStore } from '@/store/orderStore'
import { useHydration } from '@/hooks/useHydration'
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

export default function ProfilePage() {
    const { user, isAuthenticated, logout, login } = useAuthStore()
    const { orders } = useOrderStore()
    const isHydrated = useHydration()
    const router = useRouter()

    // Tab State
    const [activeTab, setActiveTab] = useState('orders')
    const [orderFilter, setOrderFilter] = useState('all')

    // Form State
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/account/login')
        } else if (user) {
            setName(user.name || '')
            setEmail(user.email || '')
        }
    }, [isAuthenticated, user, router])

    if (!isHydrated || !user) return null

    const filteredOrders =
        orderFilter === 'all'
            ? orders
            : orders.filter((o) => o.status === orderFilter)

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault()
        login({ id: user.id, name, email })
        // phone not persisted centrally yet, handled locally for UI completeness

        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
    }

    return (
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
                                    {orders.length === 0 ? (
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
                                                        {order.items?.length || 0} Товарів
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
                            onSubmit={handleSaveSettings}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: premiumEase }}
                        >
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Ім&#39;я</label>
                                <input
                                    type='text'
                                    className={styles.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Телефон</label>
                                <input
                                    type='tel'
                                    className={styles.input}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder='+38 (___) ___-__-__'
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type='email'
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <button type='submit' className={styles.saveBtn}>ЗБЕРЕГТИ ЗМІНИ</button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className={styles.toastNotification}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, ease: premiumEase }}
                    >
                        ДАНІ УСПІШНО ОНОВЛЕНО
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
