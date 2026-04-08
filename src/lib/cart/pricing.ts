export type PricingInput = {
    price: number
    wholesalePrice?: number | null
    wholesaleMinQuantity?: number | null
    piecesPerBox?: number | null
    quantity: number
}

export function unitPriceForQuantity(input: PricingInput) {
    const threshold = input.piecesPerBox ?? input.wholesaleMinQuantity ?? null
    if (
        typeof threshold === 'number' &&
        Number.isFinite(threshold) &&
        threshold > 0 &&
        input.wholesalePrice !== undefined &&
        input.wholesalePrice !== null &&
        Number.isFinite(input.wholesalePrice) &&
        input.wholesalePrice >= 0 &&
        input.quantity >= threshold
    ) {
        return input.wholesalePrice
    }
    return input.price
}

