import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

async function main(): Promise<void> {
  const workerEntry = path.resolve(process.cwd(), 'src/core/workers/WebWorkerInterpreter.ts')
  const managerFile = path.resolve(process.cwd(), 'src/core/devices/WebWorkerManager.ts')

  try {
    await access(workerEntry)
    await access(managerFile)
  } catch (error) {
    console.error('[test-service-worker] Required files are missing:', error)
    process.exit(1)
  }

  const managerSource = await readFile(managerFile, 'utf8')
  const hasWorkerImport = managerSource.includes('WebWorkerInterpreter.ts?worker')

  if (!hasWorkerImport) {
    console.error('[test-service-worker] WebWorkerManager does not reference WebWorkerInterpreter.ts?worker as expected.')
    process.exit(1)
  }

  console.log('[test-service-worker] Worker wiring looks valid.')
}

main().catch((error) => {
  console.error('[test-service-worker] Unexpected error:', error)
  process.exit(1)
})
