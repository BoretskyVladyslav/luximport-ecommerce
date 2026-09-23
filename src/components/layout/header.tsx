"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  Menu,
  X,
  Heart,
  User,
  LogOut,
  Search,
} from "lucide-react";
import { useStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlistStore";
import { useHydration } from "@/hooks/useHydration";
import { useUser } from "@/hooks/useUser";
import styles from "./header.module.scss";
import { cn } from "@/lib/utils";

const HeaderSearch = dynamic(
  () =>
    import("@/components/search/header-search").then((m) => ({
      default: m.HeaderSearch,
    })),
  { ssr: false },
);

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchReady, setSearchReady] = useState(false);
  const { data: session, status } = useSession();
  const items = useStore((state) => state.items);
  const openCart = useStore((state) => state.openCart);
  const wishlistItems = useWishlistStore((state) => state.items);
  const openWishlist = useWishlistStore((state) => state.openWishlist);
  const isHydrated = useHydration();
  const { destroySession } = useUser();
  const sessionReady = status !== "loading";
  const hasSessionUser = Boolean(session?.user);
  const userIconHref = hasSessionUser ? "/account/profile" : "/account/login";

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const syncScrolled = () => {
      setIsScrolled(window.scrollY > 0);
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) syncScrolled();
    };
    syncScrolled();
    window.addEventListener("scroll", syncScrolled, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("scroll", syncScrolled);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <header
      className={cn(
        styles.header,
        (isScrolled || isMobileMenuOpen) && styles.scrolled,
      )}
    >
      <div className={styles.container}>
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={styles.nav} aria-label="Основна навігація">
          <Link href="/">Головна</Link>
          <Link href="/catalog">Каталог</Link>
          <Link href="/about">Про нас</Link>
          <Link href="/contacts">Контакти</Link>
        </nav>

        <Link href="/" className={styles.logo}>
          LUXIMPORT
        </Link>

        <div className={styles.iconGroup}>
          {searchReady ? (
            <HeaderSearch triggerClassName={styles.cartButton} autoOpen />
          ) : (
            <button
              type="button"
              className={styles.cartButton}
              onClick={() => setSearchReady(true)}
              aria-label="Пошук"
            >
              <Search size={20} />
            </button>
          )}
          <button
            type="button"
            className={styles.cartButton}
            style={{ position: "relative" }}
            onClick={openWishlist}
            aria-label="Обране"
          >
            <Heart size={20} />
            {isHydrated && wishlistCount > 0 && (
              <span className={styles.badge}>{wishlistCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={openCart}
            className={styles.cartButton}
            aria-label="Кошик"
          >
            <ShoppingBag size={20} />
            {isHydrated && itemCount > 0 && (
              <span className={styles.badge}>{itemCount}</span>
            )}
          </button>
          {isHydrated ? (
            !sessionReady ? (
              <Link
                href="/account/login"
                className={styles.cartButton}
                aria-label="Увійти"
              >
                <User size={20} />
              </Link>
            ) : hasSessionUser ? (
              <>
                <Link
                  href={userIconHref}
                  className={styles.cartButton}
                  aria-label="Профіль"
                >
                  <User size={20} />
                </Link>
                <button
                  type="button"
                  className={styles.cartButton}
                  onClick={() => void destroySession()}
                  aria-label="Вийти"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <Link
                href={userIconHref}
                className={styles.cartButton}
                aria-label="Увійти"
              >
                <User size={20} />
              </Link>
            )
          ) : null}
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div
          id="mobile-navigation"
          className={styles.mobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
        >
          <div className={styles.mobileMenuInner}>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              Головна
            </Link>
            <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)}>
              Каталог
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>
              Про нас
            </Link>
            <Link href="/contacts" onClick={() => setIsMobileMenuOpen(false)}>
              Контакти
            </Link>
            {isHydrated && sessionReady && hasSessionUser ? (
              <>
                <Link
                  href={userIconHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Профіль
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    void destroySession();
                  }}
                  className={styles.mobileLogout}
                >
                  Вийти
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
