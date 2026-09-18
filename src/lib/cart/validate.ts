import { sanityServer } from "@/lib/sanityServer";
import { toCents } from "@/lib/money";
import { unitPriceForQuantity } from "@/lib/cart/pricing";

export type ClientCartLine = {
  productId: string;
  quantity: number;
  clientUnitPrice?: number;
  clientWholesalePrice?: number;
  clientWholesaleMinQuantity?: number;
  clientPiecesPerBox?: number;
};

export type CartValidationIssue =
  | { code: "NOT_FOUND"; productId: string }
  | { code: "OUT_OF_STOCK"; productId: string }
  | { code: "INSUFFICIENT_STOCK"; productId: string; available: number }
  | { code: "PRICE_CHANGED"; productId: string };

export type ValidatedCartLine = {
  productId: string;
  title: string;
  quantity: number;
  stock: number | null;
  unitPrice: number;
  unitPriceCents: number;
  lineTotalCents: number;
  price: number;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
  piecesPerBox: number | null;
};

type SanityProductPricing = {
  _id: string;
  title: string | null;
  price: number | null;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
  piecesPerBox: number | null;
  stock: number | null;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asPositiveInt(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const n = Math.trunc(v);
  return n > 0 ? n : undefined;
}

function asFiniteOptional(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export async function validateCartAgainstSanity(lines: ClientCartLine[]) {
  return validateCartAgainstSanityWithClient(lines);
}

export async function validateCartAgainstSanityWithClient(
  lines: ClientCartLine[],
  client: {
    fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
  } = sanityServer,
) {
  const normalized: ClientCartLine[] = [];
  for (const line of lines) {
    if (!line || typeof line !== "object") continue;
    if (!isNonEmptyString(line.productId)) continue;
    const quantity = asPositiveInt(line.quantity);
    if (quantity === undefined) continue;
    normalized.push({
      ...line,
      productId: line.productId.trim(),
      quantity,
      clientUnitPrice: asFiniteOptional(line.clientUnitPrice),
      clientWholesalePrice: asFiniteOptional(line.clientWholesalePrice),
      clientWholesaleMinQuantity: asPositiveInt(
        line.clientWholesaleMinQuantity,
      ),
      clientPiecesPerBox: asPositiveInt(line.clientPiecesPerBox),
    });
  }

  const ids = Array.from(new Set(normalized.map((l) => l.productId)));
  if (ids.length === 0) {
    return {
      ok: true as const,
      issues: [] as CartValidationIssue[],
      lines: [] as ValidatedCartLine[],
      totalCents: 0,
    };
  }

  const products = await client.fetch<SanityProductPricing[]>(
    `*[_type == "product" && _id in $ids && !(_id match "drafts.*")]{
            _id,
            title,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            stock
        }`,
    { ids },
  );

  const byId = new Map(products.map((p) => [p._id, p]));
  const issues: CartValidationIssue[] = [];
  const validatedLines: ValidatedCartLine[] = [];

  for (const line of normalized) {
    const p = byId.get(line.productId);
    if (!p) {
      issues.push({ code: "NOT_FOUND", productId: line.productId });
      continue;
    }

    let availableStock = Infinity;
    let stock: number | null = null;
    if (typeof p.stock === "number" && Number.isFinite(p.stock)) {
      const n = Math.max(0, Math.trunc(p.stock));
      availableStock = n;
      stock = n;
    }
    if (stock === 0) {
      issues.push({ code: "OUT_OF_STOCK", productId: line.productId });
      continue;
    }

    const basePrice =
      typeof p.price === "number" && Number.isFinite(p.price) ? p.price : 0;
    const wholesalePrice =
      typeof p.wholesalePrice === "number" && Number.isFinite(p.wholesalePrice)
        ? p.wholesalePrice
        : null;
    const wholesaleMinQuantity =
      typeof p.wholesaleMinQuantity === "number" &&
      Number.isInteger(p.wholesaleMinQuantity)
        ? p.wholesaleMinQuantity
        : null;
    const piecesPerBox =
      typeof p.piecesPerBox === "number" && Number.isInteger(p.piecesPerBox)
        ? p.piecesPerBox
        : null;

    if (line.quantity > availableStock) {
      const available = Number.isFinite(availableStock)
        ? Math.max(0, Math.trunc(availableStock))
        : 0;
      issues.push({
        code: "INSUFFICIENT_STOCK",
        productId: line.productId,
        available,
      });
    }

    const unitPrice = unitPriceForQuantity({
      price: basePrice,
      wholesalePrice,
      wholesaleMinQuantity,
      piecesPerBox,
      quantity: line.quantity,
    });

    const unitPriceCents = toCents(unitPrice);
    const lineTotalCents = unitPriceCents * line.quantity;

    const clientMismatch =
      (typeof line.clientUnitPrice === "number" &&
        toCents(line.clientUnitPrice) !== unitPriceCents) ||
      (typeof line.clientWholesalePrice === "number" &&
        wholesalePrice !== null &&
        toCents(line.clientWholesalePrice) !== toCents(wholesalePrice)) ||
      (typeof line.clientWholesaleMinQuantity === "number" &&
        wholesaleMinQuantity !== null &&
        Math.trunc(line.clientWholesaleMinQuantity) !==
          Math.trunc(wholesaleMinQuantity)) ||
      (typeof line.clientPiecesPerBox === "number" &&
        piecesPerBox !== null &&
        Math.trunc(line.clientPiecesPerBox) !== Math.trunc(piecesPerBox));

    if (clientMismatch) {
      issues.push({ code: "PRICE_CHANGED", productId: line.productId });
    }

    validatedLines.push({
      productId: line.productId,
      title: typeof p.title === "string" ? p.title : "",
      quantity: line.quantity,
      stock,
      unitPrice,
      unitPriceCents,
      lineTotalCents,
      price: basePrice,
      wholesalePrice,
      wholesaleMinQuantity,
      piecesPerBox,
    });
  }

  const totalCents = validatedLines.reduce(
    (acc, l) => acc + l.lineTotalCents,
    0,
  );
  const blocking = issues.some((i) => i.code !== "PRICE_CHANGED");

  return {
    ok: !blocking,
    issues,
    lines: validatedLines,
    totalCents,
  };
}
