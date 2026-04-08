import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSessionUserId } from '@/lib/auth/session'
import { sanityServer } from '@/lib/sanityServer'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
    try {
        const session = await getServerSession(authOptions)
        console.log('[account-layout] session.user.id', session?.user?.id)
        const userId = getSessionUserId()
        if (!userId?.trim()) {
            return children
        }
        const doc = await sanityServer.fetch<{ _id?: string } | null>(
            '*[_type == "user" && _id == $id][0]{ _id }',
            { id: userId.trim() }
        )
        if (!doc || typeof doc._id !== 'string' || !doc._id) {
            redirect('/account/login')
        }
    } catch (error) {
        console.error('[PROFILE_CRASH]:', error)
        redirect('/account/login')
    }
    return children
}
