'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { urlFor } from '@/lib/sanity'
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
const premiumEase = [0.25, 0.1, 0.25, 1] as const

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

function stepDotClass(
    stepKey: OrderFulfillmentStatus,
    phase: 'done' | 'current' | 'upcoming'
): string {
    if (phase === 'done') return `${styles.stepDot} ${styles.stepDotDone}`
    if (phase === 'upcoming') return `${styles.stepDot} ${styles.stepDotUpcoming}`
    if (stepKey === 'pending') return `${styles.stepDot} ${styles.stepDotCurrentPending}`
    if (stepKey === 'paid') return `${styles.stepDot} ${styles.stepDotCurrentProcessing}`
    if (stepKey === 'processing') return `${styles.stepDot} ${styles.stepDotCurrentProcessing}`
    if (stepKey === 'shipped') return `${styles.stepDot} ${styles.stepDotCurrentShipped}`
    return `${styles.stepDot} ${styles.stepDotCurrentCompleted}`
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

function segmentClass(state: 'done' | 'todo' | 'hidden'): string {
    if (state === 'hidden') return `${styles.segment} ${styles.segmentHidden}`
    if (state === 'done') return `${styles.segment} ${styles.segmentDone}`
    return `${styles.segment} ${styles.segmentTodo}`
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
        const id = sanityDocumentId?.trim()
        if (!id || !onProfilePay) return
        if (!widgetReady) {
            toast.error('Платіжна форма ще завантажується. Спробуйте за кілька секунд.')
            return
        }
        onProfilePay(id)
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
        <div className={styles.stepper} role="list" aria-label="Етапи замовлення">
            {STEP_UI.map((step, i) => {
                const phase = stepPhase(stepperFulfillment, i)
                const before = lineBeforeDot(stepperFulfillment, i)
                const after = lineAfterDot(stepperFulfillment, i)
                const paymentStageHighlight =
                    step.key === 'paid' && (phase === 'done' || phase === 'current')
                return (
                    <div key={step.key} className={styles.step} role="listitem">
                        <div className={styles.stepTrack}>
                            <span className={segmentClass(before)} aria-hidden />
                            <div className={styles.stepDotWrap}>
                                <motion.span
                                    className={`${stepDotClass(step.key, phase)}${
                                        paymentStageHighlight ? ` ${styles.stepDotPaymentReceived}` : ''
                                    }`}
                                    initial={false}
                                    animate={{
                                        scale: phase === 'current' ? 1.08 : 1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                />
                            </div>
                            <span className={segmentClass(after)} aria-hidden />
                        </div>
                        <span
                            className={`${styles.stepLabel} ${
                                phase === 'done'
                                    ? styles.stepLabelDone
                                    : phase === 'current'
                                        ? styles.stepLabelCurrent
                                        : ''
                            }${paymentStageHighlight ? ` ${styles.stepLabelPaymentReceived}` : ''}`}
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
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: premiumEase }}
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

    const renderActions = () => (
        <div className={styles.actionsRow}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasLines}
                aria-expanded={isExpanded}
                onClick={() => hasLines && setIsExpanded((v) => !v)}
            >
                {isExpanded ? 'Згорнути' : 'Переглянути'}
            </Button>
            {showPay ? (
                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={!canRetryPayment || !onProfilePay || profilePayInProgress}
                    onClick={() => onPayClick()}
                >
                    {profilePayInProgress ? 'Зачекайте…' : 'Оплатити'}
                </Button>
            ) : null}
            {showCancel ? (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!sanityDocumentId?.trim() || isCancelling}
                    onClick={() => void onCancel()}
                >
                    {isCancelling ? 'Зачекайте…' : 'Скасувати'}
                </Button>
            ) : null}
        </div>
    )

    const renderTracking = () =>
        ttn ? (
            <div className={styles.trackingBlock}>
                <span className={styles.trackingLabel}>ТТН Нової Пошти</span>
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
            <div className={styles.cardInner}>
                <div className={styles.topRow}>
                    <div className={styles.meta}>
                        <span className={styles.orderId}>{id}</span>
                        <span className={styles.orderDate}>{date}</span>
                    </div>
                    <div className={styles.totals}>
                        <span className={styles.orderTotal}>{total}</span>
                        <span className={styles.itemsMeta}>{itemsCount} товарів</span>
                    </div>
                </div>
                <div className={styles.cancelledStatusBadge} role="status">
                    <span className={styles.cancelledStatusBadgeInner}>
                        {'\u274c'} СКАСОВАНО
                    </span>
                </div>
                {renderDetails()}
                <div className={styles.actionsRow}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!hasLines}
                        aria-expanded={isExpanded}
                        onClick={() => hasLines && setIsExpanded((v) => !v)}
                    >
                        {isExpanded ? 'Згорнути' : 'Переглянути'}
                    </Button>
                </div>
                {renderTracking()}
            </div>
        )
    }

    return (
        <div className={styles.cardInner}>
            <div className={styles.topRow}>
                <div className={styles.meta}>
                    <span className={styles.orderId}>{id}</span>
                    <span className={styles.orderDate}>{date}</span>
                </div>
                <div className={styles.totals}>
                    <span className={styles.orderTotal}>{total}</span>
                    <span className={styles.itemsMeta}>{itemsCount} товарів</span>
                </div>
            </div>

            {isPaidDisplay ? (
                <div className={styles.paidStatusBadge} role="status">
                    <span className={styles.paidStatusBadgeInner}>
                        {'\u2705'} ОПЛАЧЕНО
                    </span>
                </div>
            ) : null}

            {hint ? (
                <p
                    className={`${styles.paymentHint} ${payment === 'failed' ? styles.paymentFailed : ''}`}
                >
                    {hint}
                </p>
            ) : null}

            {renderStepper()}
            {renderDetails()}
            {renderActions()}
            {renderTracking()}
        </div>
    )
}
