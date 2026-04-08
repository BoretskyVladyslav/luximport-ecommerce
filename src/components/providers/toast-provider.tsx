'use client'

import { Toaster } from 'react-hot-toast'

type Props = {
    children: React.ReactNode
}

export function ToastProvider({ children }: Props) {
    return (
        <>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                }}
            />
        </>
    )
}

