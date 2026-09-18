export type WholesaleFields = {
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  piecesPerBox?: number | null;
};

export type PricingInput = WholesaleFields & {
  price: number;
  quantity: number;
};

function isPositiveInt(v: unknown): v is number {
  return (
    typeof v === "number" && Number.isFinite(v) && Number.isInteger(v) && v > 0
  );
}

function isValidWholesalePrice(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

export function wholesaleThreshold(
  input: Pick<WholesaleFields, "piecesPerBox" | "wholesaleMinQuantity">,
): number | null {
  if (isPositiveInt(input.piecesPerBox)) return input.piecesPerBox;
  if (isPositiveInt(input.wholesaleMinQuantity))
    return input.wholesaleMinQuantity;
  return null;
}

export function isWholesaleActive(input: PricingInput): boolean {
  const threshold = wholesaleThreshold(input);
  return (
    threshold !== null &&
    isValidWholesalePrice(input.wholesalePrice) &&
    input.quantity >= threshold
  );
}

export function remainingToWholesale(
  quantity: number,
  threshold: number,
): number {
  const qty =
    typeof quantity === "number" && Number.isFinite(quantity) ? quantity : 0;
  return Math.max(0, threshold - qty);
}

export function unitPriceForQuantity(input: PricingInput) {
  if (isWholesaleActive(input) && input.wholesalePrice != null) {
    return input.wholesalePrice;
  }
  return input.price;
}
