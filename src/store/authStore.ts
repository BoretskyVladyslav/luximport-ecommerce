import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
)
