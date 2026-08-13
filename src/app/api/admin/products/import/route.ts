import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { getCorrelationId, errorResponse } from '@/lib/api-errors'
import {
    IMPORT_COLUMN_SPEC,
    applyProductImport,
    importTokenEquals,
    parseProductWorkbook,
} from '@/lib/product-import'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_EXT = new Set(['csv', 'xlsx', 'xls'])

function writeToken(): string | undefined {
    return process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
}

function isAuthorized(req: Request): boolean {
    const expected = writeToken()
    if (!expected) return false
    const header = req.headers.get('authorization') ?? ''
    const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
    const alt = req.headers.get('x-import-token')?.trim() ?? ''
    const provided = bearer || alt
    if (!provided) return false
    return importTokenEquals(provided, expected)
}

function writeClient() {
    const token = writeToken()
    if (!token) return null
    return createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
        token,
        useCdn: false,
    })
}

export async function GET() {
    return NextResponse.json({
        formats: ['csv', 'xlsx', 'xls'],
        maxFileBytes: MAX_FILE_BYTES,
        columns: IMPORT_COLUMN_SPEC,
        auth: 'Authorization: Bearer <SANITY_API_WRITE_TOKEN>',
        usage: 'POST multipart/form-data field "file"; ?dryRun=1 to parse without writes',
    })
}

export async function POST(req: Request) {
    const correlationId = getCorrelationId(req)
    try {
        if (!isAuthorized(req)) {
            return errorResponse('Unauthorized', 401, 'UNAUTHORIZED', correlationId)
        }

        const client = writeClient()
        if (!client || !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
            return errorResponse(
                'Сервіс тимчасово недоступний. Спробуйте пізніше.',
                503,
                'SANITY_UNAVAILABLE',
                correlationId
            )
        }

        const form = await req.formData().catch(() => null)
        const file = form?.get('file')
        if (!file || typeof file === 'string') {
            return errorResponse('Missing file field', 400, 'MISSING_FILE', correlationId)
        }

        const filename = file.name || 'upload.xlsx'
        const ext = filename.split('.').pop()?.toLowerCase() ?? ''
        if (!ALLOWED_EXT.has(ext)) {
            return errorResponse('Use .csv, .xlsx, or .xls', 400, 'UNSUPPORTED_TYPE', correlationId)
        }
        if (file.size > MAX_FILE_BYTES) {
            return errorResponse('File too large (max 8MB)', 413, 'FILE_TOO_LARGE', correlationId)
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const parsed = parseProductWorkbook(buffer, filename)
        const url = new URL(req.url)
        const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dryRun') === 'true'

        const summary = await applyProductImport(client, parsed.rows, { dryRun })

        return NextResponse.json({
            ok: true,
            dryRun,
            correlationId,
            headerRowIndex: parsed.headerRowIndex,
            columns: parsed.columns,
            skippedEmpty: parsed.skippedEmpty,
            parsed: parsed.rows.length,
            created: summary.created,
            updated: summary.updated,
            skipped: summary.skipped,
            errors: summary.errors,
            results: summary.results,
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed'
        console.error('[PRODUCT_IMPORT]', correlationId, err)
        return errorResponse(message, 400, 'IMPORT_FAILED', correlationId)
    }
}
