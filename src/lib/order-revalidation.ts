import { revalidateTag } from 'next/cache'

export function userOrdersTag(userId: string) {
    return `user-orders:${userId}`
}

export function revalidateUserOrders(userId: string | null | undefined) {
    if (!userId) return
    revalidateTag(userOrdersTag(userId))
}

