import { access } from 'node:fs/promises'
import path from 'node:path'

async function main(): Promise<void> {
  const workerEntry = path.resolve(process.cwd(), 'src/core/workers/WebWorkerInterpreter.ts')

  try {
    await access(workerEntry)
  } catch {
    console.error(`[build-web-worker] Worker entrypoint not found: ${workerEntry}`)
    process.exit(1)
  }

  console.log(`[build-web-worker] Worker entrypoint found: ${workerEntry}`)
  console.log('[build-web-worker] Standalone worker build is not required; Vite bundles ?worker imports during app build.')
}

main().catch((error) => {
  console.error('[build-web-worker] Unexpected error:', error)
  process.exit(1)
})
