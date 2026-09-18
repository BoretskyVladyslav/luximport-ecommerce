import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isHttpUrl } from "@/lib/cart/product-to-cart";
import { safeJsonStorage } from "@/store/persistStorage";

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  category: string;
  slug?: string;
  images?: string[];
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  piecesPerBox?: number;
  countInStock?: number | null;
}

interface WishlistState {
  items: WishlistItem[];
  isOpen: boolean;
  toggleItem: (item: WishlistItem) => void;
  openWishlist: () => void;
  closeWishlist: () => void;
}

function asFiniteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function sanitizeWishlistItem(raw: unknown): WishlistItem | null {
  if (!raw || typeof raw !== "object") return null;
  const i = raw as Record<string, unknown>;
  const id = typeof i.id === "string" ? i.id.trim() : "";
  const title = typeof i.title === "string" ? i.title.trim() : "";
  const category = typeof i.category === "string" ? i.category.trim() : "";
  if (!id || !title || !category) return null;
  const price = asFiniteNumber(i.price) ?? 0;
  const slug = typeof i.slug === "string" ? i.slug.trim() : undefined;
  const images = Array.isArray(i.images)
    ? i.images.filter((x): x is string => isHttpUrl(x)).map((x) => x.trim())
    : undefined;
  const wholesalePrice = asFiniteNumber(i.wholesalePrice);
  const wholesaleMinQuantity = asFiniteNumber(i.wholesaleMinQuantity);
  const piecesPerBox = asFiniteNumber(i.piecesPerBox);
  const stockRaw = asFiniteNumber(i.countInStock);
  const countInStock =
    stockRaw !== undefined ? Math.max(0, Math.trunc(stockRaw)) : undefined;
  return {
    id,
    title,
    price,
    category,
    ...(slug ? { slug } : {}),
    ...(images && images.length > 0 ? { images } : {}),
    ...(wholesalePrice !== undefined && wholesalePrice >= 0
      ? { wholesalePrice }
      : {}),
    ...(wholesaleMinQuantity !== undefined && wholesaleMinQuantity > 0
      ? { wholesaleMinQuantity: Math.trunc(wholesaleMinQuantity) }
      : {}),
    ...(piecesPerBox !== undefined && piecesPerBox > 0
      ? { piecesPerBox: Math.trunc(piecesPerBox) }
      : {}),
    ...(countInStock !== undefined ? { countInStock } : {}),
  };
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      toggleItem: (item) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (exists) {
          set({ items: get().items.filter((i) => i.id !== item.id) });
        } else {
          const sanitized = sanitizeWishlistItem(item);
          if (!sanitized) return;
          set({ items: [...get().items, sanitized] });
        }
      },
      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
    }),
    {
      name: "wishlist-storage",
      storage: safeJsonStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const raw = Array.isArray(state.items) ? state.items : [];
        state.items = raw
          .map((i) => sanitizeWishlistItem(i))
          .filter((i): i is WishlistItem => i !== null);
        state.isOpen = false;
      },
    },
  ),
);
