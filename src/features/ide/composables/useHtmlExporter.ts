/**
 * useHtmlExporter composable
 *
 * Orchestrates exporting an F-BASIC program as a standalone HTML file.
 * Step 2a: Adds Blob creation and file download trigger mechanism.
 * Full runtime embedding will be added in later steps (#772, #773).
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

/** MIME type for HTML content. */
const HTML_MIME_TYPE = 'text/html;charset=utf-8'

/**
 * Generates a minimal HTML wrapper containing the F-BASIC program source.
 * This is a placeholder — the full standalone HTML with embedded runtime
 * will be generated in later steps (#772, #773).
 *
 * @param source - The F-BASIC program source code
 * @param options - Export configuration options
 * @returns HTML string with the program source embedded
 */
function buildMinimalHtml(source: string, options: HtmlExportOptions): string {
  const escapedSource = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    `  <title>${options.title}</title>`,
    '</head>',
    '<body>',
    '  <pre>',
    escapedSource,
    '  </pre>',
    '</body>',
    '</html>',
  ].join('\n')
}

/**
 * Triggers a file download by creating a temporary anchor element.
 *
 * @param blob - The content to download
 * @param filename - The filename for the downloaded file
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Composable for exporting an F-BASIC program as a standalone HTML file.
 *
 * @param source - The F-BASIC program source code
 * @param _bg - Optional BG data (reserved for future use)
 * @returns Reactive export state and the exportHtml function
 */
export function useHtmlExporter(
  source: { value: string },
  _bg?: { value: CompactBg | undefined },
) {
  const isExporting = ref(false)
  const exportError = ref('')

  /**
   * Triggers the HTML export with the given options.
   * Creates a Blob with minimal HTML content and triggers a file download.
   *
   * @param options - Export configuration options
   */
  async function exportHtml(options: HtmlExportOptions): Promise<void> {
    isExporting.value = true
    exportError.value = ''

    try {
      const html = buildMinimalHtml(source.value, options)
      const blob = new Blob([html], { type: HTML_MIME_TYPE })
      const filename = `${options.title}.html`
      triggerDownload(blob, filename)
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
