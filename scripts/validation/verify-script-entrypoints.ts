import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

interface PackageJson {
  scripts?: Record<string, string>
}

const scriptsToValidate = [
  'build-web-worker',
  'build-service-worker',
  'test-service-worker',
  'check-syntax',
  'visualize-cst',
] as const

function resolveTsxEntrypoint(command: string): string | null {
  const match = command.match(/(?:^|\s)tsx\s+([^\s]+)/)
  return match?.[1] ?? null
}

async function main(): Promise<void> {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson
  const scripts = packageJson.scripts ?? {}

  for (const scriptName of scriptsToValidate) {
    const scriptCommand = scripts[scriptName]
    if (!scriptCommand) {
      console.error(`[verify-script-entrypoints] Missing script: ${scriptName}`)
      process.exit(1)
    }

    const entrypoint = resolveTsxEntrypoint(scriptCommand)
    if (!entrypoint) {
      continue
    }

    const resolvedEntrypoint = path.resolve(process.cwd(), entrypoint)
    try {
      await access(resolvedEntrypoint)
    } catch {
      console.error(`[verify-script-entrypoints] Entrypoint not found for "${scriptName}": ${entrypoint}`)
      process.exit(1)
    }
  }

  console.log('[verify-script-entrypoints] Script entrypoints verified.')
}

main().catch((error) => {
  console.error('[verify-script-entrypoints] Unexpected error:', error)
  process.exit(1)
})
