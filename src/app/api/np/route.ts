import { NextResponse } from 'next/server'

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export async function POST(request: Request) {
    try {
        if (!process.env.NOVA_POSHTA_API_KEY) {
            console.error('[SERVER_DEBUG]: missing env NOVA_POSHTA_API_KEY')
            return NextResponse.json(
                { success: false, errors: ['Delivery lookup is temporarily unavailable'], transient: true },
                { status: 503 }
            )
        }

        let body: unknown
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ success: false, errors: ['Invalid JSON body'] }, { status: 400 })
        }

        if (!isRecord(body)) {
            return NextResponse.json({ success: false, errors: ['Body must be a JSON object'] }, { status: 400 })
        }

        const { modelName, calledMethod, methodProperties } = body

        if (typeof modelName !== 'string' || !modelName.trim()) {
            return NextResponse.json({ success: false, errors: ['Invalid modelName'] }, { status: 400 })
        }
        if (typeof calledMethod !== 'string' || !calledMethod.trim()) {
            return NextResponse.json({ success: false, errors: ['Invalid calledMethod'] }, { status: 400 })
        }
        if (methodProperties !== undefined && methodProperties !== null && !isRecord(methodProperties)) {
            return NextResponse.json({ success: false, errors: ['methodProperties must be an object'] }, { status: 400 })
        }

        const controller = new AbortController()
        const timeoutMs = 6500
        const timeout = setTimeout(() => controller.abort(), timeoutMs)

        let response: Response
        try {
            response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: process.env.NOVA_POSHTA_API_KEY,
                    modelName: modelName.trim(),
                    calledMethod: calledMethod.trim(),
                    methodProperties: isRecord(methodProperties) ? methodProperties : {},
                }),
                signal: controller.signal,
            })
        } catch (e) {
            const isAbort = e instanceof Error && e.name === 'AbortError'
            return NextResponse.json(
                { success: false, errors: [isAbort ? 'Delivery lookup timed out' : 'Delivery lookup failed'], transient: true },
                { status: 502 }
            )
        } finally {
            clearTimeout(timeout)
        }

        if (!response.ok) {
            console.error('Nova Poshta HTTP error:', response.status, response.statusText)
            return NextResponse.json(
                { success: false, errors: ['Delivery lookup is temporarily unavailable'], transient: true },
                { status: 502 }
            )
        }

        let data: unknown
        try {
            data = await response.json()
        } catch {
            return NextResponse.json({ success: false, errors: ['Invalid upstream JSON'] }, { status: 502 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('[SERVER_DEBUG]:', error)
        return NextResponse.json({ success: false, errors: ['Server error'] }, { status: 500 })
    }
}
