"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlistStore";

const CartSidebar = dynamic(
  () =>
    import("@/components/ui/cart-sidebar").then((m) => ({
      default: m.CartSidebar,
    })),
  { ssr: false },
);

const WishlistSidebar = dynamic(
  () =>
    import("@/components/ui/wishlist-sidebar").then((m) => ({
      default: m.WishlistSidebar,
    })),
  { ssr: false },
);

export function StorefrontDrawers() {
  const cartOpen = useStore((s) => s.isOpen);
  const wishOpen = useWishlistStore((s) => s.isOpen);
  const [cartReady, setCartReady] = useState(false);
  const [wishReady, setWishReady] = useState(false);

  useEffect(() => {
    if (cartOpen) setCartReady(true);
  }, [cartOpen]);

  useEffect(() => {
    if (wishOpen) setWishReady(true);
  }, [wishOpen]);

  return (
    <>
      {cartReady ? <CartSidebar /> : null}
      {wishReady ? <WishlistSidebar /> : null}
    </>
  );
}
