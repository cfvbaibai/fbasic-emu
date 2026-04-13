/**
 * useHtmlExporter composable
 *
 * Orchestrates exporting an F-BASIC program as a standalone HTML file.
 * This is a stub — the actual export logic will be implemented in later steps
 * (issues tracking parent #538).
 */

import { ref } from 'vue'

import type { CompactBg } from '@/core/types/program-types'

/** Options for the HTML export. */
export interface HtmlExportOptions {
  /** Title for the exported HTML page. */
  title: string
  /** Theme to use: 'dark' or 'light'. */
  theme: 'dark' | 'light'
  /** Whether to include sound data in the export. */
  includeSound: boolean
  /** Whether to include sprite data in the export. */
  includeSprites: boolean
}

/**
 * Composable for exporting an F-BASIC program as a standalone HTML file.
 *
 * @param _source - The F-BASIC program source code (unused in stub)
 * @param _bg - Optional BG data (unused in stub)
 * @returns Reactive export state and the exportHtml function
 */
export function useHtmlExporter(
  _source: { value: string },
  _bg?: { value: CompactBg | undefined },
) {
  const isExporting = ref(false)
  const exportError = ref('')

  /**
   * Triggers the HTML export with the given options.
   *
   * @param _options - Export configuration options
   */
  async function exportHtml(_options: HtmlExportOptions): Promise<void> {
    isExporting.value = true
    exportError.value = ''

    try {
      // Stub: actual export logic will be implemented in later steps.
      // For now, simulate a brief async operation.
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    } catch (err) {
      exportError.value = err instanceof Error ? err.message : String(err)
    } finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    exportError,
    exportHtml,
  }
}
