import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from '@/lib/auth/verifyCredentials'
import { setSessionCookie } from '@/lib/auth/session'

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24 * 14,
    },
    pages: {
        signIn: '/account/login',
        signOut: '/account/login',
    },
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email
                const password = credentials?.password
                if (typeof email !== 'string' || typeof password !== 'string') {
                    return null
                }
                if (!process.env.AUTH_SECRET) {
                    return null
                }
                const row = await verifyCredentials(email, password)
                if (!row?.id || typeof row.id !== 'string' || !row.id.trim()) {
                    return null
                }
                const sanityUserId = row.id.trim()
                setSessionCookie(sanityUserId)
                return {
                    id: sanityUserId,
                    email: row.email ?? null,
                    name: row.name ?? null,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const uid = typeof user.id === 'string' && user.id.trim() ? user.id.trim() : ''
                if (uid) {
                    token.id = uid
                    token.sub = uid
                }
            }
            return token
        },
        async session({ session, token }) {
            const id =
                typeof token.id === 'string' && token.id.trim()
                    ? token.id.trim()
                    : typeof token.sub === 'string' && token.sub.trim()
                      ? token.sub.trim()
                      : ''
            if (session.user) {
                session.user.id = id
            }
            return session
        },
    },
}

export async function auth() {
    const session = await getServerSession(authOptions)
    const uid = session?.user?.id?.trim()
    if (!uid) {
        return null
    }
    return {
        user: {
            id: uid,
        },
    }
}
