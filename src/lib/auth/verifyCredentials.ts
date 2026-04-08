import bcrypt from 'bcryptjs'
import { sanityServer } from '@/lib/sanityServer'
import { normalizeEmail } from '@/lib/auth/crypto'

type UserRow = {
    _id: string
    email: string | null
    name: string | null
    phone: string | null
    passwordHash: string | null
}

export async function verifyCredentials(emailRaw: string, password: string) {
    const email = normalizeEmail(emailRaw.trim())
    const user = await sanityServer.fetch<UserRow | null>(
        '*[_type == "user" && email == $email][0]{ _id, email, name, phone, passwordHash }',
        { email }
    )
    if (!user?._id || !user.passwordHash) {
        return null
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
        return null
    }
    return {
        id: user._id,
        email: user.email ?? email,
        name: user.name ?? '',
        phone: user.phone ?? '',
    }
}
