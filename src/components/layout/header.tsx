'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Heart, User } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useHydration } from '@/hooks/useHydration'
import styles from './header.module.scss'
import { cn } from '@/lib/utils'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const toggleCart = useCartStore((state) => state.toggleCart)
  const wishlistItems = useWishlistStore((state) => state.items)
  const openWishlist = useWishlistStore((state) => state.openWishlist)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useHydration()

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const wishlistCount = wishlistItems.length

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(styles.header, (isScrolled || isMobileMenuOpen) && styles.scrolled)}
    >
      <div className={styles.container}>
        <button
          className={styles.mobileToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link href="/" className={styles.logo}>
          LUXIMPORT
        </Link>

        <nav className={styles.nav}>
          <Link href="/catalog">Каталог</Link>
          <Link href="/about">Про нас</Link>
          <Link href="/contacts">Контакти</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className={styles.cartButton} style={{ position: 'relative' }} onClick={openWishlist}>
            <Heart size={20} />
            {isHydrated && wishlistCount > 0 && (
              <span className={styles.badge}>{wishlistCount}</span>
            )}
          </button>
          <button
            onClick={toggleCart}
            className={styles.cartButton}
          >
            <ShoppingBag size={20} />
            {isHydrated && itemCount > 0 && (
              <span className={styles.badge}>{itemCount}</span>
            )}
          </button>
          <Link
            href={isAuthenticated ? '/account/profile' : '/account/login'}
            className={styles.cartButton}
          >
            <User size={20} />
          </Link>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link
            href="/catalog"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Каталог
          </Link>
          <Link
            href="/about"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Про нас
          </Link>
          <Link
            href="/contacts"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Контакти
          </Link>
        </div>
      )}
    </header>
  )
}