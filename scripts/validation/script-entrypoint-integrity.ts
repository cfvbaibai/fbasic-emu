import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface ScriptEntrypointReference {
  scriptName: string
  command: string
  entrypoint: string
}

export interface MissingScriptEntrypoint {
  scriptName: string
  command: string
  entrypoint: string
  resolvedPath: string
}

const ENTRYPOINT_PATTERN = /(?:^|[;&|]\s*|\s)(?:pnpm\s+exec\s+)?(?:tsx|node)\s+((?:"[^"]+"|'[^']+'|[^\s;&|]+))/g
const SCRIPT_FILE_PATTERN = /\.(?:[cm]?[jt]s)$/i

function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export function collectScriptEntrypoints(
  scripts: Record<string, string>
): ScriptEntrypointReference[] {
  const entrypoints: ScriptEntrypointReference[] = []
  const seen = new Set<string>()

  for (const [scriptName, command] of Object.entries(scripts)) {
    for (const match of command.matchAll(ENTRYPOINT_PATTERN)) {
      const candidate = stripQuotes(match[1] ?? '')
      if (!SCRIPT_FILE_PATTERN.test(candidate)) {
        continue
      }

      const key = `${scriptName}|${candidate}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      entrypoints.push({
        scriptName,
        command,
        entrypoint: candidate,
      })
    }
  }

  return entrypoints
}

export function findMissingScriptEntrypoints(
  scripts: Record<string, string>,
  rootDir: string
): MissingScriptEntrypoint[] {
  return collectScriptEntrypoints(scripts)
    .map((reference) => ({
      ...reference,
      resolvedPath: resolve(rootDir, reference.entrypoint),
    }))
    .filter((reference) => !existsSync(reference.resolvedPath))
}

export function readPackageScripts(packageJsonPath: string): Record<string, string> {
  const packageRaw = readFileSync(packageJsonPath, 'utf8')
  const parsed = JSON.parse(packageRaw) as { scripts?: Record<string, string> }
  return parsed.scripts ?? {}
}
