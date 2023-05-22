import { spawn } from 'cross-spawn'

export async function run(cmd, args, pipe = false) {
  let output = ''

  const proc = spawn(cmd, args, pipe ? { stdio: 'inherit' } : undefined)

  proc.stdout?.on('data', (data) => {
    output += data
  })

  return new Promise((resolve) => {
    proc.on('close', () => {
      resolve(output)
    })
  })
}
