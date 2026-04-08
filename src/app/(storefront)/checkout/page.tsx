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
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { PhoneInput } from '@/components/ui/phone-input'
import { Skeleton } from '@/components/ui/skeletons'
import toast from 'react-hot-toast'
import styles from './page.module.scss'
import type { FieldErrors } from 'react-hook-form'

type NpOption = { description: string; ref: string }

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeEmail(input: string) {
    return input.trim().toLowerCase()
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function toNpOptions(input: unknown): NpOption[] {
    if (!Array.isArray(input)) return []
    const out: NpOption[] = []
    for (const row of input) {
        if (!isRecord(row)) continue
        const desc = row.Description
        const ref = row.Ref
        if (typeof desc === 'string' && desc.trim() && typeof ref === 'string' && ref.trim()) {
            out.push({ description: desc.trim(), ref: ref.trim() })
        }
    }
    return out
}

export default function CheckoutPage() {
    const { user, isAuthenticated } = useAuthStore()
    const { items, clearCart, totalPrice } = useCartStore()
    const { addOrder, setLastOrder } = useOrderStore()
    const isHydrated = useHydration()
    const router = useRouter()

    const [cityRef, setCityRef] = useState('')
    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const [npError, setNpError] = useState<string | null>(null)
    const [manualDelivery, setManualDelivery] = useState(false)

    const checkoutFailureMessage =
        'Помилка при створенні замовлення. Спробуйте ще раз.'

    const {
        register,
        handleSubmit,
        setValue,
        setError,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        shouldFocusError: true,
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            city: '',
            postOffice: '',
        },
    })

    useEffect(() => {
        if (!isHydrated) return
        let cancelled = false
        async function run() {
            try {
                const res = await fetch('/api/user/me', { method: 'GET' })
                const data = (await res.json().catch(() => null)) as any
                const u = data?.user
                if (!u || typeof u !== 'object') {
                    if (!cancelled) router.push('/account/login')
                    return
                }
                const firstName = typeof u.firstName === 'string' ? u.firstName.trim() : ''
                const lastName = typeof u.lastName === 'string' ? u.lastName.trim() : ''
                const name =
                    firstName || lastName
                        ? [firstName, lastName].join(' ').replace(/\s+/g, ' ').trim()
                        : typeof u.name === 'string'
                            ? u.name
                            : ''
                const email = typeof u.email === 'string' ? u.email : ''
                const phone = typeof u.phone === 'string' ? u.phone : ''
                if (!cancelled) {
                    setValue('name', name, { shouldValidate: false })
                    setValue('email', email, { shouldValidate: false })
                    setValue('phone', phone, { shouldValidate: false })
                }
            } catch {
                if (!cancelled) router.push('/account/login')
            }
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [isHydrated, router, setValue])

    const total = totalPrice()
    const cityValue = watch('city')
    const postOfficeValue = watch('postOffice')

    const fetchCities = async (query: string) => {
        setNpError(null)
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
            const raw: unknown = await res.json().catch(() => null)
            if (!res.ok) {
                setNpError('Не вдалося завантажити список міст. Введіть дані вручну.')
                setManualDelivery(true)
                return []
            }
            if (!isRecord(raw) || raw.success !== true) {
                setNpError('Не вдалося завантажити список міст. Введіть дані вручну.')
                setManualDelivery(true)
                return []
            }
            const options = toNpOptions(raw.data)
            return options
        } catch {
            setNpError('Сервіс доставки тимчасово недоступний. Введіть дані вручну.')
            setManualDelivery(true)
            return []
        }
    }

    const fetchBranches = async (cityRefValue: string, query: string = '') => {
        if (!cityRefValue) return []
        setNpError(null)
        try {
            const res = await fetch('/api/np', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modelName: 'AddressGeneral',
                    calledMethod: 'getWarehouses',
                    methodProperties: { CityRef: cityRefValue, FindByString: query },
                }),
            })
            const raw: unknown = await res.json().catch(() => null)
            if (!res.ok) {
                setNpError('Не вдалося завантажити відділення. Введіть дані вручну.')
                setManualDelivery(true)
                return []
            }
            if (!isRecord(raw) || raw.success !== true) {
                setNpError('Не вдалося завантажити відділення. Введіть дані вручну.')
                setManualDelivery(true)
                return []
            }
            return toNpOptions(raw.data)
        } catch {
            setNpError('Сервіс доставки тимчасово недоступний. Введіть дані вручну.')
            setManualDelivery(true)
            return []
        }
    }

    const onSubmit = async (data: CheckoutFormData) => {
        if (items.length === 0) {
            const msg = 'Ваш кошик порожній'
            setCheckoutError(msg)
            toast.error(msg)
            return
        }

        setCheckoutError(null)
        const normalizedEmail = normalizeEmail(data.email)
        if (!isValidEmail(normalizedEmail)) {
            setError('email', { type: 'validate', message: 'Будь ласка, введіть коректний email' })
            return
        }
        const sanitizedPhone = data.phone

        const dateObj = new Date()
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`
        const randomId = `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        const totalFormatted = `${total.toLocaleString('uk-UA')} ₴`

        try {
            const slowTimer = setTimeout(() => {
                toast('З\'єднання повільне, але ми працюємо. Будь ласка, зачекайте.')
            }, 10000)

            const createOrderRes = await fetch('/api/checkout/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: randomId,
                    customerName: data.name,
                    customerEmail: normalizedEmail,
                    customerPhone: sanitizedPhone,
                    shippingAddress: `${data.city}, ${data.postOffice}`,
                    items,
                    totalAmount: total,
                }),
            })

            const createdOrder = await createOrderRes.json().catch(() => null)

            if (!createOrderRes.ok) {
                const msg = typeof createdOrder?.message === 'string' ? createdOrder.message : checkoutFailureMessage
                setCheckoutError(msg)
                toast.error(msg || 'Невідома помилка')
                clearTimeout(slowTimer)
                return
            }

            const sanityOrderId = typeof createdOrder?.sanityDocumentId === 'string' ? createdOrder.sanityDocumentId : ''
            if (!sanityOrderId) {
                const msg = checkoutFailureMessage
                setCheckoutError(msg)
                toast.error(msg)
                clearTimeout(slowTimer)
                return
            }

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
                    orderReference: sanityOrderId,
                    amount: total,
                    productName: productNames,
                    productCount: productCounts,
                    productPrice: productPrices,
                }),
            })

            const paymentData = await paymentRes.json()

            if (!paymentRes.ok) {
                console.error('Payment Init Error:', paymentData)
                setCheckoutError(checkoutFailureMessage)
                clearTimeout(slowTimer)
                return
            }

            clearTimeout(slowTimer)

            const newOrder = {
                id: randomId,
                date: formattedDate,
                status: 'processing' as const,
                statusText: 'ОБРОБЛЯЄТЬСЯ',
                total: totalFormatted,
                customerName: data.name,
                customerEmail: normalizedEmail,
                customerPhone: sanitizedPhone,
                shippingAddress: `${data.city}, ${data.postOffice}`,
                items: [...items],
                fulfillment: 'pending' as const,
                payment: 'pending' as const,
                isPaid: false,
                sanityOrderStatus: 'pending',
                itemsCount: items.length,
                sanityDocumentId: sanityOrderId,
                totalAmount: total,
            }

            addOrder(newOrder)
            setLastOrder(newOrder)
            clearCart()

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
        } catch (error) {
            console.error('Checkout error:', error)
            setCheckoutError(checkoutFailureMessage)
        }
    }

    const onInvalid = (errs: FieldErrors<CheckoutFormData>) => {
        setCheckoutError('Перевірте, будь ласка, виділені поля')
        const keys = Object.keys(errs) as Array<keyof CheckoutFormData>
        const firstKey = keys[0]
        if (!firstKey) return
        const el = document.querySelector(`[name="${String(firstKey)}"]`)
        if (el && el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.focus()
        }
    }

    if (!isHydrated) {
        return (
            <div className={styles.container}>
                <div className={styles.formSection}>
                    <Skeleton className="mb-6 h-10 w-64 rounded-md" />
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-48 rounded-sm" />
                        <Skeleton className="h-12 w-full rounded-md" />
                        <Skeleton className="h-4 w-48 rounded-sm" />
                        <Skeleton className="h-12 w-full rounded-md" />
                        <Skeleton className="h-4 w-48 rounded-sm" />
                        <Skeleton className="h-12 w-full rounded-md" />
                        <Skeleton className="mt-6 h-12 w-full rounded-md" />
                    </div>
                </div>
                <div className={styles.summarySection}>
                    <Skeleton className="mb-6 h-8 w-56 rounded-md" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className={styles.summaryItem}>
                                <div className={styles.itemInfo}>
                                    <Skeleton className="h-4 w-48 rounded-sm" />
                                    <Skeleton className="mt-2 h-3 w-20 rounded-sm" />
                                </div>
                                <Skeleton className="h-4 w-20 rounded-sm" />
                            </div>
                        ))}
                    </div>
                    <div className={styles.totalRow}>
                        <Skeleton className="h-4 w-24 rounded-sm" />
                        <Skeleton className="h-4 w-28 rounded-sm" />
                    </div>
                    <Skeleton className="mt-6 h-12 w-full rounded-md" />
                </div>
            </div>
        )
    }

    return (
        <>
        <LoadingOverlay show={isSubmitting} />
        <div className={styles.container}>
            <div className={styles.formSection}>
                <h1 className={styles.sectionTitle}>ОФОРМЛЕННЯ ЗАМОВЛЕННЯ</h1>

                {checkoutError && (
                    <p className={styles.checkoutError} role="alert">
                        {checkoutError}
                    </p>
                )}

                <form id="checkout-form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
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
                            <PhoneInput id="phone" className={styles.input} {...register('phone')} />
                            {errors.phone && (
                                <p className={styles.fieldError}>{errors.phone.message}</p>
                            )}
                        </div>

                        <div className={styles.fullWidth} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                            <span className={styles.label} style={{ marginBottom: 0 }}>Доставка</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !manualDelivery
                                    setManualDelivery(next)
                                    setNpError(null)
                                    if (next) {
                                        setCityRef('')
                                    }
                                }}
                                className={styles.confirmBtn}
                                style={{ width: 'auto', padding: '0.75rem 1.25rem', fontSize: '0.7rem' }}
                            >
                                {manualDelivery ? 'ВИБРАТИ ЗІ СПИСКУ' : 'ВВЕСТИ ВРУЧНУ'}
                            </button>
                        </div>

                        {npError && (
                            <p className={styles.checkoutError} role="alert">
                                {npError}
                            </p>
                        )}

                        {manualDelivery ? (
                            <>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Місто</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Наприклад: Київ"
                                        {...register('city')}
                                    />
                                    {errors.city && (
                                        <p className={styles.fieldError}>{errors.city.message}</p>
                                    )}
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Відділення / адреса</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Наприклад: Відділення №1 або вул. ..."
                                        {...register('postOffice')}
                                    />
                                    {errors.postOffice && (
                                        <p className={styles.fieldError}>{errors.postOffice.message}</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.fullWidth}>
                                    <NpSelect
                                        label="Місто"
                                        placeholder="Введіть назву міста..."
                                        value={cityValue}
                                        onChange={(val, ref) => {
                                            setValue('city', val, { shouldValidate: true })
                                            setCityRef(ref)
                                            setValue('postOffice', '', { shouldValidate: true })
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
                                        placeholder={cityRef ? 'Оберіть відділення...' : 'Спочатку оберіть місто'}
                                        value={postOfficeValue}
                                        onChange={(val) => {
                                            setValue('postOffice', val, { shouldValidate: true })
                                        }}
                                        onSearch={(query) => fetchBranches(cityRef, query)}
                                    />
                                    {errors.postOffice && (
                                        <p className={styles.fieldError}>{errors.postOffice.message}</p>
                                    )}
                                </div>
                            </>
                        )}
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
                    disabled={isSubmitting}
                >
                    <span className={styles.confirmBtnInner}>
                        {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
                        {isSubmitting ? 'Обробка замовлення...' : 'ПІДТВЕРДИТИ ЗАМОВЛЕННЯ'}
                    </span>
                </button>
            </div>
        </div>
        </>
    )
}
