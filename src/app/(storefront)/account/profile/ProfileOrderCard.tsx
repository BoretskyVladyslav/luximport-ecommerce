'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle2,
    ChevronDown,
    Copy,
    CreditCard,
    ExternalLink,
    Package,
    Truck,
    XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { urlFor } from '@/lib/sanity'
import { cn } from '@/lib/utils'
import type { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types'
import styles from './ProfileOrderCard.module.scss'

const FULFILLMENT_SEQUENCE: OrderFulfillmentStatus[] = ['pending', 'paid', 'processing', 'shipped', 'completed']

const STEP_UI: { key: OrderFulfillmentStatus; label: string }[] = [
    { key: 'pending', label: 'Очікує підтвердження' },
    { key: 'paid', label: 'Платіж отримано' },
    { key: 'processing', label: 'Комплектується' },
    { key: 'shipped', label: 'Прямує до вас' },
    { key: 'completed', label: 'Отримано' },
]

const NP_TRACKING_BASE = 'https://tracking.novaposhta.ua/#/uk/'
export type ProfileOrderLine = {
    productId: string
    title: string
    quantity: number
    price: number
    image?: unknown
    imageUrl?: string
}

function npTrackingUrl(ttn: string) {
    return `${NP_TRACKING_BASE}${encodeURIComponent(ttn.trim())}`
}

function lineImageSrc(line: ProfileOrderLine): string | null {
    if (typeof line.imageUrl === 'string' && line.imageUrl.trim()) return line.imageUrl.trim()
    if (line.image && typeof line.image === 'object') {
        try {
            return urlFor(line.image).width(104).height(104).fit('fillmax').format('webp').quality(82).url()
        } catch {
            return null
        }
    }
    return null
}

function lineBeforeDot(fulfillment: OrderFulfillmentStatus, dotIndex: number): 'done' | 'todo' | 'hidden' {
    if (dotIndex === 0) return 'hidden'
    if (fulfillment === 'completed') return 'done'
    const idx = FULFILLMENT_SEQUENCE.indexOf(fulfillment)
    if (idx < 0) return 'todo'
    return idx >= dotIndex ? 'done' : 'todo'
}

function lineAfterDot(fulfillment: OrderFulfillmentStatus, dotIndex: number): 'done' | 'todo' | 'hidden' {
    if (dotIndex >= STEP_UI.length - 1) return 'hidden'
    if (fulfillment === 'completed') return 'done'
    const idx = FULFILLMENT_SEQUENCE.indexOf(fulfillment)
    if (idx < 0) return 'todo'
    return idx > dotIndex ? 'done' : 'todo'
}

function stepPhase(
    fulfillment: OrderFulfillmentStatus,
    stepIndex: number
): 'done' | 'current' | 'upcoming' {
    if (fulfillment === 'completed') return 'done'
    const idx = FULFILLMENT_SEQUENCE.indexOf(fulfillment)
    if (idx < 0) return 'upcoming'
    if (stepIndex < idx) return 'done'
    if (stepIndex === idx) return 'current'
    return 'upcoming'
}

function segmentClassName(state: 'done' | 'todo' | 'hidden'): string {
    if (state === 'hidden') return 'invisible min-w-[6px] flex-1 rounded-sm'
    if (state === 'done') return 'h-0.5 min-w-[6px] flex-1 rounded-sm bg-zinc-900'
    return 'h-0.5 min-w-[6px] flex-1 rounded-sm bg-zinc-200'
}

function dotClassName(phase: 'done' | 'current' | 'upcoming'): string {
    const base =
        'size-3 shrink-0 rounded-full border-2 transition-[border-color,background-color,box-shadow] duration-200'
    if (phase === 'upcoming') return cn(base, 'border-zinc-200 bg-zinc-200')
    if (phase === 'done') return cn(base, 'border-zinc-900 bg-zinc-900')
    return cn(
        base,
        'border-zinc-900 bg-zinc-900 shadow-[0_0_0_2px_rgb(255_255_255),0_0_0_4px_rgb(24_24_27)]'
    )
}

function paymentHintText(payment: OrderPaymentStatus, settled: boolean): string | null {
    if (settled || payment === 'paid') return null
    if (payment === 'pending') return 'Очікується підтвердження оплати'
    if (payment === 'failed') return 'Оплата не пройшла. Зв’яжіться з нами, якщо потрібна допомога.'
    return null
}

function effectiveStepperFulfillment(
    fulfillment: OrderFulfillmentStatus,
    settled: boolean,
    payment: OrderPaymentStatus
): OrderFulfillmentStatus {
    if ((settled || payment === 'paid') && fulfillment === 'pending') {
        return 'paid'
    }
    return fulfillment
}

export type ProfileOrderCardProps = {
    id: string
    date: string
    total: string
    itemsCount: number
    fulfillment: OrderFulfillmentStatus
    payment: OrderPaymentStatus
    canPay: boolean
    isPaidDisplay: boolean
    isCancelled: boolean
    trackingNumber?: string
    lines: ProfileOrderLine[]
    sanityDocumentId?: string
    onOrdersInvalidate?: () => void
    onProfilePay?: (sanityDocumentId: string) => void
    profilePayInProgress?: boolean
    wayforpayReady?: boolean
}

export function ProfileOrderCard({
    id,
    date,
    total,
    itemsCount,
    fulfillment,
    payment,
    canPay,
    isPaidDisplay,
    isCancelled,
    trackingNumber,
    lines,
    sanityDocumentId,
    onOrdersInvalidate,
    onProfilePay,
    profilePayInProgress = false,
    wayforpayReady,
}: ProfileOrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const widgetReady = onProfilePay ? Boolean(wayforpayReady) : true
    const [isCancelling, setIsCancelling] = useState(false)
    const settledPaymentUi = isPaidDisplay || payment === 'paid'
    const hint = paymentHintText(payment, settledPaymentUi)
    const ttn = trackingNumber?.trim() ?? ''
    const hasLines = lines.length > 0
    const showPay =
        canPay &&
        !isPaidDisplay &&
        !isCancelled &&
        payment !== 'paid' &&
        (payment === 'pending' || payment === 'failed')
    const showCancel = canPay && !isPaidDisplay && !isCancelled && payment === 'pending'
    const canRetryPayment = Boolean(sanityDocumentId?.trim())
    const stepperFulfillment = effectiveStepperFulfillment(fulfillment, isPaidDisplay, payment)

    const onCopyTtn = useCallback(async () => {
        if (!ttn) return
        try {
            await navigator.clipboard.writeText(ttn)
            toast.success('ТТН скопійовано')
        } catch {
            toast.error('Не вдалося скопіювати')
        }
    }, [ttn])

    const onPayClick = useCallback(() => {
        const oid = sanityDocumentId?.trim()
        if (!oid || !onProfilePay) return
        if (!widgetReady) {
            toast.error('Платіжна форма ще завантажується. Спробуйте за кілька секунд.')
            return
        }
        onProfilePay(oid)
    }, [sanityDocumentId, onProfilePay, widgetReady])

    const onCancel = useCallback(async () => {
        if (!sanityDocumentId?.trim()) return
        if (!window.confirm('Ви впевнені, що хочете скасувати це замовлення?')) return
        setIsCancelling(true)
        try {
            const res = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: sanityDocumentId.trim() }),
            })
            const data = (await res.json().catch(() => null)) as { message?: string } | null
            if (!res.ok) {
                toast.error(typeof data?.message === 'string' ? data.message : 'Не вдалося скасувати')
                return
            }
            toast.success('Замовлення скасовано')
            onOrdersInvalidate?.()
        } catch {
            toast.error('Не вдалося скасувати')
        } finally {
            setIsCancelling(false)
        }
    }, [sanityDocumentId, onOrdersInvalidate])

    const renderStepper = () => (
        <div
            className="flex w-full max-sm:-mx-1 max-sm:gap-1 max-sm:overflow-x-auto max-sm:px-1 max-sm:pb-1 max-sm:pt-0.5"
            role="list"
            aria-label="Етапи замовлення"
        >
            {STEP_UI.map((step, i) => {
                const phase = stepPhase(stepperFulfillment, i)
                const before = lineBeforeDot(stepperFulfillment, i)
                const after = lineAfterDot(stepperFulfillment, i)
                return (
                    <div
                        key={step.key}
                        className="relative flex min-w-0 flex-1 flex-col items-center text-center max-sm:min-w-[4.75rem] max-sm:max-w-[5.75rem] max-sm:flex-none"
                        role="listitem"
                    >
                        <div className="mb-2 flex w-full items-center">
                            <span className={segmentClassName(before)} aria-hidden />
                            <div className="flex shrink-0 items-center justify-center">
                                <motion.span
                                    className={dotClassName(phase)}
                                    initial={false}
                                    animate={{ scale: phase === 'current' ? 1.12 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                />
                            </div>
                            <span className={segmentClassName(after)} aria-hidden />
                        </div>
                        <span
                            className={cn(
                                'max-w-[5.5rem] text-center text-[10px] font-semibold uppercase leading-tight tracking-wider max-sm:max-w-none',
                                phase === 'upcoming' && 'text-muted-foreground',
                                (phase === 'done' || phase === 'current') && 'text-zinc-900'
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )

    const renderDetails = () => (
        <AnimatePresence initial={false}>
            {isExpanded && hasLines ? (
                <motion.div
                    key="order-details"
                    className={styles.detailsShell}
                    layout
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    <div className={styles.detailsInner}>
                        {lines.map((line, lineIndex) => {
                            const src = lineImageSrc(line)
                            const lineTotal = line.price * line.quantity
                            return (
                                <div key={`${line.productId}-${lineIndex}`} className={styles.detailLine}>
                                    <div className={styles.detailImageWrap}>
                                        {src ? (
                                            <Image
                                                className={styles.detailImage}
                                                src={src}
                                                alt=""
                                                width={52}
                                                height={52}
                                                unoptimized
                                            />
                                        ) : null}
                                    </div>
                                    <div className={styles.detailBody}>
                                        <span className={styles.detailTitle}>{line.title}</span>
                                        <span className={styles.detailMeta}>
                                            Кількість: {line.quantity}
                                        </span>
                                    </div>
                                    <span className={styles.detailPrice}>
                                        {lineTotal.toLocaleString('uk-UA', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        ₴
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )

    const renderActions = (opts?: { cancelledOnly?: boolean }) => {
        const cancelledOnly = opts?.cancelledOnly === true
        return (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 max-sm:flex-col max-sm:items-stretch">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasLines}
                    aria-expanded={isExpanded}
                    className="text-xs uppercase tracking-wider"
                    onClick={() => hasLines && setIsExpanded((v) => !v)}
                >
                    {isExpanded ? 'Згорнути' : 'Деталі замовлення'}
                    <ChevronDown
                        className={cn('ml-2 h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-180')}
                        aria-hidden
                    />
                </Button>
                {!cancelledOnly ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 max-sm:w-full max-sm:justify-end">
                        {showPay ? (
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                disabled={!canRetryPayment || !onProfilePay || profilePayInProgress}
                                className="text-xs uppercase tracking-wider"
                                onClick={() => onPayClick()}
                            >
                                <CreditCard className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                                {profilePayInProgress ? 'Зачекайте…' : 'Оплатити'}
                            </Button>
                        ) : null}
                        {showCancel ? (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={!sanityDocumentId?.trim() || isCancelling}
                                className="text-xs uppercase tracking-wider"
                                onClick={() => void onCancel()}
                            >
                                {isCancelling ? 'Зачекайте…' : 'Скасувати'}
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        )
    }

    const renderTracking = () =>
        ttn ? (
            <div className={styles.trackingBlock}>
                <span className={styles.trackingLabel}>
                    <Truck className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
                    ТТН Нової Пошти
                </span>
                <div className={styles.trackingRow}>
                    <a
                        href={npTrackingUrl(ttn)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.trackingLinkWrap}
                    >
                        <span className={styles.trackingNumber}>{ttn}</span>
                        <ExternalLink size={16} strokeWidth={1.5} className={styles.trackingIcon} aria-hidden />
                    </a>
                    <button type="button" className={styles.copyBtn} onClick={() => void onCopyTtn()}>
                        <Copy size={14} strokeWidth={1.75} aria-hidden />
                        Копіювати
                    </button>
                </div>
            </div>
        ) : null

    if (isCancelled || fulfillment === 'cancelled') {
        return (
            <motion.div
                className={styles.cardInner}
                layout
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                <div className={styles.topRow}>
                    <div className={styles.meta}>
                        <span className={styles.orderId}>{id}</span>
                        <span className={styles.orderDate}>{date}</span>
                    </div>
                    <div className={styles.totals}>
                        <span className={styles.orderTotal}>{total}</span>
                        <span className={cn(styles.itemsMeta, 'inline-flex items-center gap-1.5')}>
                            <Package className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
                            {itemsCount} товарів
                        </span>
                    </div>
                </div>
                <div
                    className="inline-flex w-fit max-w-full items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium tracking-wide text-white"
                    role="status"
                >
                    <XCircle size={18} className="shrink-0" aria-hidden />
                    <span className="uppercase tracking-wide">Скасовано</span>
                </div>
                {renderDetails()}
                {renderActions({ cancelledOnly: true })}
                {renderTracking()}
            </motion.div>
        )
    }

    return (
        <motion.div
            className={styles.cardInner}
            layout
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            <div className={styles.topRow}>
                <div className={styles.meta}>
                    <span className={styles.orderId}>{id}</span>
                    <span className={styles.orderDate}>{date}</span>
                </div>
                <div className={styles.totals}>
                    <span className={styles.orderTotal}>{total}</span>
                    <span className={cn(styles.itemsMeta, 'inline-flex items-center gap-1.5')}>
                        <Package className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
                        {itemsCount} товарів
                    </span>
                </div>
            </div>

            {isPaidDisplay ? (
                <div
                    className="inline-flex w-fit max-w-full items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium tracking-wide text-white"
                    role="status"
                >
                    <CheckCircle2 size={18} className="shrink-0" aria-hidden />
                    <span className="uppercase tracking-wide">Оплачено</span>
                </div>
            ) : null}

            {hint ? (
                <p
                    className={cn(
                        'text-xs font-medium leading-snug',
                        payment === 'failed' ? 'text-red-700' : 'text-amber-800'
                    )}
                >
                    {hint}
                </p>
            ) : null}

            {renderStepper()}
            {renderDetails()}
            {renderActions()}
            {renderTracking()}
        </motion.div>
    )
}
