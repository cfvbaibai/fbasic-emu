import { spawn } from 'node:child_process'

/**
 * Patterns that indicate critical build warnings that should fail CI.
 *
 * "Circular chunk:" - Rollup circular dependency between chunks.
 *   These can cause TDZ (Temporal Dead Zone) runtime errors in production
 *   that do NOT reproduce in dev mode. See vite.config.ts manualChunks
 *   comment for historical context.
 */
const CRITICAL_WARNING_PATTERNS: readonly RegExp[] = [
  /Circular chunk:/i,
]

async function runBuildAndCapture(): Promise<string> {
  const viteArgs = process.argv.includes('--with-base')
    ? ['vite', 'build', '--base', '/fbasic-ide/']
    : ['vite', 'build']

  return new Promise((resolve, reject) => {
    const child =
      process.platform === 'win32'
        ? spawn('cmd.exe', ['/d', '/s', '/c', 'pnpm', '-s', ...viteArgs], {
            stdio: ['ignore', 'pipe', 'pipe'],
          })
        : spawn('pnpm', ['-s', ...viteArgs], {
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

  const matched: string[] = []
  for (const pattern of CRITICAL_WARNING_PATTERNS) {
    const lines = buildOutput
      .split('\n')
      .filter((line) => pattern.test(line))
    matched.push(...lines.map((l) => l.trim()))
  }

  if (matched.length > 0) {
    console.error(
      `[check-build-warnings] Found ${matched.length} critical build warning(s):`
    )
    for (const line of matched) {
      console.error(`  - ${line}`)
    }
    console.error(
      '[check-build-warnings] Critical build warnings detected. CI failed.'
    )
    process.exit(1)
  }

  console.log(
    '[check-build-warnings] No critical build warnings found. Build is clean.'
  )
}

main().catch((error) => {
  console.error('[check-build-warnings] Unexpected error:', error)
  process.exit(1)
})
