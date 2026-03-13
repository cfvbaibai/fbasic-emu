import { spawn } from 'node:child_process'

const unresolvedAssetPattern = /didn't resolve at build time/i

async function runBuildAndCapture(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === 'win32'
        ? spawn('cmd.exe', ['/d', '/s', '/c', 'pnpm -s vite build'], {
            stdio: ['ignore', 'pipe', 'pipe'],
          })
        : spawn('pnpm', ['-s', 'vite', 'build'], {
            stdio: ['ignore', 'pipe', 'pipe'],
          })

    let combinedOutput = ''

    child.stdout.on('data', (chunk) => {
      const text = String(chunk)
      combinedOutput += text
      process.stdout.write(text)
    })

    child.stderr.on('data', (chunk) => {
      const text = String(chunk)
      combinedOutput += text
      process.stderr.write(text)
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`vite build failed with exit code ${code ?? 'unknown'}`))
        return
      }
      resolve(combinedOutput)
    })
  })
}

async function main(): Promise<void> {
  const buildOutput = await runBuildAndCapture()
  if (unresolvedAssetPattern.test(buildOutput)) {
    console.error('[check-unresolved-assets] Found unresolved build asset warnings.')
    process.exit(1)
  }

  console.log('[check-unresolved-assets] No unresolved build asset warnings found.')
}

main().catch((error) => {
  console.error('[check-unresolved-assets] Unexpected error:', error)
  process.exit(1)
})
