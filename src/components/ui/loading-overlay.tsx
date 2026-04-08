'use client'

type Props = {
    show: boolean
}

export function LoadingOverlay({ show }: Props) {
    if (!show) return null
    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    color: '#111',
                    pointerEvents: 'none',
                }}
            >
                Обробка...
            </div>
        </div>
    )
}

