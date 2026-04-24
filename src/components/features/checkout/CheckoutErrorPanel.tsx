'use client'

import styles from '@/app/(storefront)/checkout/page.module.scss'
import { RetryAction } from './RetryAction'

type CheckoutErrorPanelProps = {
    message: string
    onRetry: () => void
}

export function CheckoutErrorPanel({ message, onRetry }: CheckoutErrorPanelProps) {
    return (
        <div>
            <p className={styles.checkoutError} role="alert">
                {message}
            </p>
            <RetryAction onRetry={onRetry} className={styles.confirmBtn} label="Оновити форму" />
        </div>
    )
}
