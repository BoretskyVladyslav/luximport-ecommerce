'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useOrderStore } from '@/store/orderStore'
import { useHydration } from '@/hooks/useHydration'
import styles from './page.module.scss'

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
                <h1 className={styles.welcomeTitle}>Привіт, {user.name || 'Vladyslav'}</h1>
                <div className={styles.statsGrid}>
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
                </div>
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
                        >
                            {label}
                        </button>
                    ))}
                    <button className={styles.tabBtn} onClick={handleLogout}>ВИЙТИ З АКАУНТА</button>
                </div>

                {activeTab === 'orders' && (
                    <>
                        <div className={styles.orderTabs}>
                            {orderTabs.map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`${styles.orderTabBtn} ${orderFilter === key ? styles.orderTabActive : ''}`}
                                    onClick={() => setOrderFilter(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className={styles.orderList}>
                            {orders.length === 0 ? (
                                <div style={{ padding: '2rem 0', fontFamily: 'var(--font-body)' }}>
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
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <p style={{ fontFamily: 'var(--font-body)', color: '#888', fontSize: '0.9rem' }}>
                                    Немає замовлень у цій категорії.
                                </p>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div key={order.id} className={styles.orderItem}>
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
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'settings' && (
                    <form onSubmit={handleSaveSettings}>
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
                    </form>
                )}
            </div>

            {showSuccess && (
                <div className={styles.toastNotification}>
                    ДАНІ УСПІШНО ОНОВЛЕНО
                </div>
            )}
        </div>
    )
}
