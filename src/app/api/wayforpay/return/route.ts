import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const url = new URL('/checkout/success', request.url)
        return NextResponse.redirect(url, 303)
    } catch (error) {
        console.error('WayForPay Return Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
