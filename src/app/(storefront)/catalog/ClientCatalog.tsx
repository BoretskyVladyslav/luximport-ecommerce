"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ui/product-card";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import {
  type CatalogCategory,
  childrenOf,
  collectAncestorIds,
  collectDescendantIds,
  findCatalogNodeBySlug,
  listRootCategories,
  productMatchesCategoryIds,
} from "@/lib/catalog-tree";
import type { CatalogProduct } from "@/lib/sanity-queries";
import {
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  productMatchesQuery,
} from "@/lib/search";
import styles from "./page.module.scss";

const SORT_KEYS = ["default", "price-asc", "price-desc", "name-asc"] as const;
type CatalogSortKey = (typeof SORT_KEYS)[number];

function parseSortKey(value: string | null): CatalogSortKey {
  if (value && SORT_KEYS.includes(value as CatalogSortKey)) {
    return value as CatalogSortKey;
  }
  return "default";
}

function buildCatalogHref(opts: {
  category?: string | null;
  search?: string;
  sort?: string;
}): string {
  const params = new URLSearchParams();
  const search = opts.search?.trim().slice(0, SEARCH_MAX_QUERY_LENGTH) ?? "";
  if (opts.category) params.set("category", opts.category);
  if (search) params.set("search", search);
  if (opts.sort && opts.sort !== "default") params.set("sort", opts.sort);
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

function CategoryTree({
  roots,
  categories,
  subcategories,
  activeId,
  inPathIds,
  expandedIds,
  counts,
  onSelect,
  onToggle,
}: {
  roots: CatalogCategory[];
  categories: CatalogCategory[];
  subcategories: CatalogCategory[];
  activeId: string | null;
  inPathIds: Set<string>;
  expandedIds: string[];
  counts: Map<string, number>;
  onSelect: (node: CatalogCategory | null) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <nav className={styles.tree} aria-label="Категорії">
      <button
        type="button"
        className={`${styles.nodeRow} ${styles.nodeRoot} ${!activeId ? styles.nodeActive : ""}`}
        onClick={() => onSelect(null)}
        aria-current={!activeId ? "page" : undefined}
      >
        <span className={styles.nodeLabel}>Всі товари</span>
      </button>
      {roots.map((node) => (
        <CategoryNode
          key={node._id}
          node={node}
          depth={0}
          categories={categories}
          subcategories={subcategories}
          activeId={activeId}
          inPathIds={inPathIds}
          expandedIds={expandedIds}
          counts={counts}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </nav>
  );
}

function CategoryNode({
  node,
  depth,
  categories,
  subcategories,
  activeId,
  inPathIds,
  expandedIds,
  counts,
  onSelect,
  onToggle,
}: {
  node: CatalogCategory;
  depth: number;
  categories: CatalogCategory[];
  subcategories: CatalogCategory[];
  activeId: string | null;
  inPathIds: Set<string>;
  expandedIds: string[];
  counts: Map<string, number>;
  onSelect: (node: CatalogCategory | null) => void;
  onToggle: (id: string) => void;
}) {
  const kids = childrenOf(node._id, categories, subcategories);
  const isExpanded = expandedIds.includes(node._id);
  const isActive = activeId === node._id;
  const inPath = inPathIds.has(node._id);
  const count = counts.get(node._id);
  const countLabel =
    typeof count === "number" ? count.toLocaleString("uk-UA") : null;

  return (
    <div
      className={styles.nodeGroup}
      style={{ "--depth": depth } as CSSProperties}
    >
      <div
        className={`${styles.nodeRow} ${depth === 0 ? styles.nodeRoot : styles.nodeChild} ${isActive ? styles.nodeActive : ""} ${inPath && !isActive ? styles.nodeInPath : ""}`}
      >
        <button
          type="button"
          className={styles.nodeButton}
          onClick={() => onSelect(node)}
          aria-current={isActive ? "page" : undefined}
        >
          <span className={styles.nodeLabel}>{node.title}</span>
          {countLabel !== null ? (
            <span className={styles.nodeCount}>{countLabel}</span>
          ) : null}
        </button>
        {kids.length > 0 ? (
          <button
            type="button"
            className={`${styles.toggleBtn} ${isExpanded ? styles.toggleBtnOpen : ""}`}
            onClick={() => onToggle(node._id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Згорнути" : "Розгорнути"}
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        ) : null}
      </div>
      {isExpanded && kids.length > 0 ? (
        <div className={styles.nodeChildren}>
          {kids.map((child) => (
            <CategoryNode
              key={child._id}
              node={child}
              depth={depth + 1}
              categories={categories}
              subcategories={subcategories}
              activeId={activeId}
              inPathIds={inPathIds}
              expandedIds={expandedIds}
              counts={counts}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ClientCatalog({
  products,
  categories,
  subcategories,
}: {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  subcategories: CatalogCategory[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const urlCategory = searchParams.get("category")?.trim() ?? "";
  const urlSort = parseSortKey(searchParams.get("sort"));
  const searchLabel = (searchParams.get("search") ?? "")
    .trim()
    .slice(0, SEARCH_MAX_QUERY_LENGTH);
  const searchQuery = normalizeSearchQuery(searchLabel);
  const [categorySlug, setCategorySlug] = useState(urlCategory);
  const [catalogSortKey, setCatalogSortKey] = useState(urlSort);
  const categorySlugRef = useRef(categorySlug);
  const sortKeyRef = useRef(catalogSortKey);

  useEffect(() => {
    setCategorySlug(urlCategory);
    setCatalogSortKey(urlSort);
  }, [urlCategory, urlSort]);

  useEffect(() => {
    categorySlugRef.current = categorySlug;
  }, [categorySlug]);

  useEffect(() => {
    sortKeyRef.current = catalogSortKey;
  }, [catalogSortKey]);

  const roots = useMemo(
    () => listRootCategories(categories, subcategories),
    [categories, subcategories],
  );

  const activeNode = useMemo(
    () =>
      categorySlug
        ? findCatalogNodeBySlug(categorySlug, categories, subcategories)
        : undefined,
    [categorySlug, categories, subcategories],
  );
  const activeCategoryId = activeNode?._id ?? null;
  const inPathIds = useMemo(
    () =>
      activeCategoryId
        ? new Set(
            collectAncestorIds(activeCategoryId, categories, subcategories),
          )
        : new Set<string>(),
    [activeCategoryId, categories, subcategories],
  );

  const descendantSet = useMemo(() => {
    if (!activeCategoryId) return null;
    return new Set(
      collectDescendantIds(activeCategoryId, categories, subcategories),
    );
  }, [activeCategoryId, categories, subcategories]);

  const searchFiltered = useMemo(() => {
    if (searchQuery.length < SEARCH_MIN_QUERY_LENGTH) return products;
    return products.filter((p) => productMatchesQuery(p, searchQuery));
  }, [products, searchQuery]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    const nodes = [...categories, ...subcategories];
    for (const node of nodes) {
      const idSet = new Set(
        collectDescendantIds(node._id, categories, subcategories),
      );
      let n = 0;
      for (const p of searchFiltered) {
        if (productMatchesCategoryIds(p.categories, idSet)) n += 1;
      }
      map.set(node._id, n);
    }
    return map;
  }, [categories, subcategories, searchFiltered]);

  const filteredData = useMemo(() => {
    let data = searchFiltered;

    if (descendantSet) {
      data = data.filter((p) =>
        productMatchesCategoryIds(p.categories, descendantSet),
      );
    }

    if (catalogSortKey === "price-asc") {
      data = [...data].sort((a, b) => {
        const pa =
          typeof a.price === "number" && Number.isFinite(a.price)
            ? a.price
            : Number.POSITIVE_INFINITY;
        const pb =
          typeof b.price === "number" && Number.isFinite(b.price)
            ? b.price
            : Number.POSITIVE_INFINITY;
        return pa - pb;
      });
    } else if (catalogSortKey === "price-desc") {
      data = [...data].sort((a, b) => {
        const pa =
          typeof a.price === "number" && Number.isFinite(a.price)
            ? a.price
            : Number.NEGATIVE_INFINITY;
        const pb =
          typeof b.price === "number" && Number.isFinite(b.price)
            ? b.price
            : Number.NEGATIVE_INFINITY;
        return pb - pa;
      });
    } else if (catalogSortKey === "name-asc") {
      data = [...data].sort((a, b) =>
        String(a.title ?? "").localeCompare(String(b.title ?? ""), "uk"),
      );
    }

    return data;
  }, [catalogSortKey, descendantSet, searchFiltered]);

  const visibleData = filteredData.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, activeCategoryId, catalogSortKey]);

  useEffect(() => {
    if (!activeCategoryId) return;
    const ancestors = collectAncestorIds(
      activeCategoryId,
      categories,
      subcategories,
    );
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(activeCategoryId);
      for (const id of ancestors) next.add(id);
      return Array.from(next);
    });
  }, [activeCategoryId, categories, subcategories]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const replaceQuery = useCallback(
    (patch: { category?: string | null; sort?: CatalogSortKey }) => {
      const nextCategory =
        "category" in patch ? (patch.category ?? "") : categorySlugRef.current;
      const nextSort =
        "sort" in patch ? (patch.sort ?? "default") : sortKeyRef.current;
      const href = buildCatalogHref({
        category: nextCategory || null,
        search: searchLabel,
        sort: nextSort,
      });
      router.replace(href, { scroll: false });
      categorySlugRef.current = nextCategory;
      sortKeyRef.current = nextSort;
      if ("category" in patch) setCategorySlug(nextCategory);
      if ("sort" in patch) setCatalogSortKey(nextSort);
    },
    [searchLabel, router],
  );

  const selectCategory = useCallback(
    (node: CatalogCategory | null) => {
      replaceQuery({ category: node?.slug || node?._id || null });
      setVisibleCount(20);
      if (node) {
        setExpandedIds((prev) =>
          prev.includes(node._id) ? prev : [...prev, node._id],
        );
      }
      setFiltersOpen(false);
    },
    [replaceQuery],
  );

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const treeProps = {
    roots,
    categories,
    subcategories,
    activeId: activeCategoryId,
    inPathIds,
    expandedIds,
    counts,
    onSelect: selectCategory,
    onToggle: toggleNode,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>КАТАЛОГ</h1>
        <span className={styles.meta}>PREMIUM SELECTION</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.countInfo}>
          Всього товарів: <strong>{filteredData.length}</strong>
          {searchLabel ? (
            <Link
              href={buildCatalogHref({
                category: categorySlug || null,
                sort: catalogSortKey,
              })}
              className={styles.searchChip}
            >
              Пошук: {searchLabel}
              <X size={12} aria-hidden />
              <span className="sr-only">Очистити пошук</span>
            </Link>
          ) : null}
        </div>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.filterTrigger}
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-label="Фільтри категорій"
          >
            <SlidersHorizontal size={14} aria-hidden />
            <span>{activeNode?.title ?? "Категорії"}</span>
          </button>
          <div className={styles.sortWrapper}>
            <span className={styles.sortLabel}>СОРТУВАННЯ:</span>
            <select
              className={styles.sortSelect}
              value={catalogSortKey}
              onChange={(e) =>
                replaceQuery({ sort: parseSortKey(e.target.value) })
              }
            >
              <option value="default">За замовчуванням</option>
              <option value="price-asc">Від дешевих до дорогих</option>
              <option value="price-desc">Від дорогих до дешевих</option>
              <option value="name-asc">За назвою (А-Я)</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarHeading}>Категорії</p>
          <CategoryTree {...treeProps} />
        </aside>

        <div className={styles.catalogContent}>
          {filteredData.length === 0 ? (
            <p className={styles.empty}>Нічого не знайдено</p>
          ) : (
            <>
              <h2 className="sr-only">Товари</h2>
              <div
                className={`${styles.grid} grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4`}
              >
                {visibleData.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    id={product._id}
                    index={index}
                    title={product.title ?? ""}
                    slug={product.slug ?? undefined}
                    price={
                      typeof product.price === "number" &&
                      Number.isFinite(product.price)
                        ? `${product.price} ₴`
                        : "—"
                    }
                    wholesalePrice={product.wholesalePrice}
                    wholesaleMinQuantity={product.wholesaleMinQuantity}
                    piecesPerBox={product.piecesPerBox}
                    weight={product.weight}
                    category={product.categories?.[0]?.title ?? "Без категорії"}
                    stock={product.stock ?? undefined}
                    image={product.image}
                  />
                ))}
              </div>

              {visibleCount < filteredData.length && (
                <div className={styles.loadMoreContainer}>
                  <button
                    className={`${styles.loadMoreButton} max-w-full px-5 py-3 text-xs sm:text-sm`}
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + 20, filteredData.length),
                      )
                    }
                  >
                    ПОКАЗАТИ БІЛЬШЕ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {filtersOpen ? (
        <div className={styles.drawerRoot}>
          <button
            type="button"
            className={styles.drawerOverlay}
            aria-label="Закрити фільтри"
            onClick={() => setFiltersOpen(false)}
          />
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Категорії"
          >
            <div className={styles.drawerHeader}>
              <p className={styles.sidebarHeading}>Категорії</p>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setFiltersOpen(false)}
                aria-label="Закрити"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <CategoryTree {...treeProps} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
