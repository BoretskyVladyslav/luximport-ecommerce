export function toCents(amount: number) {
    if (!Number.isFinite(amount)) return 0
    return Math.round(amount * 100)
}

export function fromCents(cents: number) {
    return cents / 100
}

export function formatMoney2(amount: number) {
    return fromCents(toCents(amount)).toFixed(2)
}

