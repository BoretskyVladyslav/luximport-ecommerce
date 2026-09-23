"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useWishlistStore, type WishlistItem } from "@/store/wishlistStore";
import { useStore } from "@/store/cart";
import { useHydration } from "@/hooks/useHydration";
import { isHttpUrl, toCartProduct } from "@/lib/cart/product-to-cart";
import { SafeFillImage } from "@/components/ui/product-image-fallback";
import styles from "./wishlist-sidebar.module.scss";

export function WishlistSidebar() {
  const { items, isOpen, closeWishlist, toggleItem } = useWishlistStore();
  const addItem = useStore((state) => state.addItem);
  const isHydrated = useHydration();
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (!prev) return;
    if (prev !== pathname && isOpen) closeWishlist();
  }, [pathname, isOpen, closeWishlist]);

  const handleAddToCart = (item: WishlistItem) => {
    const product = toCartProduct({
      id: item.id,
      title: item.title,
      price: item.price,
      slug: item.slug ?? "",
      category: item.category,
      images: item.images,
      wholesalePrice: item.wholesalePrice,
      wholesaleMinQuantity: item.wholesaleMinQuantity,
      piecesPerBox: item.piecesPerBox,
      countInStock: item.countInStock,
    });
    if (!product) return;
    addItem(product);
    toggleItem(item);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={closeWishlist} />}

      <div
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Обране"
        aria-hidden={!isOpen}
      >
        <div className={styles.header}>
          <span className={styles.title}>Обране</span>
          <button
            className={styles.closeBtn}
            onClick={closeWishlist}
            aria-label="Закрити обране"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.itemsContainer}>
          <div style={{ display: isHydrated ? "contents" : "none" }}>
            {items.length === 0 ? (
              <p className={styles.emptyState}>Список обраного порожній</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    <SafeFillImage
                      src={
                        item.images &&
                        item.images.length > 0 &&
                        isHttpUrl(item.images[0])
                          ? item.images[0]
                          : null
                      }
                      alt={item.title}
                      sizes="80px"
                      className={styles.itemPhoto}
                      variant="thumb"
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemPrice}>
                      {item.price.toLocaleString("uk-UA")} ₴
                    </span>
                    <div className={styles.controls}>
                      <button
                        className={styles.addToCartBtn}
                        onClick={() => handleAddToCart(item)}
                      >
                        В КОШИК
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => toggleItem(item)}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
