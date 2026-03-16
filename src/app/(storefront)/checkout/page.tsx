'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cart'
import { useOrderStore } from '@/store/orderStore'
import { useHydration } from '@/hooks/useHydration'
import { NpSelect } from '@/components/ui/np-select'
import { checkoutSchema, CheckoutFormData } from '@/lib/validations/checkout'
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
    const { items, clearCart, totalPrice } = useCartStore()
    const { addOrder, setLastOrder } = useOrderStore()
    const isHydrated = useHydration()
    const router = useRouter()

    const [cityRef, setCityRef] = useState('')

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            city: '',
            postOffice: '',
        },
    })

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/account/login')
        } else if (user) {
            setValue('name', user.name || '')
            setValue('email', user.email || '')
        }
    }, [isAuthenticated, user, router, setValue])

    const total = totalPrice()

    const onSubmit = async (data: CheckoutFormData) => {
        if (items.length === 0) return

        const dateObj = new Date()
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`
        const randomId = `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        const totalFormatted = `${total.toLocaleString('uk-UA')} ₴`

        try {
            // Step 1: Create Draft Sanity Order
            const createOrderRes = await fetch('/api/checkout/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: randomId,
                    customerName: data.name,
                    customerEmail: data.email,
                    customerPhone: data.phone,
                    shippingAddress: `${data.city}, ${data.postOffice}`,
                    items,
                    totalAmount: total,
                }),
            })

            const createdOrder = await createOrderRes.json()

            if (!createOrderRes.ok) {
                console.error('Failed to create order', createdOrder)
                return
            }

            const sanityOrderId = createdOrder.sanityDocumentId

            // Step 2: Initialize WayForPay Payment Payload
            const productNames = items.map(item => item.title)
            const productCounts = items.map(item => item.quantity)
            const productPrices = items.map(item => {
                const threshold = item.piecesPerBox ?? item.wholesaleMinQuantity
                const isWholesale = threshold && item.quantity >= threshold
                const applyPrice = isWholesale ? item.wholesalePrice : item.price
                return applyPrice || 0
            })

            const paymentRes = await fetch('/api/payment/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderReference: sanityOrderId, // Wayforpay will return this ID in the webhook
                    amount: total,
                    productName: productNames,
                    productCount: productCounts,
                    productPrice: productPrices,
                }),
            })

            const paymentData = await paymentRes.json()

            if (!paymentRes.ok) {
                console.error('Payment Init Error:', paymentData)
                return
            }

            // Save order info locally for the success page (if they return without webhook)
            const newOrder = {
                id: randomId,
                date: formattedDate,
                status: 'processing' as const,
                statusText: 'ОБРОБЛЯЄТЬСЯ',
                total: totalFormatted,
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                shippingAddress: `${data.city}, ${data.postOffice}`,
                items: [...items],
            }

            addOrder(newOrder)
            setLastOrder(newOrder)
            clearCart()

            // Step 3: Programmatically POST to WayForPay gateway
            const form = document.createElement('form')
            form.method = 'POST'
            form.action = 'https://secure.wayforpay.com/pay'
            form.style.display = 'none'

            Object.keys(paymentData).forEach(key => {
                const value = paymentData[key]
                if (Array.isArray(value)) {
                    value.forEach(val => {
                        const input = document.createElement('input')
                        input.type = 'hidden'
                        input.name = `${key}[]`
                        input.value = val.toString()
                        form.appendChild(input)
                    })
                } else {
                    const input = document.createElement('input')
                    input.type = 'hidden'
                    input.name = key
                    input.value = value.toString()
                    form.appendChild(input)
                }
            })

            document.body.appendChild(form)
            form.submit()
            // We no longer route right to /checkout/success here. Let WayForPay redirect the user.

        } catch (error) {
            console.error('Checkout error:', error)
        }
    }

    if (!isHydrated || !isAuthenticated) return null

    return (
        <div className={styles.container}>
            <div className={styles.formSection}>
                <h1 className={styles.sectionTitle}>ОФОРМЛЕННЯ ЗАМОВЛЕННЯ</h1>

                <form id="checkout-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.formGrid}>
                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Прізвище та Ім&#39;я</label>
                            <input
                                type="text"
                                className={styles.input}
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className={styles.fieldError}>{errors.name.message}</p>
                            )}
                        </div>

                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Email (Електронна пошта)</label>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="example@gmail.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className={styles.fieldError}>{errors.email.message}</p>
                            )}
                        </div>

                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Телефон</label>
                            <input
                                type="tel"
                                className={styles.input}
                                placeholder="+380XXXXXXXXX"
                                {...register('phone')}
                            />
                            {errors.phone && (
                                <p className={styles.fieldError}>{errors.phone.message}</p>
                            )}
                        </div>

                        <div className={styles.fullWidth}>
                            <NpSelect
                                label="Місто"
                                placeholder="Введіть назву міста..."
                                value=""
                                onChange={(val, ref) => {
                                    setValue('city', val, { shouldValidate: true })
                                    setCityRef(ref)
                                    setValue('postOffice', '', { shouldValidate: false })
                                }}
                                onSearch={fetchCities}
                            />
                            {errors.city && (
                                <p className={styles.fieldError}>{errors.city.message}</p>
                            )}
                        </div>

                        <div className={styles.fullWidth}>
                            <NpSelect
                                label="Відділення (Нова Пошта/Кур&#39;єр)"
                                placeholder="Оберіть відділення..."
                                value=""
                                onChange={(val) => {
                                    setValue('postOffice', val, { shouldValidate: true })
                                }}
                                onSearch={(query) => fetchBranches(cityRef, query)}
                            />
                            {errors.postOffice && (
                                <p className={styles.fieldError}>{errors.postOffice.message}</p>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <div className={styles.summarySection}>
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>ВАШЕ ЗАМОВЛЕННЯ</h2>

                <div className={styles.orderItems}>
                    {items.map((item) => {
                        const threshold = item.piecesPerBox ?? item.wholesaleMinQuantity
                        const isWholesale = threshold && item.quantity >= threshold
                        const applyPrice = isWholesale ? item.wholesalePrice : item.price

                        return (
                            <div key={item.id} className={styles.summaryItem}>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemTitle}>{item.title}</span>
                                    <span className={styles.itemQty}>{item.quantity} шт.</span>
                                </div>
                                <span className={styles.itemPrice}>{((applyPrice || 0) * item.quantity).toLocaleString('uk-UA')} ₴</span>
                            </div>
                        )
                    })}
                </div>

                <div className={styles.totalRow}>
                    <span>РАЗОМ</span>
                    <span>{total.toLocaleString('uk-UA')} ₴</span>
                </div>

                <button
                    type="submit"
                    form="checkout-form"
                    className={styles.confirmBtn}
                    disabled={items.length === 0 || isSubmitting}
                >
                    {isSubmitting ? 'ОБРОБКА...' : 'ПІДТВЕРДИТИ ЗАМОВЛЕННЯ'}
                </button>
            </div>
        </div>
    )
}
