import { run } from './_util.js'

const merged = await run('git', ['branch', '--merged', 'dev'])
for (const line of merged.split('\n')) {
  // Never delete the active branch
  if (line.startsWith('*')) continue

  const branch = line.trim()
  if (!branch) continue
  // Never delete main
  if (branch === 'main') continue
  // Never delete dev
  if (branch === 'dev') continue

  await run('git', ['branch', '-d', branch], true)
}
