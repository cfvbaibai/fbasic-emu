#!/usr/bin/env node

/**
 * Test File Generator for .bas Files
 *
 * Scaffolds a Vitest test file from a BASIC source (.bas) file.
 * The generated test uses the existing test infrastructure
 * (BasicInterpreter, mock device adapter) to execute the program
 * and assert it completes without runtime errors.
 *
 * Usage:
 *   node scripts/generate-test.mjs <path-to-file.bas>
 *   node scripts/generate-test.mjs src/core/samples/programs/basics/hello.bas
 *
 * Output:
 *   test/programs/<ProgramName>.test.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const TEST_OUTPUT_DIR = join(REPO_ROOT, 'test', 'programs')

function printUsage() {
  console.log(`
Usage: node scripts/generate-test.mjs <path-to-file.bas>

Scaffold a Vitest test file from a BASIC source (.bas) file.

Arguments:
  <path-to-file.bas>  Path to the .bas file (relative or absolute)

Options:
  --help, -h          Show this help message

Examples:
  node scripts/generate-test.mjs src/core/samples/programs/basics/hello.bas
  node scripts/generate-test.mjs src/core/samples/programs/comprehensive/route66.bas

Output:
  test/programs/<ProgramName>.test.ts
`)
}

/**
 * Convert a filename to PascalCase test name.
 * Examples: hello.bas -> Hello, type-master.bas -> TypeMaster, route66.bas -> Route66
 */
function toPascalCase(filename) {
  const stem = basename(filename, '.bas')
  return stem
    .split(/[-_]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

/**
 * Generate the Vitest test file content.
 */
function generateTestContent(programName, basFilePath, basSource) {
  return `/**
 * ${programName} Program Test
 *
 * Auto-generated test scaffold for ${programName}.
 * Source: ${basFilePath}
 *
 * Once TestProgram helper (PR #408) is merged, this test can be
 * simplified to use TestProgram instead of the raw infrastructure below.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

/** Path to the .bas source file (resolved from project root where Vitest runs) */
const BAS_PATH = resolve(process.cwd(), '${basFilePath}')

/** Read the BASIC source code at module level */
const SOURCE_CODE = readFileSync(BAS_PATH, 'utf8')

describe('${programName}', () => {
  let interpreter: BasicInterpreter
  let mockDeviceAdapter: BasicDeviceAdapter
  let printOutputMock: MockedFunction<(output: string) => void>

  beforeEach(() => {
    printOutputMock = vi.fn()
    mockDeviceAdapter = {
      getJoystickCount: vi.fn(() => 0),
      getStickState: vi.fn(() => 0),
      setStickState: vi.fn(),
      pushStrigState: vi.fn(),
      consumeStrigState: vi.fn(() => 0),
      getSpritePosition: vi.fn(() => null),
      getInkeyState: vi.fn(() => ''),
      printOutput: printOutputMock,
      debugOutput: vi.fn(),
      errorOutput: vi.fn(),
      clearScreen: vi.fn(),
      setCursorPosition: vi.fn(),
      getCursorPosition: vi.fn(() => ({ x: 0, y: 0 })),
      getScreenCell: vi.fn(() => ' '),
      setColorPattern: vi.fn(),
      setColorPalette: vi.fn(),
      setBackdropColor: vi.fn(),
      setCharacterGeneratorMode: vi.fn(),
      getCharacterGeneratorMode: vi.fn(() => 2),
    }

    interpreter = new BasicInterpreter({
      maxIterations: 10000,
      maxOutputLines: 1000,
      enableDebugMode: false,
      strictMode: false,
      suppressOkPrompt: true,
      deviceAdapter: mockDeviceAdapter,
    })
  })

  it('should execute without runtime errors', async () => {
    const result = await interpreter.execute(SOURCE_CODE)

    // Log diagnostics on failure for easier debugging
    if (!result.success || result.errors.length > 0) {
      console.error('Execution errors:', result.errors)
    }

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // TODO: Add more specific assertions based on expected program behavior:
  //
  // it('should produce expected output', async () => {
  //   const result = await interpreter.execute(SOURCE_CODE)
  //   const outputs = printOutputMock.mock.calls.map(call => call[0])
  //   expect(outputs).toContain('expected text\\n')
  // })
  //
  // it('should set expected variables', async () => {
  //   const result = await interpreter.execute(SOURCE_CODE)
  //   expect(result.variables.get('MY_VAR')?.value).toBe(expectedValue)
  // })
})
`
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(args.length === 0 ? 1 : 0)
  }

  const basArg = args[0]
  const basFilePath = resolve(REPO_ROOT, basArg)

  // Validate input file
  if (!existsSync(basFilePath)) {
    console.error(`Error: File not found: ${basFilePath}`)
    process.exit(1)
  }

  if (!basFilePath.endsWith('.bas')) {
    console.error(`Error: Expected a .bas file, got: ${basFilePath}`)
    process.exit(1)
  }

  // Read source
  const basSource = readFileSync(basFilePath, 'utf8')

  // Derive names
  const programName = toPascalCase(basFilePath)
  const testFileName = `${programName}.test.ts`
  const testFilePath = join(TEST_OUTPUT_DIR, testFileName)

  // Check for existing file
  if (existsSync(testFilePath)) {
    console.error(`Error: Test file already exists: ${testFilePath}`)
    console.error('Remove it first if you want to regenerate.')
    process.exit(1)
  }

  // Generate content
  const content = generateTestContent(programName, basArg, basSource)

  // Ensure output directory exists
  if (!existsSync(TEST_OUTPUT_DIR)) {
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  }

  // Write file
  writeFileSync(testFilePath, content, 'utf8')
  console.log(`Generated: ${testFilePath}`)
  console.log(`  Program name: ${programName}`)
  console.log(`  Source: ${basArg}`)
  console.log()
  console.log('Next steps:')
  console.log('  1. Review the generated test file')
  console.log('  2. Run: pnpm test:run -- test/programs/' + testFileName)
  console.log('  3. Add specific assertions as needed')
}

main()
