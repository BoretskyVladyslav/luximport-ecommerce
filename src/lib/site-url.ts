/**
 * Canonical site origin for metadataBase, sitemap, and robots.
 * Set NEXT_PUBLIC_DOMAIN to a full URL (e.g. https://luximport.org) or a bare host.
 */
const FALLBACK_ORIGIN = 'https://luximport.org'

export function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_DOMAIN?.trim()
    if (!raw) return FALLBACK_ORIGIN
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw.replace(/\/$/, '')
    }
    return `https://${raw.replace(/^\/+/, '').replace(/\/$/, '')}`
}

/**
 * Safe URL for Next.js metadataBase — invalid env must never throw or the root layout fails to load.
 */
export function getMetadataBase(): URL {
    try {
        const u = new URL(getSiteUrl())
        if (!u.hostname || u.hostname.length < 1) throw new Error('invalid host')
        return u
    } catch {
        return new URL(FALLBACK_ORIGIN)
    }
}
