'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ShoppingBag, Menu, X, Heart, User, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import { useHydration } from '@/hooks/useHydration'
import { useUser } from '@/hooks/useUser'
import styles from './header.module.scss'
import { cn } from '@/lib/utils'

const premiumEase = [0.25, 0.1, 0.25, 1]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const items = useStore((state) => state.items)
  const openCart = useStore((state) => state.openCart)
  const wishlistItems = useWishlistStore((state) => state.items)
  const openWishlist = useWishlistStore((state) => state.openWishlist)
  const isHydrated = useHydration()
  const { destroySession } = useUser()
  const sessionReady = status !== 'loading'
  const hasSessionUser = Boolean(session?.user)
  const userIconHref = hasSessionUser ? '/account/profile' : '/account/login'

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
      style={{ willChange: 'transform, opacity' }}
    >
      <div className={styles.container}>
        <button
          type="button"
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
          <button type="button" className={styles.cartButton} style={{ position: 'relative' }} onClick={openWishlist}>
            <Heart size={20} />
            {isHydrated && wishlistCount > 0 && (
              <span className={styles.badge}>{wishlistCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={openCart}
            className={styles.cartButton}
          >
            <ShoppingBag size={20} />
            {isHydrated && itemCount > 0 && (
              <span className={styles.badge}>{itemCount}</span>
            )}
          </button>
          {isHydrated ? (
            !sessionReady ? (
              <Link href="/account/login" className={styles.cartButton}>
                <User size={20} />
              </Link>
            ) : hasSessionUser ? (
              <>
                <Link href={userIconHref} className={styles.cartButton}>
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
              <Link href={userIconHref} className={styles.cartButton}>
                <User size={20} />
              </Link>
            )
          ) : null}
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
              {isHydrated && sessionReady && hasSessionUser ? (
                <>
                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                    <Link href={userIconHref} onClick={() => setIsMobileMenuOpen(false)}>
                      Профіль
                    </Link>
                  </motion.div>
                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        void destroySession()
                      }}
                      className={styles.mobileLogout}
                    >
                      Вийти
                    </button>
                  </motion.div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}