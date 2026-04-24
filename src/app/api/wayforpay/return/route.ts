import { NextResponse } from 'next/server'

async function parseOrderReference(request: Request): Promise<string> {
    try {
        const u = new URL(request.url)
        const fromQuery = u.searchParams.get('orderReference')?.trim()
        if (fromQuery) return fromQuery
    } catch {
        void 0
    }
    if (request.method !== 'POST') return ''
    try {
        const ct = request.headers.get('content-type') || ''
        if (ct.includes('application/x-www-form-urlencoded')) {
            const text = await request.text()
            return new URLSearchParams(text).get('orderReference')?.trim() || ''
        }
        if (ct.includes('multipart/form-data')) {
            const form = await request.formData()
            const v = form.get('orderReference')
            return typeof v === 'string' ? v.trim() : ''
        }
    } catch {
        void 0
    }
    return ''
}

async function successRedirect(request: Request) {
    const url = new URL('/checkout/success', request.url)
    url.searchParams.set('from', 'wfp')
    const orderRef = await parseOrderReference(request)
    if (orderRef) url.searchParams.set('order', orderRef)
    url.searchParams.set('source', 'return')
    return NextResponse.redirect(url, 303)
}

export async function GET(request: Request) {
    try {
        return await successRedirect(request)
    } catch (error) {
        console.error('WayForPay Return Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        return await successRedirect(request)
    } catch (error) {
        console.error('WayForPay Return Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
