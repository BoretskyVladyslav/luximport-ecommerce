'use client'

type RetryActionProps = {
    onRetry: () => void
    label?: string
    className?: string
}

export function RetryAction({ onRetry, label = 'Спробувати ще раз', className }: RetryActionProps) {
    return (
        <button type="button" onClick={onRetry} className={className}>
            {label}
        </button>
    )
}
