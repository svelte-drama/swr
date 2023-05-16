import { run } from './_util.js'
import { extname } from 'path'

const EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.svelte',
  '.ts',
  '.yaml',
])

console.log('🧱 Formatting files...')
const changes = await run('git', [
  'diff',
  '--cached',
  '--name-only',
  '--diff-filter=ACM',
])
const files = changes
  .split('\n')
  .filter((filename) => EXTENSIONS.has(extname(filename)))
if (files.length) {
  await run(
    'pnpx',
    ['prettier', '--write', '--plugin-search-dir=.', ...files],
    true
  )
  await run('git', ['add', ...files])
}
