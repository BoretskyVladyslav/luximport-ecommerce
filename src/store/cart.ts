import { useLayoutEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types";
import { toCents, fromCents } from "@/lib/money";
import { unitPriceForQuantity } from "@/lib/cart/pricing";
import { isHttpUrl, resolveCartImageUrl } from "@/lib/cart/product-to-cart";
import { safeJsonStorage } from "@/store/persistStorage";

function positiveQty(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v > 0
    ? Math.trunc(v)
    : undefined;
}

function wholesalePriceOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;
}

function pricingFromItem(item: {
  price?: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  piecesPerBox?: number | null;
  quantity?: number;
}) {
  const quantity =
    typeof item.quantity === "number" && Number.isFinite(item.quantity)
      ? Math.max(1, Math.trunc(item.quantity))
      : 1;
  return {
    price:
      typeof item.price === "number" && Number.isFinite(item.price)
        ? item.price
        : 0,
    wholesalePrice: item.wholesalePrice ?? null,
    wholesaleMinQuantity: item.wholesaleMinQuantity ?? null,
    piecesPerBox: item.piecesPerBox ?? null,
    quantity,
  };
}

function pricingFieldsFromProduct(product: Product) {
  return {
    price:
      typeof product.price === "number" && Number.isFinite(product.price)
        ? product.price
        : 0,
    wholesalePrice: wholesalePriceOrUndef(product.wholesalePrice),
    wholesaleMinQuantity: positiveQty(product.wholesaleMinQuantity),
    piecesPerBox: positiveQty(product.piecesPerBox),
  };
}

let validateGeneration = 0;

export function cartItemsKey(items: CartItem[]): string {
  return items
    .filter((i) => i && typeof i.id === "string" && i.id.trim())
    .map(
      (i) =>
        `${i.id}:${typeof i.quantity === "number" && Number.isFinite(i.quantity) ? Math.max(1, Math.trunc(i.quantity)) : 1}`,
    )
    .sort()
    .join("|");
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

type CartIssue = { code: string; message: string };

function liveItemIds(items: CartItem[]): Set<string> {
  return new Set(
    items
      .filter((i) => i && typeof i.id === "string" && i.id.trim())
      .map((i) => i.id),
  );
}

function scopeIssues(
  issues: Record<string, CartIssue>,
  items: CartItem[],
): Record<string, CartIssue> {
  const ids = liveItemIds(items);
  const next: Record<string, CartIssue> = {};
  for (const [id, issue] of Object.entries(issues)) {
    if (ids.has(id)) next[id] = issue;
  }
  return next;
}

function validationUnavailableIssues(
  items: CartItem[],
): Record<string, CartIssue> {
  const issues: Record<string, CartIssue> = {};
  Array.from(liveItemIds(items)).forEach((id) => {
    issues[id] = {
      code: "VALIDATION_UNAVAILABLE",
      message: "Не вдалося перевірити кошик. Спробуйте ще раз.",
    };
  });
  return issues;
}

function payloadHasUsableBody(payload: Record<string, unknown>): boolean {
  return (
    (Array.isArray(payload.issues) && payload.issues.length > 0) ||
    (Array.isArray(payload.lines) && payload.lines.length > 0)
  );
}

function sanitizeCartImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  for (const img of images) {
    const url = isHttpUrl(img) ? img.trim() : resolveCartImageUrl(img);
    if (url && isHttpUrl(url)) out.push(url);
  }
  return out;
}

export type ValidateCartOptions = { force?: boolean };

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  cartIssues: Record<string, { code: string; message: string }>;
  stockWarning: string | null;
  isValidating: boolean;
  lastValidatedKey: string | null;
  validateCart: (opts?: ValidateCartOptions) => Promise<void>;
  hasBlockingIssues: () => boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartIssues: {},
      stockWarning: null,
      isValidating: false,
      lastValidatedKey: null,
      validateCart: async (opts) => {
        const force = Boolean(opts?.force);
        const maxAttempts = force ? 4 : 1;
        for (let _attempt = 0; _attempt < maxAttempts; _attempt++) {
          const snapshot = get().items;
          if (snapshot.length === 0) {
            validateGeneration += 1;
            set({
              cartIssues: {},
              stockWarning: null,
              lastValidatedKey: null,
              isValidating: false,
            });
            return;
          }

          const key = cartItemsKey(snapshot);
          if (
            !force &&
            key &&
            get().lastValidatedKey === key &&
            !get().isValidating
          )
            return;

          const gen = ++validateGeneration;
          set({ isValidating: true });

          try {
            const payloadItems = snapshot
              .filter(
                (i) =>
                  i &&
                  typeof i.id === "string" &&
                  i.id.trim() &&
                  typeof i.quantity === "number" &&
                  i.quantity > 0,
              )
              .map((i) => {
                const quantity = Math.max(1, Math.trunc(i.quantity));
                const clientUnitPrice = unitPriceForQuantity(
                  pricingFromItem({ ...i, quantity }),
                );
                const wholesalePrice = wholesalePriceOrUndef(i.wholesalePrice);
                const wholesaleMinQuantity = positiveQty(
                  i.wholesaleMinQuantity,
                );
                const piecesPerBox = positiveQty(i.piecesPerBox);
                return {
                  productId: i.id.trim(),
                  quantity,
                  clientUnitPrice,
                  ...(wholesalePrice !== undefined
                    ? { clientWholesalePrice: wholesalePrice }
                    : {}),
                  ...(wholesaleMinQuantity !== undefined
                    ? { clientWholesaleMinQuantity: wholesaleMinQuantity }
                    : {}),
                  ...(piecesPerBox !== undefined
                    ? { clientPiecesPerBox: piecesPerBox }
                    : {}),
                };
              });
            const sentUnitById = new Map(
              payloadItems.map((p) => [p.productId, p.clientUnitPrice]),
            );

            const res = await fetch("/api/cart/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: payloadItems }),
            });

            const data: unknown = await res.json().catch(() => null);
            if (gen !== validateGeneration) {
              if (force) continue;
              return;
            }

            const payload = asRecord(data);
            if (!payload || (!res.ok && !payloadHasUsableBody(payload))) {
              set({
                cartIssues: validationUnavailableIssues(get().items),
                isValidating: false,
                lastValidatedKey: null,
              });
              return;
            }

            const issues: Record<string, CartIssue> = {};
            const availableById = new Map<string, number>();
            const rawIssues = payload.issues;
            if (Array.isArray(rawIssues)) {
              for (const raw of rawIssues) {
                const issue = asRecord(raw);
                if (!issue) continue;
                const productId = issue.productId;
                const code = issue.code;
                if (typeof productId !== "string" || !productId) continue;
                if (typeof code !== "string" || !code) continue;
                if (code === "NOT_FOUND")
                  issues[productId] = {
                    code,
                    message: "Товар більше не доступний для замовлення",
                  };
                else if (code === "OUT_OF_STOCK")
                  issues[productId] = {
                    code,
                    message: "На жаль, цей товар закінчився",
                  };
                else if (code === "INSUFFICIENT_STOCK") {
                  issues[productId] = {
                    code,
                    message: "Недостатньо товару на складі",
                  };
                  if (
                    typeof issue.available === "number" &&
                    Number.isFinite(issue.available)
                  ) {
                    availableById.set(
                      productId,
                      Math.max(0, Math.trunc(issue.available)),
                    );
                  }
                } else if (code === "PRICE_CHANGED")
                  issues[productId] = {
                    code,
                    message: "Ціна оновилась, перевірте кошик",
                  };
              }
            }

            const byId = new Map<
              string,
              {
                stock: number | null;
                price?: number;
                wholesalePrice?: number;
                wholesaleMinQuantity?: number;
                piecesPerBox?: number;
                unitPriceCents?: number;
              }
            >();
            const rawLines = payload?.lines;
            if (Array.isArray(rawLines)) {
              for (const raw of rawLines) {
                const line = asRecord(raw);
                if (!line) continue;
                const pid = line.productId;
                if (typeof pid !== "string" || !pid) continue;
                const stock = line.stock;
                const normalizedStock =
                  typeof stock === "number" && Number.isFinite(stock)
                    ? Math.max(0, Math.trunc(stock))
                    : (availableById.get(pid) ?? null);
                byId.set(pid, {
                  stock: normalizedStock,
                  price:
                    typeof line.price === "number" &&
                    Number.isFinite(line.price)
                      ? line.price
                      : undefined,
                  wholesalePrice: wholesalePriceOrUndef(line.wholesalePrice),
                  wholesaleMinQuantity: positiveQty(line.wholesaleMinQuantity),
                  piecesPerBox: positiveQty(line.piecesPerBox),
                  unitPriceCents:
                    typeof line.unitPriceCents === "number" &&
                    Number.isFinite(line.unitPriceCents)
                      ? line.unitPriceCents
                      : undefined,
                });
              }
            }

            for (const [id, available] of Array.from(availableById.entries())) {
              const existing = byId.get(id);
              if (existing) {
                if (existing.stock === null) {
                  byId.set(id, { ...existing, stock: available });
                }
                continue;
              }
              byId.set(id, { stock: available });
            }

            for (const [id, issue] of Object.entries(issues)) {
              if (issue.code !== "PRICE_CHANGED") continue;
              const line = byId.get(id);
              const sent = sentUnitById.get(id);
              if (
                line &&
                typeof sent === "number" &&
                typeof line.unitPriceCents === "number" &&
                toCents(sent) === line.unitPriceCents
              ) {
                delete issues[id];
              }
            }

            const current = get().items;
            let nextItems = current.map((item) => {
              const s = byId.get(item.id);
              if (!s) return item;
              const nextStock =
                typeof s.stock === "number"
                  ? s.stock
                  : (availableById.get(item.id) ??
                    (typeof item.countInStock === "number"
                      ? item.countInStock
                      : undefined));
              return {
                ...item,
                countInStock:
                  typeof nextStock === "number" ? nextStock : item.countInStock,
                price: typeof s.price === "number" ? s.price : item.price,
                wholesalePrice:
                  s.wholesalePrice !== undefined
                    ? s.wholesalePrice
                    : item.wholesalePrice,
                wholesaleMinQuantity:
                  s.wholesaleMinQuantity !== undefined
                    ? s.wholesaleMinQuantity
                    : item.wholesaleMinQuantity,
                piecesPerBox:
                  s.piecesPerBox !== undefined
                    ? s.piecesPerBox
                    : item.piecesPerBox,
              };
            });

            const removeIds = new Set(
              Object.entries(issues)
                .filter(([, v]) => v.code === "OUT_OF_STOCK")
                .map(([id]) => id),
            );
            for (const item of nextItems) {
              if (
                typeof item.countInStock === "number" &&
                Number.isFinite(item.countInStock) &&
                Math.max(0, Math.trunc(item.countInStock)) <= 0
              ) {
                removeIds.add(item.id);
              }
            }
            const removedOutOfStock = nextItems.some((i) =>
              removeIds.has(i.id),
            );
            if (removeIds.size > 0) {
              nextItems = nextItems.filter((i) => !removeIds.has(i.id));
            }

            const adjustedItems = nextItems.map((i) => {
              if (typeof i.countInStock === "number") {
                const max = Math.max(0, Math.trunc(i.countInStock));
                if (max < 1) return i;
                if (i.quantity > max) return { ...i, quantity: max };
              }
              return i;
            });

            for (const [id, issue] of Object.entries(issues)) {
              if (issue.code !== "INSUFFICIENT_STOCK") continue;
              const line = adjustedItems.find((i) => i.id === id);
              if (!line) continue;
              const max =
                typeof line.countInStock === "number"
                  ? Math.max(0, Math.trunc(line.countInStock))
                  : availableById.get(id);
              if (typeof max === "number" && line.quantity <= max) {
                delete issues[id];
              }
            }

            if (gen !== validateGeneration) {
              if (force) continue;
              return;
            }

            const currentKey = cartItemsKey(get().items);
            if (currentKey !== key) {
              set({ isValidating: false, lastValidatedKey: null });
              if (force) continue;
              void get().validateCart();
              return;
            }

            const scopedIssues = scopeIssues(issues, adjustedItems);

            set({
              items: adjustedItems,
              cartIssues: scopedIssues,
              stockWarning: removedOutOfStock
                ? "Цей товар щойно закінчився і був видалений з активного замовлення."
                : null,
              isValidating: false,
              lastValidatedKey: cartItemsKey(adjustedItems),
            });

            const latestKey = cartItemsKey(get().items);
            if (latestKey !== get().lastValidatedKey) {
              if (force) continue;
              void get().validateCart();
            }
            return;
          } catch {
            if (gen !== validateGeneration) {
              if (force) continue;
              return;
            }
            set({
              cartIssues: validationUnavailableIssues(get().items),
              isValidating: false,
              lastValidatedKey: null,
            });
            return;
          }
        }
        set({
          cartIssues: validationUnavailableIssues(get().items),
          isValidating: false,
          lastValidatedKey: null,
        });
      },
      hasBlockingIssues: () => {
        const ids = liveItemIds(get().items);
        return Object.entries(get().cartIssues).some(
          ([id, issue]) => ids.has(id) && issue.code !== "PRICE_CHANGED",
        );
      },
      addItem: (product, quantity = 1) => {
        const idFromProduct =
          typeof product.id === "string" ? product.id.trim() : "";
        const rawMeta = product as unknown as { _id?: unknown };
        const idFromMeta =
          typeof rawMeta._id === "string" ? rawMeta._id.trim() : "";
        const id = idFromProduct || idFromMeta;
        if (!id) return;
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === id);
        const addQty = Math.max(
          1,
          Math.trunc(
            typeof quantity === "number" && Number.isFinite(quantity)
              ? quantity
              : 1,
          ),
        );
        const normalizedCountInStock =
          typeof product.countInStock === "number" &&
          Number.isFinite(product.countInStock)
            ? Math.max(0, Math.trunc(product.countInStock))
            : null;
        if (normalizedCountInStock !== null && normalizedCountInStock <= 0)
          return;
        if (existingItem) {
          if (
            normalizedCountInStock !== null &&
            existingItem.quantity >= normalizedCountInStock
          )
            return;
          const nextQty = existingItem.quantity + addQty;
          const capped =
            normalizedCountInStock !== null
              ? Math.min(nextQty, normalizedCountInStock)
              : nextQty;
          if (capped <= existingItem.quantity) return;
          const nextItems = currentItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  id,
                  ...pricingFieldsFromProduct(product),
                  quantity: capped,
                  countInStock:
                    normalizedCountInStock !== null
                      ? normalizedCountInStock
                      : (item.countInStock ?? undefined),
                  images:
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images
                      : item.images,
                }
              : item,
          );
          validateGeneration += 1;
          set({
            items: nextItems,
            isOpen: true,
            lastValidatedKey: null,
            isValidating: false,
            cartIssues: scopeIssues(get().cartIssues, nextItems),
          });
        } else {
          const qty =
            normalizedCountInStock !== null
              ? Math.min(addQty, normalizedCountInStock)
              : addQty;
          if (qty < 1) return;
          const nextItems = [
            ...currentItems,
            {
              ...product,
              id,
              ...pricingFieldsFromProduct(product),
              countInStock: normalizedCountInStock ?? undefined,
              quantity: qty,
            },
          ];
          validateGeneration += 1;
          set({
            items: nextItems,
            isOpen: true,
            lastValidatedKey: null,
            isValidating: false,
            cartIssues: scopeIssues(get().cartIssues, nextItems),
          });
        }
      },
      removeItem: (id) => {
        const nextItems = get().items.filter((item) => item.id !== id);
        if (nextItems.length === get().items.length) return;
        validateGeneration += 1;
        set({
          items: nextItems,
          lastValidatedKey: null,
          isValidating: false,
          cartIssues: scopeIssues(get().cartIssues, nextItems),
        });
      },
      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        const raw =
          typeof quantity === "number" && Number.isFinite(quantity)
            ? Math.trunc(quantity)
            : 0;
        const max =
          typeof item.countInStock === "number" &&
          Number.isFinite(item.countInStock)
            ? Math.max(0, Math.trunc(item.countInStock))
            : null;
        if (raw < 1 || (max !== null && max < 1)) {
          const nextItems = get().items.filter((i) => i.id !== id);
          validateGeneration += 1;
          set({
            items: nextItems,
            lastValidatedKey: null,
            isValidating: false,
            cartIssues: scopeIssues(get().cartIssues, nextItems),
          });
          return;
        }
        const next = max !== null ? Math.min(raw, max) : raw;
        if (next === item.quantity) return;
        const nextItems = get().items.map((row) =>
          row.id === id ? { ...row, quantity: next } : row,
        );
        validateGeneration += 1;
        set({
          items: nextItems,
          lastValidatedKey: null,
          isValidating: false,
          cartIssues: scopeIssues(get().cartIssues, nextItems),
        });
      },
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      clearCart: () => {
        validateGeneration += 1;
        set({
          items: [],
          cartIssues: {},
          stockWarning: null,
          isValidating: false,
          lastValidatedKey: null,
        });
      },
      totalPrice: () => {
        const cents = get().items.reduce((total, item) => {
          const unit = unitPriceForQuantity({
            price:
              typeof item.price === "number" && Number.isFinite(item.price)
                ? item.price
                : 0,
            wholesalePrice: item.wholesalePrice ?? null,
            wholesaleMinQuantity: item.wholesaleMinQuantity ?? null,
            piecesPerBox: item.piecesPerBox ?? null,
            quantity:
              typeof item.quantity === "number" &&
              Number.isFinite(item.quantity)
                ? item.quantity
                : 1,
          });
          const qty =
            typeof item.quantity === "number" && Number.isFinite(item.quantity)
              ? item.quantity
              : 1;
          return total + toCents(unit) * qty;
        }, 0);
        return fromCents(cents);
      },
    }),
    {
      name: "luximport-cart-storage",
      storage: safeJsonStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, isOpen: state.isOpen }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const sanitized = Array.isArray(state.items)
          ? state.items
              .filter(
                (i) =>
                  i &&
                  typeof i === "object" &&
                  typeof (i as { id?: unknown }).id === "string" &&
                  (i as { id: string }).id.trim(),
              )
              .map((raw) => {
                const i = raw as CartItem;
                const price =
                  typeof i.price === "number" && Number.isFinite(i.price)
                    ? i.price
                    : 0;
                const quantity =
                  typeof i.quantity === "number" && Number.isFinite(i.quantity)
                    ? Math.max(1, Math.trunc(i.quantity))
                    : 1;
                const countInStock =
                  typeof i.countInStock === "number" &&
                  Number.isFinite(i.countInStock)
                    ? Math.max(0, Math.trunc(i.countInStock))
                    : undefined;
                const piecesPerBox = positiveQty(i.piecesPerBox);
                const wholesalePrice = wholesalePriceOrUndef(i.wholesalePrice);
                const wholesaleMinQuantity = positiveQty(
                  i.wholesaleMinQuantity,
                );
                return {
                  ...i,
                  price,
                  quantity,
                  countInStock,
                  piecesPerBox,
                  wholesalePrice,
                  wholesaleMinQuantity,
                  images: sanitizeCartImages(i.images),
                };
              })
          : [];
        state.items = sanitized;
        state.isValidating = false;
        state.lastValidatedKey = null;
      },
    },
  ),
);

function getServerCartSnapshot(): CartState {
  return {
    items: [],
    isOpen: false,
    cartIssues: {},
    stockWarning: null,
    isValidating: false,
    lastValidatedKey: null,
    validateCart: async () => {},
    hasBlockingIssues: () => false,
    addItem: () => {},
    removeItem: () => {},
    updateQuantity: () => {},
    openCart: () => {},
    closeCart: () => {},
    toggleCart: () => {},
    clearCart: () => {},
    totalPrice: () => 0,
  };
}

export function useStore<T>(selector: (state: CartState) => T): T {
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    setMounted(true);
  }, []);
  const fromStore = useCartStore(selector);
  return mounted ? fromStore : selector(getServerCartSnapshot());
}
