import { resolve } from 'node:path'
import {
  collectScriptEntrypoints,
  findMissingScriptEntrypoints,
  readPackageScripts,
} from './script-entrypoint-integrity'

const repoRoot = process.cwd()
const packageJsonPath = resolve(repoRoot, 'package.json')
const scripts = readPackageScripts(packageJsonPath)
const referencedEntrypoints = collectScriptEntrypoints(scripts)
const missingEntrypoints = findMissingScriptEntrypoints(scripts, repoRoot)

console.log(`Found ${referencedEntrypoints.length} script entrypoint reference(s).`)

if (missingEntrypoints.length === 0) {
  console.log('All referenced script entrypoints exist.')
  process.exit(0)
}

console.error(`Missing ${missingEntrypoints.length} script entrypoint(s):`)
for (const missing of missingEntrypoints) {
  console.error(`- ${missing.scriptName}: ${missing.entrypoint}`)
  console.error(`  command: ${missing.command}`)
  console.error(`  resolved: ${missing.resolvedPath}`)
}

process.exit(1)
