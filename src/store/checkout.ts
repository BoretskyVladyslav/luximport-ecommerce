import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/store/persistStorage'

export type CheckoutDraftPersisted = {
    name: string
    phone: string
    city: string
    postOffice: string
    cityRef: string
    manualDelivery: boolean
}

type CheckoutDraftState = CheckoutDraftPersisted & {
    setDraft: (patch: Partial<CheckoutDraftPersisted>) => void
    resetDraft: () => void
    clearDraft: () => void
}

const emptyDraft: CheckoutDraftPersisted = {
    name: '',
    phone: '',
    city: '',
    postOffice: '',
    cityRef: '',
    manualDelivery: false,
}

export const useCheckoutDraftStore = create<CheckoutDraftState>()(
    persist(
        (set) => ({
            ...emptyDraft,
            setDraft: (patch) => set((s) => ({ ...s, ...patch })),
            resetDraft: () => set((s) => ({ ...s, ...emptyDraft })),
            clearDraft: () => set((s) => ({ ...s, ...emptyDraft })),
        }),
        {
            name: 'luximport-checkout-draft',
            storage: safeJsonStorage(() => localStorage),
            partialize: (s) => ({
                name: s.name,
                phone: s.phone,
                city: s.city,
                postOffice: s.postOffice,
                cityRef: s.cityRef,
                manualDelivery: s.manualDelivery,
            }),
        }
    )
)
