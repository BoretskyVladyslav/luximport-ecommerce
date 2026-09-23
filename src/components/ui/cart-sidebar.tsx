"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store/cart";
import { useHydration } from "@/hooks/useHydration";
import {
  isWholesaleActive,
  remainingToWholesale,
  wholesaleThreshold,
} from "@/lib/cart/pricing";
import type { CartRecommendationProduct } from "@/lib/sanity-queries";
import { QtyStepper } from "@/components/ui/qty-stepper";
import {
  isHttpUrl,
  resolveCartImageUrl,
  toCartProduct,
} from "@/lib/cart/product-to-cart";
import { SafeFillImage } from "@/components/ui/product-image-fallback";
import styles from "./cart-sidebar.module.scss";

const FREE_SHIPPING_THRESHOLD_UAH = 15000;

function CartLineImage({ src, alt }: { src?: string; alt: string }) {
  return (
    <SafeFillImage
      src={isHttpUrl(src) ? src.trim() : null}
      alt={alt}
      sizes="128px"
      className="object-contain object-center p-1.5"
      variant="thumb"
    />
  );
}

function stockCap(countInStock: unknown): number | null {
  return typeof countInStock === "number" && Number.isFinite(countInStock)
    ? Math.max(0, Math.trunc(countInStock))
    : null;
}

export function CartSidebar() {
  const {
    items,
    isOpen,
    toggleCart,
    removeItem,
    updateQuantity,
    totalPrice,
    addItem,
    validateCart,
    cartIssues,
    hasBlockingIssues,
    stockWarning,
    isValidating,
  } = useStore(
    useShallow((s) => ({
      items: s.items,
      isOpen: s.isOpen,
      toggleCart: s.toggleCart,
      removeItem: s.removeItem,
      updateQuantity: s.updateQuantity,
      totalPrice: s.totalPrice,
      addItem: s.addItem,
      validateCart: s.validateCart,
      cartIssues: s.cartIssues,
      hasBlockingIssues: s.hasBlockingIssues,
      stockWarning: s.stockWarning,
      isValidating: s.isValidating,
    })),
  );
  const isHydrated = useHydration();
  const pathname = usePathname();
  const router = useRouter();
  const prevPathnameRef = useRef<string | null>(null);
  const unavailableRetryRef = useRef({ key: "", count: 0 });
  const [recommendations, setRecommendations] = useState<
    CartRecommendationProduct[]
  >([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);

  const cartValidationKey = useMemo(() => {
    return items
      .filter((i) => i && typeof i.id === "string" && i.id.trim())
      .map(
        (i) =>
          `${i.id}:${typeof i.quantity === "number" && Number.isFinite(i.quantity) ? Math.max(1, Math.trunc(i.quantity)) : 1}`,
      )
      .sort()
      .join("|");
  }, [items]);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (!prev) return;
    if (prev !== pathname && isOpen) toggleCart();
  }, [pathname, isOpen, toggleCart]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isOpen) return;
    if (items.length === 0) return;
    let cancelled = false;
    setValidationLoading(true);
    const t = setTimeout(() => {
      validateCart()
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setValidationLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isHydrated, isOpen, cartValidationKey, items.length, validateCart]);

  useEffect(() => {
    if (!isHydrated || !isOpen || items.length === 0) return;
    const unavailable = Object.values(cartIssues).some(
      (issue) => issue.code === "VALIDATION_UNAVAILABLE",
    );
    if (!unavailable) {
      unavailableRetryRef.current = { key: cartValidationKey, count: 0 };
      return;
    }
    if (unavailableRetryRef.current.key !== cartValidationKey) {
      unavailableRetryRef.current = { key: cartValidationKey, count: 0 };
    }
    if (unavailableRetryRef.current.count >= 3) return;
    const delay = 1000 * 2 ** unavailableRetryRef.current.count;
    const t = setTimeout(() => {
      unavailableRetryRef.current.count += 1;
      void validateCart({ force: true });
    }, delay);
    return () => clearTimeout(t);
  }, [
    isHydrated,
    isOpen,
    cartIssues,
    cartValidationKey,
    items.length,
    validateCart,
  ]);

  const recommendationFetchKey = useMemo(() => {
    const ids = Array.from(new Set(items.map((i) => i.id)))
      .sort()
      .join(",");
    const cats = Array.from(
      new Set(items.map((i) => i.category).filter(Boolean) as string[]),
    )
      .sort()
      .join(",");
    return `${ids}|${cats}`;
  }, [items]);

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setRecommendations([]);
      setRecsLoading(false);
      return;
    }
    const excludeIds = items.map((i) => i.id);
    const categoryTitles = Array.from(
      new Set(items.map((i) => i.category).filter(Boolean) as string[]),
    );

    const ctrl = new AbortController();
    setRecsLoading(true);
    fetch("/api/cart/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludeIds, categoryTitles }),
      signal: ctrl.signal,
    })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((data: { products?: CartRecommendationProduct[] }) => {
        setRecommendations(Array.isArray(data?.products) ? data.products : []);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setRecommendations([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setRecsLoading(false);
      });

    return () => ctrl.abort();
  }, [isOpen, recommendationFetchKey, items]);

  const total = totalPrice();
  const amountToFreeShipping = Math.max(
    0,
    Math.round((FREE_SHIPPING_THRESHOLD_UAH - total) * 100) / 100,
  );
  const progressPercentage = Math.min(
    100,
    (total / FREE_SHIPPING_THRESHOLD_UAH) * 100,
  );

  const handleCheckout = () => {
    toggleCart();
    router.push("/checkout");
  };

  const handleAddRecommendation = (p: CartRecommendationProduct) => {
    const product = toCartProduct({
      _id: p._id,
      title: p.title ?? "",
      slug: p.slug ?? "",
      price: p.price,
      wholesalePrice: p.wholesalePrice,
      wholesaleMinQuantity: p.wholesaleMinQuantity,
      piecesPerBox: p.piecesPerBox,
      stock: p.stock,
      category: p.category ?? "",
      image: p.image,
    });
    if (!product) return;
    addItem(product);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={toggleCart} />}

      <div
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""} flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white`}
        role="dialog"
        aria-modal="true"
        aria-label="Кошик"
        aria-hidden={!isOpen}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-stone-200 px-6 py-5">
          <span className="font-heading text-xl uppercase tracking-tight text-stone-900">
            Кошик
          </span>
          <button
            type="button"
            className="flex text-stone-400 transition-colors hover:text-stone-900"
            onClick={toggleCart}
            aria-label="Закрити кошик"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6">
            <div style={{ display: isHydrated ? "block" : "none" }}>
              {items.length === 0 ? (
                <p className="mt-8 text-center font-body text-sm text-stone-500">
                  Кошик порожній
                </p>
              ) : (
                <>
                  {stockWarning && (
                    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 font-body text-xs text-amber-900">
                      {stockWarning}
                    </div>
                  )}
                  <motion.ul className="space-y-6 pb-2" layout>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {items
                        .filter(
                          (item) =>
                            item &&
                            typeof item.id === "string" &&
                            item.id.trim(),
                        )
                        .map((item) => {
                          const issue = cartIssues[item.id];
                          const threshold = wholesaleThreshold({
                            piecesPerBox: item.piecesPerBox,
                            wholesaleMinQuantity: item.wholesaleMinQuantity,
                          });
                          const isWholesale = isWholesaleActive({
                            price:
                              typeof item.price === "number" &&
                              Number.isFinite(item.price)
                                ? item.price
                                : 0,
                            wholesalePrice: item.wholesalePrice,
                            wholesaleMinQuantity: item.wholesaleMinQuantity,
                            piecesPerBox: item.piecesPerBox,
                            quantity: item.quantity,
                          });
                          const max = stockCap(item.countInStock);
                          return (
                            <motion.li
                              key={item.id}
                              className="flex gap-4 border-b border-stone-100 pb-6 last:border-b-0 last:pb-2"
                              layout
                              initial={{ opacity: 0, y: 6, scale: 0.99 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.99 }}
                              transition={{
                                duration: 0.22,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                            >
                              <div className="relative h-28 w-32 shrink-0 overflow-hidden bg-[#f5f5f4] ring-1 ring-stone-200/80">
                                <CartLineImage
                                  src={item.images?.[0]}
                                  alt={item.title}
                                />
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                                <div>
                                  <p className="font-body text-[15px] font-semibold leading-snug text-stone-900">
                                    {item.title}
                                  </p>
                                  {typeof item.piecesPerBox === "number" &&
                                    item.piecesPerBox > 0 && (
                                      <p className="mt-1 font-body text-[0.7rem] uppercase tracking-wide text-stone-500">
                                        В ящику: {Math.trunc(item.piecesPerBox)}{" "}
                                        шт.
                                      </p>
                                    )}
                                  {issue && (
                                    <p className="mt-1 font-body text-[0.7rem] text-red-600">
                                      {issue.message}
                                    </p>
                                  )}
                                  {isWholesale ? (
                                    <div className="mt-1.5 space-y-0.5">
                                      <span className="block font-body text-xs text-stone-400 line-through lining-nums tabular-nums">
                                        {(
                                          item.price * item.quantity
                                        ).toLocaleString("uk-UA")}{" "}
                                        ₴
                                      </span>
                                      <span className="font-heading text-lg font-bold text-red-600 lining-nums tabular-nums">
                                        {(
                                          item.wholesalePrice! * item.quantity
                                        ).toLocaleString("uk-UA")}{" "}
                                        ₴
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="mt-1.5 font-heading text-lg text-stone-900 lining-nums tabular-nums">
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString("uk-UA")}{" "}
                                      ₴
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <QtyStepper
                                    id={item.id}
                                    quantity={item.quantity}
                                    max={max}
                                    piecesPerBox={item.piecesPerBox}
                                    onChange={(qty) =>
                                      updateQuantity(item.id, qty)
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="font-body text-xs text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    Видалити
                                  </button>
                                </div>
                                {typeof item.wholesalePrice === "number" &&
                                  Number.isFinite(item.wholesalePrice) &&
                                  threshold !== null &&
                                  (isWholesale ? (
                                    <p className="font-body text-[0.65rem] uppercase tracking-wide text-emerald-700/90">
                                      Оптова знижка застосована ✓
                                    </p>
                                  ) : (
                                    <p className="font-body text-[0.65rem] text-stone-500">
                                      Додайте ще{" "}
                                      {remainingToWholesale(
                                        item.quantity,
                                        threshold,
                                      )}{" "}
                                      шт. для оптової ціни
                                    </p>
                                  ))}
                              </div>
                            </motion.li>
                          );
                        })}
                    </AnimatePresence>
                  </motion.ul>

                  {!recsLoading && recommendations.length > 0 && (
                    <div className="mx-[-1.5rem] mt-2 border-t border-[#e5e5e5] bg-[#fafafa] px-6 py-3">
                      <h3 className="mb-2 font-body text-[0.65rem] font-normal uppercase tracking-[0.2em] text-[#888]">
                        Ідеально пасує
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {recommendations.slice(0, 2).map((p) => {
                          const recSrc = resolveCartImageUrl(p.image);
                          return (
                            <div
                              key={p._id}
                              className="flex min-w-0 gap-2 border border-[#e5e5e5] bg-white p-2 transition-colors duration-300 hover:bg-[#fafafa]"
                            >
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-[#f5f5f4]">
                                <SafeFillImage
                                  src={recSrc}
                                  alt={p.title?.trim() || "Товар"}
                                  sizes="40px"
                                  className="object-contain object-center p-1"
                                  variant="thumb"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 font-body text-[0.7rem] font-medium leading-snug text-[#111]">
                                  {p.title}
                                </p>
                                <p className="mt-0.5 font-heading text-xs font-semibold text-[#111] lining-nums tabular-nums">
                                  {p.price.toLocaleString("uk-UA")} ₴
                                </p>
                                <button
                                  type="button"
                                  className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center border border-[#111] bg-transparent text-[#111] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#111] hover:text-white"
                                  onClick={() => handleAddRecommendation(p)}
                                  aria-label={`Додати ${p.title ?? "товар"} у кошик`}
                                >
                                  <Plus
                                    className="h-3.5 w-3.5 stroke-[2.5]"
                                    aria-hidden
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <footer className="sticky bottom-0 z-10 shrink-0 border-t border-stone-200 bg-white px-6 pb-6 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
              {isHydrated && (
                <div className="mb-4">
                  <p className="mb-2 text-center font-body text-[0.65rem] uppercase leading-relaxed tracking-wide text-stone-600">
                    {amountToFreeShipping > 0
                      ? `ЗАЛИШИЛОСЬ ${amountToFreeShipping.toLocaleString("uk-UA")} ₴ ДО БЕЗКОШТОВНОЇ ДОСТАВКИ`
                      : "БЕЗКОШТОВНА ДОСТАВКА АКТИВОВАНА"}
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-stone-900 transition-[width] duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-body text-xs uppercase tracking-[0.2em] text-stone-500">
                  Разом
                </span>
                <span className="font-heading text-2xl text-stone-900 lining-nums tabular-nums">
                  {total.toLocaleString("uk-UA")} ₴
                </span>
              </div>
              <button
                type="button"
                className="w-full bg-stone-900 py-4 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckout}
                disabled={
                  validationLoading || isValidating || hasBlockingIssues()
                }
              >
                {validationLoading ? "Перевірка..." : "Оформити замовлення"}
              </button>
            </footer>
          )}
        </div>
      </div>
    </>
  );
}
