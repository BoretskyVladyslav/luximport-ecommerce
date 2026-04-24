import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export function getCorrelationId(req: Request): string {
    return req.headers.get('x-correlation-id')?.trim() || randomUUID()
}

export function errorResponse(
    message: string,
    status: number,
    code: string,
    correlationId: string,
    details?: unknown
) {
    return NextResponse.json(
        {
            code,
            message,
            correlationId,
            ...(details !== undefined ? { details } : {}),
        },
        { status }
    )
}
