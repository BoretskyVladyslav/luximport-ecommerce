"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeletons";
import { SafeFillImage } from "@/components/ui/product-image-fallback";
import { hasSanityImageAsset } from "@/lib/product-image";
import type { SanityImageField } from "@/lib/sanity-queries";
import {
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
  catalogSearchHref,
  normalizeSearchQuery,
} from "@/lib/search";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";
import styles from "./header-search.module.scss";

const DEBOUNCE_MS = 300;

type SearchHit = {
  _id: string;
  title: string | null;
  brand: string | null;
  slug: string | null;
  price: number;
  image: SanityImageField;
  categoryTitle: string | null;
};

function formatPrice(price: number): string {
  return Number.isFinite(price) ? `${price} ₴` : "—";
}

function isDesktopViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export function HeaderSearch({
  triggerClassName,
  autoOpen = false,
}: {
  triggerClassName: string;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const closeCart = useCartStore((state) => state.closeCart);
  const closeWishlist = useWishlistStore((state) => state.closeWishlist);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const barInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(autoOpen);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [fetchError, setFetchError] = useState(false);

  const resetQuery = useCallback(() => {
    setQuery("");
    setDebounced("");
    setHits([]);
    setTotal(0);
    setLoading(false);
    setFetchError(false);
  }, []);

  const dismiss = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
    setLoading(false);
  }, []);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
    resetQuery();
  }, [resetQuery]);

  const openPanel = useCallback(() => {
    closeCart();
    closeWishlist();
    setOpen(true);
  }, [closeCart, closeWishlist]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const normalized = normalizeSearchQuery(debounced);
    if (normalized.length < SEARCH_MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setHits([]);
      setTotal(0);
      setLoading(false);
      setFetchError(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setFetchError(false);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debounced.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("search failed");
        const data: unknown = await res.json();
        if (
          !data ||
          typeof data !== "object" ||
          !Array.isArray((data as { products?: unknown }).products)
        ) {
          throw new Error("invalid payload");
        }
        const products = (data as { products: SearchHit[]; total?: number })
          .products;
        const nextTotal =
          typeof (data as { total?: unknown }).total === "number"
            ? (data as { total: number }).total
            : products.length;
        if (controller.signal.aborted) return;
        setHits(products);
        setTotal(nextTotal);
        setFetchError(false);
      } catch {
        if (controller.signal.aborted) return;
        setHits([]);
        setTotal(0);
        setFetchError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [debounced, open]);

  useEffect(() => {
    if (!open) return;
    if (isDesktopViewport()) return;
    overlayInputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      dismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        barInputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  const goToCatalog = () => {
    if (normalizeSearchQuery(query).length < SEARCH_MIN_QUERY_LENGTH) return;
    const href = catalogSearchHref(query);
    close();
    router.push(href);
  };

  const onClear = () => {
    resetQuery();
    if (isDesktopViewport()) barInputRef.current?.focus();
    else overlayInputRef.current?.focus();
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (!open) openPanel();
  };

  const normalized = normalizeSearchQuery(query);
  const normalizedDebounced = normalizeSearchQuery(debounced);
  const canSearch = normalized.length >= SEARCH_MIN_QUERY_LENGTH;
  const pending = canSearch && (loading || normalized !== normalizedDebounced);
  const showHits = canSearch && !pending && !fetchError && hits.length > 0;
  const showEmpty = canSearch && !pending && !fetchError && hits.length === 0;
  const showError = canSearch && !pending && fetchError;

  const results = (
    <>
      {pending && (
        <div className={styles.list} aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton className="h-12 w-12 rounded-none" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-3/4 rounded-sm" />
                <Skeleton className="h-2.5 w-1/3 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showEmpty && <p className={styles.status}>Нічого не знайдено</p>}
      {showError && (
        <p className={`${styles.status} ${styles.statusError}`} role="alert">
          Не вдалося виконати пошук
        </p>
      )}

      {showHits && (
        <>
          <ul className={styles.list}>
            {hits.map((hit) => {
              const href = hit.slug
                ? `/products/${hit.slug}`
                : catalogSearchHref(query);
              const subtitle = hit.brand || hit.categoryTitle || "";
              return (
                <li key={hit._id}>
                  <Link href={href} className={styles.row} onClick={close}>
                    <div className={styles.thumb}>
                      <SafeFillImage
                        source={
                          hasSanityImageAsset(hit.image) ? hit.image : null
                        }
                        alt={hit.title?.trim() || "Товар"}
                        sizes="48px"
                        className={styles.thumbImage}
                        variant="thumb"
                      />
                    </div>
                    <span className={styles.meta}>
                      <span className={styles.title}>{hit.title ?? ""}</span>
                      {subtitle ? (
                        <span className={styles.subtitle}>{subtitle}</span>
                      ) : null}
                    </span>
                    <span className={styles.price}>
                      {formatPrice(hit.price)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={catalogSearchHref(query)}
            className={styles.footer}
            onClick={close}
          >
            Усі результати ({total})
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={cn(triggerClassName, styles.trigger)}
        aria-label="Пошук"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) {
            dismiss();
            return;
          }
          openPanel();
        }}
      >
        <Search size={20} />
      </button>

      <div className={styles.bar}>
        <Search size={16} className={styles.barIcon} aria-hidden />
        <input
          ref={barInputRef}
          className={styles.barInput}
          type="text"
          value={query}
          placeholder="Пошук товарів..."
          autoComplete="off"
          maxLength={SEARCH_MAX_QUERY_LENGTH}
          aria-label="Пошук товарів"
          onFocus={openPanel}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goToCatalog();
            }
          }}
        />
        {query.length > 0 && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Очистити"
            onClick={onClear}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open ? (
        <div
          id={panelId}
          className={cn(styles.panel, !canSearch && styles.panelIdle)}
          role="search"
        >
          <div className={styles.overlayField}>
            <input
              ref={overlayInputRef}
              className={styles.input}
              type="text"
              value={query}
              placeholder="Пошук товарів..."
              autoComplete="off"
              maxLength={SEARCH_MAX_QUERY_LENGTH}
              aria-label="Пошук товарів"
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goToCatalog();
                }
              }}
            />
            {query.length > 0 && (
              <button
                type="button"
                className={styles.clear}
                aria-label="Очистити"
                onClick={onClear}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {results}
        </div>
      ) : null}
    </div>
  );
}
