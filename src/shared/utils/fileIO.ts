/**
 * File I/O Utilities
 *
 * Provides file save/load functionality for program management
 */

import type { ProgramExportFile } from '@/core/types/program-types'

/**
 * Save data as a JSON file download
 * Uses the download link approach for broad browser compatibility
 *
 * @param data - Object to serialize as JSON
 * @param filename - Suggested filename (without extension)
 */
export async function saveJsonFile(data: object, filename: string): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  try {
    // Create temporary download link
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Small delay to ensure download starts before cleanup
    await new Promise((resolve) => setTimeout(resolve, 100))
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Load a JSON file from user's device
 * Opens a file picker and returns the parsed JSON content
 *
 * @returns Parsed JSON content or null if cancelled
 * @throws Error if file cannot be read or parsed
 */
export async function loadJsonFile(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // Create file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        resolve(data)
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`))
      }
    }

    input.oncancel = () => {
      resolve(null)
    }

    // Trigger file picker
    input.click()
  })
}

/**
 * Validate that loaded data is a valid ProgramExportFile
 *
 * @param data - Parsed JSON data to validate
 * @returns True if data is a valid program file
 */
export function isValidProgramFile(data: unknown): data is ProgramExportFile {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const file = data as Record<string, unknown>

  return (
    file.format === 'family-basic-program' &&
    typeof file.version === 'number' &&
    typeof file.program === 'object' &&
    file.program !== null
  )
}
