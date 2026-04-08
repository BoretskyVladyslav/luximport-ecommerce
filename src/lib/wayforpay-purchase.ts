import crypto from 'crypto'

export function normalizeMerchantDomainName(input: string): string {
    const raw = input.trim()
    if (!raw) return ''
    try {
        const asUrl = new URL(raw.includes('://') ? raw : `https://${raw}`)
        return asUrl.hostname.toLowerCase()
    } catch {
        const host = raw.replace(/^https?:\/\//i, '').split('/')[0].trim().toLowerCase()
        const noPort = host.split(':')[0] ?? host
        return noPort
    }
}

export const WAYFORPAY_GOOGLE_PAY = '1'

export function formatWayforpayAmount(amount: number): string {
    return amount.toFixed(2)
}

export type WayforpayPurchaseInput = {
    merchantAccount: string
    secretKey: string
    domain: string
    orderReference: string
    amount: number
    currency: string
    productNames: string[]
    productCounts: number[]
    productPrices: number[]
}

export function buildWayforpayPurchasePayload(input: WayforpayPurchaseInput) {
    const n = input.productNames.length
    if (input.productCounts.length !== n || input.productPrices.length !== n) {
        throw new Error('productNames, productCounts, and productPrices length mismatch')
    }

    const merchantDomainName = normalizeMerchantDomainName(input.domain)
    const orderDate = Math.floor(Date.now() / 1000)
    const amountStr = formatWayforpayAmount(input.amount)

    const signatureString = [
        input.merchantAccount,
        merchantDomainName,
        input.orderReference.trim(),
        String(orderDate),
        amountStr,
        input.currency.trim(),
        input.productNames.join(';'),
        input.productCounts.map(String).join(';'),
        input.productPrices.map(String).join(';'),
    ].join(';')

    const merchantSignature = crypto.createHmac('md5', input.secretKey).update(signatureString).digest('hex')

    return {
        merchantAccount: input.merchantAccount,
        merchantDomainName,
        orderReference: input.orderReference.trim(),
        orderDate,
        amount: amountStr,
        currency: input.currency.trim(),
        productName: input.productNames,
        productCount: input.productCounts,
        productPrice: input.productPrices,
        merchantSignature,
        googlePay: WAYFORPAY_GOOGLE_PAY,
    }
}
