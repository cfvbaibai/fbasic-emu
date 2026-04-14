/**
 * buildExportHtml — Assembles a standalone HTML document for F-BASIC program export.
 *
 * Produces a self-contained HTML file containing:
 * - A canvas element (256x240, F-BASIC sprite screen dimensions)
 * - Inline CSS for the selected theme (dark or light) and canvas centering
 * - The F-BASIC program source embedded in a `<script id="fbasic-program">` tag
 * - An empty `<script id="fbasic-runtime">` placeholder for the runtime bundle
 *
 * The runtime bundle (from #632) will be injected into the placeholder
 * by the build step (#635) or a dedicated wiring step.
 */

import { EXPORT_THEME_COLORS, SCREEN_DIMENSIONS } from '@/core/constants'
import type { HtmlExportOptions } from '@/features/ide/composables/useHtmlExporter'

/** Canvas width and height matching F-BASIC sprite screen dimensions. */
const CANVAS_WIDTH = SCREEN_DIMENSIONS.SPRITE.WIDTH
const CANVAS_HEIGHT = SCREEN_DIMENSIONS.SPRITE.HEIGHT

/**
 * Returns the CSS color values for the given theme.
 */
function getThemeColors(theme: 'dark' | 'light'): { bg: string; text: string } {
  return theme === 'dark'
    ? { bg: EXPORT_THEME_COLORS.DARK_BG, text: EXPORT_THEME_COLORS.DARK_TEXT }
    : { bg: EXPORT_THEME_COLORS.LIGHT_BG, text: EXPORT_THEME_COLORS.LIGHT_TEXT }
}

/**
 * Escapes HTML special characters in a string for safe inclusion in
 * HTML attribute values (e.g., `<title>`).
 *
 * Note: This is NOT used for the `<script>` content — script tags
 * don't parse HTML entities, so we use a different escaping strategy
 * there (breaking the `</script>` sequence).
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Closing script tag fragment, split to avoid `</script>` in source. */
const SCRIPT_CLOSE = '</' + 'script>'

/**
 * Escapes the `</script>` sequence in program source to prevent it
 * from prematurely closing the enclosing `<script>` tag.
 *
 * Inside a `<script>` element, the only sequence that needs escaping
 * is `</script>` — HTML entities are not parsed. We split this into
 * `<\/script>` which is equivalent JavaScript but won't trigger the
 * HTML parser's tag-closing behavior.
 */
function escapeScriptContent(source: string): string {
  return source.replace(/<\/script/gi, '<\\/script')
}

/**
 * Builds the inline CSS for the exported HTML page.
 *
 * Centers the canvas, applies the theme background, and scales the
 * canvas to fill available width while maintaining aspect ratio.
 */
function buildThemeCss(theme: 'dark' | 'light'): string {
  const { bg, text } = getThemeColors(theme)

  return [
    `*{margin:0;padding:0;box-sizing:border-box}`,
    `html,body{width:100%;height:100%;overflow:hidden;background-color:${bg};color:${text};font-family:monospace}`,
    `body{display:flex;justify-content:center;align-items:center}`,
    `#fbasic-screen{max-width:100%;max-height:100%;image-rendering:pixelated;image-rendering:crisp-edges}`,
  ].join('\n')
}

/**
 * Generates a standalone HTML document for exporting an F-BASIC program.
 *
 * The resulting HTML contains a canvas element, inline theme CSS, the
 * program source embedded in a script tag, and a runtime placeholder.
 * The runtime bundle will be injected into `<script id="fbasic-runtime">`
 * during the build or wiring step.
 *
 * @param source - The F-BASIC program source code
 * @param options - Export configuration options
 * @returns A complete HTML document string
 */
export function buildExportHtml(
  source: string,
  options: HtmlExportOptions,
): string {
  const css = buildThemeCss(options.theme)
  const escapedTitle = escapeHtml(options.title)
  const escapedSource = escapeScriptContent(source)

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${escapedTitle}</title>`,
    '  <style>',
    css,
    '  </style>',
    '</head>',
    `<body data-include-sound="${options.includeSound}" data-include-sprites="${options.includeSprites}">`,
    `  <canvas id="fbasic-screen" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>`,
    `  <script id="fbasic-program" type="text/plain">${escapedSource}${SCRIPT_CLOSE}`,
    `  <script id="fbasic-runtime">${SCRIPT_CLOSE}`,
    '</body>',
    '</html>',
  ].join('\n')
}
