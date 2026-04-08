export function normalizeUaPhone(input: string) {
    const digits = String(input ?? '').replace(/\D/g, '')
    if (digits.startsWith('380')) return `+${digits.slice(0, 12)}`
    if (digits.startsWith('0')) return `+380${digits.slice(1, 10)}`
    if (digits.startsWith('3')) return `+${digits.slice(0, 12)}`
    return `+${digits}`.slice(0, 13)
}

export function isValidUaPhoneE164(input: string) {
    return /^\+380\d{9}$/.test(input)
}

