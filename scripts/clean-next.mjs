import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function rm(name) {
    const p = path.join(root, name)
    try {
        fs.rmSync(p, { recursive: true, force: true })
        console.log('Removed', name)
    } catch (e) {
        console.warn('Could not remove', name, e instanceof Error ? e.message : e)
    }
}

rm('.next')
rm(path.join('node_modules', '.cache'))
