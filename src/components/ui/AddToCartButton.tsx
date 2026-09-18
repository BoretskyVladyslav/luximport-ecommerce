"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/cart";
import { toCartProduct } from "@/lib/cart/product-to-cart";
import {
  isWholesaleActive,
  remainingToWholesale,
  unitPriceForQuantity,
  wholesaleThreshold,
} from "@/lib/cart/pricing";
import { QtyStepper } from "@/components/ui/qty-stepper";
import styles from "./add-to-cart.module.scss";

interface Props {
  id: string;
  title: string;
  slug: string;
  price: number;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  piecesPerBox?: number;
  countInStock?: number | null;
  category?: string;
  image?: unknown;
  imageUrl?: string;
}

function formatUah(n: number) {
  return `${n.toLocaleString("uk-UA")} ₴`;
}

function stockCap(countInStock: unknown): number | null {
  return typeof countInStock === "number" && Number.isFinite(countInStock)
    ? Math.max(0, Math.trunc(countInStock))
    : null;
}

export function AddToCartButton({
  id,
  title,
  slug,
  price,
  wholesalePrice,
  wholesaleMinQuantity,
  piecesPerBox,
  countInStock,
  category,
  image,
  imageUrl,
}: Props) {
  const addItem = useStore((state) => state.addItem);
  const max = stockCap(countInStock);
  const isOutOfStock = max !== null && max <= 0;
  const [quantity, setQuantity] = useState(1);

  const threshold = wholesaleThreshold({
    piecesPerBox,
    wholesaleMinQuantity,
  });
  const hasWholesale =
    typeof wholesalePrice === "number" &&
    Number.isFinite(wholesalePrice) &&
    wholesalePrice >= 0 &&
    threshold !== null;

  const liveQty = useMemo(() => {
    if (isOutOfStock) return 1;
    if (max === null) return Math.max(1, quantity);
    return Math.min(Math.max(1, quantity), Math.max(1, max));
  }, [isOutOfStock, max, quantity]);

  const wholesaleOn = hasWholesale
    ? isWholesaleActive({
        price,
        wholesalePrice,
        wholesaleMinQuantity,
        piecesPerBox,
        quantity: liveQty,
      })
    : false;

  const unitPrice = unitPriceForQuantity({
    price,
    wholesalePrice,
    wholesaleMinQuantity,
    piecesPerBox,
    quantity: liveQty,
  });
  const lineTotal = unitPrice * liveQty;
  const boxQty =
    typeof piecesPerBox === "number" &&
    Number.isFinite(piecesPerBox) &&
    piecesPerBox > 0
      ? Math.trunc(piecesPerBox)
      : null;
  const wholesaleLabel =
    hasWholesale && threshold !== null
      ? boxQty !== null && threshold === boxQty
        ? `Опт від ${threshold} шт. (1 ящик)`
        : `Опт від ${threshold} шт.`
      : null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    const product = toCartProduct({
      id,
      title,
      slug,
      price,
      wholesalePrice,
      wholesaleMinQuantity,
      piecesPerBox,
      countInStock,
      category,
      image,
      imageUrl,
    });
    if (!product) return;
    addItem(product, liveQty);
  };

  return (
    <div className={styles.block}>
      <div className={styles.prices}>
        <div className={styles.priceGroup}>
          <span className={styles.priceLabel}>Роздріб / шт.</span>
          <span
            className={`${styles.priceValue} ${wholesaleOn ? styles.priceValueMuted : ""}`}
          >
            {Number.isFinite(price) && price > 0
              ? formatUah(price)
              : "Ціну уточнюйте"}
          </span>
        </div>
        {hasWholesale && wholesalePrice !== undefined && (
          <div className={styles.priceGroup}>
            <span className={styles.priceLabel}>{wholesaleLabel}</span>
            <span
              className={`${styles.priceValue} ${wholesaleOn ? styles.priceValueWholesale : ""}`}
            >
              {formatUah(wholesalePrice)}
            </span>
            {threshold !== null &&
              (wholesaleOn ? (
                <span
                  className={`${styles.priceHint} ${styles.wholesaleActive}`}
                >
                  Оптова ціна застосована
                </span>
              ) : (
                <span className={styles.priceHint}>
                  Додайте ще {remainingToWholesale(liveQty, threshold)} шт.
                </span>
              ))}
          </div>
        )}
      </div>

      {max !== null ? (
        max > 0 ? (
          <p className={styles.stock}>В наявності: {max} шт.</p>
        ) : (
          <p className={`${styles.stock} ${styles.stockOut}`}>
            Немає в наявності
          </p>
        )
      ) : (
        <p className={styles.stock}>В наявності</p>
      )}

      <div className={styles.qtyRow}>
        <span className={styles.qtyLabel}>Кількість</span>
        <QtyStepper
          id={`pdp-${id}`}
          quantity={liveQty}
          max={max}
          piecesPerBox={piecesPerBox}
          onChange={(qty) => setQuantity(Math.max(1, qty))}
          disabled={isOutOfStock}
          live
        />
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Разом</span>
        <span
          className={`${styles.totalValue} ${wholesaleOn ? styles.totalValueWholesale : ""}`}
          aria-live="polite"
        >
          {formatUah(lineTotal)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={styles.submit}
      >
        {isOutOfStock ? "Немає в наявності" : "Додати в кошик"}
      </button>
    </div>
  );
}
