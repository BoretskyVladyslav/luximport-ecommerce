import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { modelName, calledMethod, methodProperties } = body

        const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey: process.env.NOVA_POSHTA_API_KEY || '',
                modelName,
                calledMethod,
                methodProperties,
            }),
        })

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ success: false, errors: ['Server error'] }, { status: 500 })
    }
}
