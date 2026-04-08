import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/store/persistStorage'

interface User {
    id: string
    firstName?: string
    lastName?: string
    name?: string
    email: string
    phone?: string
    address?: string
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    login: (user: User) => void
    logout: () => void
    register: (user: User) => void
    setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (user) => set({ user, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),
            register: (user) => set({ user, isAuthenticated: true }),
            setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
        }),
        {
            name: 'li_auth',
            storage: safeJsonStorage(() => sessionStorage),
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
            onRehydrateStorage: () => (state) => {
                if (!state) return
                const u: any = state.user
                const id = typeof u?.id === 'string' ? u.id : ''
                const email = typeof u?.email === 'string' ? u.email : ''
                if (!id.trim() || !email.trim()) {
                    state.user = null
                    state.isAuthenticated = false
                    return
                }
                state.user = {
                    id,
                    email,
                    name: typeof u?.name === 'string' ? u.name : '',
                    firstName: typeof u?.firstName === 'string' ? u.firstName : '',
                    lastName: typeof u?.lastName === 'string' ? u.lastName : '',
                    phone: typeof u?.phone === 'string' ? u.phone : '',
                    address: typeof u?.address === 'string' ? u.address : '',
                }
                state.isAuthenticated = Boolean(state.user)
            },
        }
    )
)
