import { createJSONStorage } from 'zustand/middleware'

type WebStorageLike = {
    getItem: (name: string) => string | null
    setItem: (name: string, value: string) => void
    removeItem: (name: string) => void
}

function safeWebStorage(getStorage: () => WebStorageLike): WebStorageLike {
    return {
        getItem: (name) => {
            try {
                return getStorage().getItem(name)
            } catch {
                return null
            }
        },
        setItem: (name, value) => {
            try {
                getStorage().setItem(name, value)
            } catch {
                return
            }
        },
        removeItem: (name) => {
            try {
                getStorage().removeItem(name)
            } catch {
                return
            }
        },
    }
}

export function safeJsonStorage(getStorage: () => WebStorageLike) {
    const base = safeWebStorage(getStorage)
    return createJSONStorage(() => ({
        getItem: (name) => {
            const raw = base.getItem(name)
            if (raw == null) return null
            try {
                JSON.parse(raw)
                return raw
            } catch {
                base.removeItem(name)
                return null
            }
        },
        setItem: base.setItem,
        removeItem: base.removeItem,
    }))
}

