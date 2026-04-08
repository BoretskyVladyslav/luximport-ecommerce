import 'dotenv/config'
import { sanityServer } from '../src/lib/sanityServer'

async function main() {
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const token = process.env.SANITY_API_TOKEN

    if (!projectId || !dataset) {
        throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET')
    }
    if (!token) {
        throw new Error('Missing SANITY_API_TOKEN')
    }

    const count = await sanityServer.fetch<number>('count(*[_type == "order"])')
    process.stdout.write(`Dataset: ${dataset}\n`)
    process.stdout.write(`Orders found: ${count}\n`)

    if (count === 0) {
        return
    }

    const confirm = process.env.CONFIRM_PURGE_ORDERS
    if (confirm !== 'YES') {
        process.stdout.write('Set CONFIRM_PURGE_ORDERS=YES to permanently delete all order documents.\n')
        process.exitCode = 2
        return
    }

    const result = await sanityServer.mutate([{ delete: { query: '*[_type == "order"]' } }])
    process.stdout.write(`Deleted.\n`)
    process.stdout.write(JSON.stringify(result) + '\n')
}

main().catch((err) => {
    process.stderr.write(String(err?.stack ?? err) + '\n')
    process.exitCode = 1
})

