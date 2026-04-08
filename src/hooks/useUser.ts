'use client'

import { useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { useAuthStore } from '@/store/authStore'

type User = {
    id: string
    email: string
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
}

function parseUser(input: any): User | null {
    if (!input || typeof input !== 'object') return null
    const id = typeof input.id === 'string' ? input.id : ''
    const email = typeof input.email === 'string' ? input.email : ''
    if (!id || !email) return null
    return {
        id,
        email,
        name: typeof input.name === 'string' ? input.name : '',
        firstName: typeof input.firstName === 'string' ? input.firstName : '',
        lastName: typeof input.lastName === 'string' ? input.lastName : '',
        phone: typeof input.phone === 'string' ? input.phone : '',
        address: typeof input.address === 'string' ? input.address : '',
    }
}

export function useUser() {
    const user = useAuthStore((s) => s.user)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const setUser = useAuthStore((s) => s.setUser)
    const logout = useAuthStore((s) => s.logout)

    const refresh = useCallback(async () => {
        const res = await fetch('/api/user/me', { method: 'GET' })
        const data = await res.json().catch(() => null)
        const next = parseUser(data?.user)
        setUser(next)
        return next
    }, [setUser])

    const updateUser = useCallback(
        (next: Partial<User> | null) => {
            if (!next) {
                setUser(null)
                return
            }
            const current = useAuthStore.getState().user
            const merged = { ...(current ?? {}), ...next } as User
            setUser(merged)
        },
        [setUser]
    )

    const destroySession = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            logout()
            await signOut({ callbackUrl: '/' })
        } catch {
            logout()
            await signOut({ callbackUrl: '/' })
        }
    }, [logout])

    return { user, isAuthenticated, refresh, updateUser, destroySession }
}

