'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Heart, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useHydration } from '@/hooks/useHydration'
import styles from './header.module.scss'
import { cn } from '@/lib/utils'

const premiumEase = [0.25, 0.1, 0.25, 1];

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
    <motion.header
      className={cn(styles.header, (isScrolled || isMobileMenuOpen) && styles.scrolled)}
      initial={{ y: '-100%', opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: premiumEase }}
    >
      <div className={styles.container}>
        <button
          className={styles.mobileToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={styles.nav}>
          <Link href="/">Головна</Link>
          <Link href="/catalog">Каталог</Link>
          <Link href="/about">Про нас</Link>
          <Link href="/contacts">Контакти</Link>
        </nav>

        <Link href="/" className={styles.logo}>
          LUXIMPORT
        </Link>

        <div className={styles.iconGroup}>
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: premiumEase }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
              }}
              initial="hidden"
              animate="show"
              exit="hidden"
              style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Головна</Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)}>Каталог</Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>Про нас</Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <Link href="/contacts" onClick={() => setIsMobileMenuOpen(false)}>Контакти</Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}