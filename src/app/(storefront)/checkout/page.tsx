'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cart'
import { useOrderStore } from '@/store/orderStore'
import { useHydration } from '@/hooks/useHydration'
import { NpSelect } from '@/components/ui/np-select'
import styles from './page.module.scss'

const fetchCities = async (query: string) => {
    try {
        const res = await fetch('/api/np', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                modelName: 'Address',
                calledMethod: 'getCities',
                methodProperties: { FindByString: query },
            }),
        })
        const data = await res.json()
        if (data.success) {
            return data.data.map((city: any) => ({
                description: city.Description,
                ref: city.Ref,
            }))
        }
        return []
    } catch {
        return []
    }
}

const fetchBranches = async (cityRef: string, query: string = '') => {
    if (!cityRef) return []
    try {
        const res = await fetch('/api/np', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                modelName: 'AddressGeneral',
                calledMethod: 'getWarehouses',
                methodProperties: { CityRef: cityRef, FindByString: query },
            }),
        })
        const data = await res.json()
        if (data.success) {
            return data.data.map((branch: any) => ({
                description: branch.Description,
                ref: branch.Ref,
            }))
        }
        return []
    } catch {
        return []
    }
}

export default function CheckoutPage() {
    const { user, isAuthenticated } = useAuthStore()
    const { items, clearCart } = useCartStore()
    const { addOrder } = useOrderStore()
    const isHydrated = useHydration()
    const router = useRouter()

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [city, setCity] = useState('')
    const [cityRef, setCityRef] = useState('')
    const [department, setDepartment] = useState('')
    const [departmentRef, setDepartmentRef] = useState('')

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/account/login')
        } else if (user) {
            setName(user.name || '')
        }
    }, [isAuthenticated, user, router])

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleConfirmOrder = (e: React.FormEvent) => {
        e.preventDefault()

        if (items.length === 0) return

        const dateObj = new Date()
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`
        const randomId = `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

        addOrder({
            id: randomId,
            date: formattedDate,
            status: 'processing',
            statusText: 'ОБРОБЛЯЄТЬСЯ',
            total: `${total.toLocaleString('uk-UA')} ₴`,
            items: [...items]
        })

        clearCart()
        router.push('/account/profile')
    }

    if (!isHydrated || !isAuthenticated) return null

    return (
        <div className={styles.container}>
            <div className={styles.formSection}>
                <h1 className={styles.sectionTitle}>ОФОРМЛЕННЯ ЗАМОВЛЕННЯ</h1>

                <form id="checkout-form" onSubmit={handleConfirmOrder}>
                    <div className={styles.formGrid}>
                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Прізвище та Ім&#39;я</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Телефон</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+38 (___) ___-__-__"
                                required
                            />
                        </div>
                        <NpSelect
                            label="Місто"
                            placeholder="Введіть назву міста..."
                            value={city}
                            onChange={(val, ref) => {
                                setCity(val)
                                setCityRef(ref)
                                setDepartment('')
                                setDepartmentRef('')
                            }}
                            onSearch={fetchCities}
                        />
                        <NpSelect
                            label="Відділення (Нова Пошта/Кур&#39;єр)"
                            placeholder="Оберіть відділення..."
                            value={department}
                            onChange={(val, ref) => {
                                setDepartment(val)
                                setDepartmentRef(ref)
                            }}
                            onSearch={(query) => fetchBranches(cityRef, query)}
                        />
                    </div>
                </form>
            </div>

            <div className={styles.summarySection}>
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>ВАШЕ ЗАМОВЛЕННЯ</h2>

                <div className={styles.orderItems}>
                    {items.map((item) => (
                        <div key={item.id} className={styles.summaryItem}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemTitle}>{item.title}</span>
                                <span className={styles.itemQty}>{item.quantity} шт.</span>
                            </div>
                            <span className={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('uk-UA')} ₴</span>
                        </div>
                    ))}
                </div>

                <div className={styles.totalRow}>
                    <span>РАЗОМ</span>
                    <span>{total.toLocaleString('uk-UA')} ₴</span>
                </div>

                <button
                    type="submit"
                    form="checkout-form"
                    className={styles.confirmBtn}
                    disabled={items.length === 0}
                >
                    ПІДТВЕРДИТИ ЗАМОВЛЕННЯ
                </button>
            </div>
        </div>
    )
}
