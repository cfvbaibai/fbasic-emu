/**
 * useHtmlExporter composable
 *
 * Orchestrates exporting an F-BASIC program as a standalone HTML file.
 * Uses buildExportHtml to assemble the HTML template with canvas, theme CSS,
 * embedded program source, and a runtime script placeholder.
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CompactBg } from '@/core/types/program-types'
import { buildExportHtml } from '@/features/ide/composables/buildExportHtml'

/** Default filename used when the export title is empty or whitespace-only. */
export const DEFAULT_EXPORT_FILENAME = 'program.html'

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
 * Converts a user-provided title into a safe export filename.
 *
 * Falls back to {@link DEFAULT_EXPORT_FILENAME} when the title is empty
 * or consists solely of whitespace, preventing filenames like `.html`.
 *
 * @param title - The user-provided page title
 * @returns A filename string ending in `.html`
 */
export function toExportFilename(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    return DEFAULT_EXPORT_FILENAME
  }
  return `${trimmed}.html`
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
  const { locale } = useI18n()

  /**
   * Triggers the HTML export with the given options.
   * Assembles the HTML template with canvas, theme CSS, and program source,
   * creates a Blob, and triggers a file download.
   *
   * @param options - Export configuration options
   */
  async function exportHtml(options: HtmlExportOptions): Promise<void> {
    isExporting.value = true
    exportError.value = ''

    try {
      const html = buildExportHtml(source.value, options, locale.value)
      const blob = new Blob([html], { type: HTML_MIME_TYPE })
      const filename = toExportFilename(options.title)
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
