export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION
const WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN

export async function GET() {
    if (!PROJECT_ID || !DATASET || !API_VERSION || !WRITE_TOKEN) {
        return NextResponse.json(
            { ok: false, message: 'Missing Sanity env vars' },
            { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
    }

    const client = createClient({
        projectId: PROJECT_ID,
        dataset: DATASET,
        apiVersion: API_VERSION,
        token: WRITE_TOKEN,
        useCdn: false,
    })

    const ids = await client.fetch<string[]>(
        `*[_type == "order"]._id`,
        {},
        { cache: 'no-store', next: { revalidate: 0 } }
    )

    const uniqueIds = Array.from(
        new Set((Array.isArray(ids) ? ids : []).filter((x): x is string => typeof x === 'string' && x.length > 0))
    )

    let deleted = 0
    for (const id of uniqueIds) {
        await client.delete(id)
        deleted += 1
    }

    return NextResponse.json(
        { ok: true, deleted },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
}

