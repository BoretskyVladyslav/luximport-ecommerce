'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import styles from './page.module.scss'

const mockOrders = [
    { id: '#0015', date: '19.02.2026', status: 'processing', statusText: 'В ОБРОБЦІ', total: '3 200 UAH' },
    { id: '#0014', date: '12.02.2026', status: 'delivered', statusText: 'ДОСТАВЛЕНО', total: '1 450 UAH' },
    { id: '#0012', date: '05.02.2026', status: 'cancelled', statusText: 'СКАСОВАНО', total: '850 UAH' },
]

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
    const { user, isAuthenticated, logout } = useAuthStore()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [orderFilter, setOrderFilter] = useState('all')

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/account/login')
        }
    }, [isAuthenticated, router])

    if (!user) return null

    const filteredOrders =
        orderFilter === 'all'
            ? mockOrders
            : mockOrders.filter((o) => o.status === orderFilter)

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                {[
                    { key: 'dashboard', label: 'ГОЛОВНА' },
                    { key: 'orders', label: 'МОЇ ЗАМОВЛЕННЯ' },
                    { key: 'settings', label: 'НАЛАШТУВАННЯ' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        className={`${styles.menuItem} ${activeTab === key ? styles.menuItemActive : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        {label}
                    </button>
                ))}
            </aside>

            <div className={styles.content}>
                {activeTab === 'dashboard' && (
                    <>
                        <h1 className={styles.sectionTitle}>ОСОБИСТИЙ КАБІНЕТ</h1>
                        <div className={styles.dashboardCard}>
                            <div className={styles.greeting}>Привіт, {user.name}</div>
                            <div className={styles.infoText}>{user.email}</div>
                            <button className={styles.logoutBtn} onClick={handleLogout}>
                                ВИЙТИ З АКАУНТА
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'orders' && (
                    <>
                        <h1 className={styles.sectionTitle}>ІСТОРІЯ ЗАМОВЛЕНЬ</h1>

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
                            {filteredOrders.length === 0 ? (
                                <p style={{ fontFamily: 'var(--font-body)', color: '#888', fontSize: '0.9rem' }}>
                                    Немає замовлень у цій категорії.
                                </p>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div key={order.id} className={styles.orderItem}>
                                        <span className={styles.orderId}>{order.id}</span>
                                        <span className={styles.orderDate}>{order.date}</span>
                                        <span className={`${styles.orderStatus} ${statusClass[order.status]}`}>
                                            {order.statusText}
                                        </span>
                                        <span className={styles.orderTotal}>{order.total}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'settings' && (
                    <>
                        <h1 className={styles.sectionTitle}>ОСОБИСТІ ДАНІ</h1>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Ім&#39;я</label>
                                <input type='text' className={styles.input} defaultValue={user.name} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Телефон</label>
                                <input type='tel' className={styles.input} placeholder='+38 (___) ___-__-__' />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input type='email' className={styles.input} defaultValue={user.email} />
                            </div>
                            <button type='submit' className={styles.saveBtn}>ЗБЕРЕГТИ ЗМІНИ</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
