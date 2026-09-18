import { NextResponse } from "next/server";
import { validateCartAgainstSanityWithClient } from "@/lib/cart/validate";
import { sanityServer } from "@/lib/sanityServer";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asFiniteNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function asPositiveInt(v: unknown): number | undefined {
  const n = asFiniteNumber(v);
  if (n === undefined) return undefined;
  const t = Math.trunc(n);
  return t > 0 ? t : undefined;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (!isRecord(body) || !Array.isArray(body.items)) {
      return NextResponse.json(
        { ok: false, error: "items must be an array" },
        { status: 400 },
      );
    }

    const lines = body.items
      .map((row) => {
        if (!isRecord(row)) return null;
        const productId =
          typeof row.productId === "string" ? row.productId.trim() : "";
        const quantity = asPositiveInt(row.quantity);
        if (!productId || quantity === undefined) return null;
        const clientUnitPrice = asFiniteNumber(row.clientUnitPrice);
        const clientWholesalePrice = asFiniteNumber(row.clientWholesalePrice);
        const clientWholesaleMinQuantity = asPositiveInt(
          row.clientWholesaleMinQuantity,
        );
        const clientPiecesPerBox = asPositiveInt(row.clientPiecesPerBox);
        return {
          productId,
          quantity,
          ...(clientUnitPrice !== undefined ? { clientUnitPrice } : {}),
          ...(clientWholesalePrice !== undefined
            ? { clientWholesalePrice }
            : {}),
          ...(clientWholesaleMinQuantity !== undefined
            ? { clientWholesaleMinQuantity }
            : {}),
          ...(clientPiecesPerBox !== undefined ? { clientPiecesPerBox } : {}),
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      clientUnitPrice?: number;
      clientWholesalePrice?: number;
      clientWholesaleMinQuantity?: number;
      clientPiecesPerBox?: number;
    }>;

    const result = await validateCartAgainstSanityWithClient(
      lines,
      sanityServer,
    );
    const status = result.ok ? 200 : 409;
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
