import { run } from './_util.js'

const previous_branch = process.argv[2]
const new_branch = process.argv[3]

const changes = await run('git', [
  'diff-tree',
  '-r',
  '--name-only',
  '--no-commit-id',
  previous_branch,
  new_branch,
])
if (changes.includes('package.json')) {
  console.log(
    '📦 package-lock.json changed. Running pnpm install to bring your dependencies up to date.'
  )
  await run('pnpm', ['install'], true)
}
