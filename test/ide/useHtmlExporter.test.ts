// @vitest-environment jsdom
/**
 * Tests for useHtmlExporter composable
 *
 * Covers: file download mechanism including Blob creation,
 * URL.createObjectURL / revokeObjectURL lifecycle,
 * temporary anchor element creation and click trigger,
 * and program store integration.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  DEFAULT_EXPORT_FILENAME,
  toExportFilename,
  useHtmlExporter,
} from '@/features/ide/composables/useHtmlExporter'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: ref('en'),
  }),
}))

// -- Program store mock -------------------------------------------------------

const mockCode = ref('10 PRINT "HELLO"')

vi.mock('@/features/ide/composables/useProgramStore', () => ({
  useProgramStore: () => ({
    get code() {
      return mockCode.value
    },
  }),
}))

const MOCK_BLOB_URL = 'blob:mock-url'

// ============================================================================
// Helpers
// ============================================================================

function mountComposable() {
  return useHtmlExporter()
}

// ============================================================================
// Tests
// ============================================================================

describe('toExportFilename', () => {
  it('returns DEFAULT_EXPORT_FILENAME when title is empty string', () => {
    expect(toExportFilename('')).toEqual(DEFAULT_EXPORT_FILENAME)
  })

  it('returns DEFAULT_EXPORT_FILENAME when title is whitespace only', () => {
    expect(toExportFilename('   ')).toEqual(DEFAULT_EXPORT_FILENAME)
  })

  it('returns DEFAULT_EXPORT_FILENAME when title is tabs only', () => {
    expect(toExportFilename('\t\t')).toEqual(DEFAULT_EXPORT_FILENAME)
  })

  it('returns filename with .html extension for a normal title', () => {
    expect(toExportFilename('My Program')).toEqual('My Program.html')
  })

  it('preserves non-ASCII characters in title', () => {
    expect(toExportFilename('プログラム')).toEqual('プログラム.html')
  })

  it('trims leading and trailing whitespace from title', () => {
    expect(toExportFilename(' Hello ')).toEqual('Hello.html')
  })
})

describe('useHtmlExporter', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let createElementSpy: ReturnType<typeof vi.spyOn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>

  /** Captured anchor elements from createElement calls */
  let capturedAnchors: HTMLAnchorElement[] = []
  /** Elements appended to document.body */
  let appendedElements: Element[] = []
  /** Elements removed from document.body */
  let removedElements: Element[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    capturedAnchors = []
    appendedElements = []
    removedElements = []

    // Spy on URL methods
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_BLOB_URL)
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')

    // Spy on document.createElement to capture anchor creation
    const realCreateElement = document.createElement.bind(document)
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string) => {
        const el = realCreateElement(tag)
        if (tag === 'a') {
          capturedAnchors.push(el as HTMLAnchorElement)
        }
        return el
      },
    )

    // Spy on appendChild/removeChild to track DOM insertion
    const realAppendChild = document.body.appendChild.bind(document.body)
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(
      (node: Node) => {
        appendedElements.push(node as Element)
        return realAppendChild(node)
      },
    )

    const realRemoveChild = document.body.removeChild.bind(document.body)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(
      (node: Node) => {
        removedElements.push(node as Element)
        return realRemoveChild(node)
      },
    )
  })

  afterEach(() => {
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  // -- Download mechanism ----------------------------------------------------

  describe('download mechanism', () => {
    it('creates a Blob with HTML content type when exportHtml is called', async () => {
      const { exportHtml } = mountComposable()

      const blobSpy = vi.spyOn(globalThis, 'Blob')

      await exportHtml({
        title: 'Test Program',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(blobSpy).toHaveBeenCalledTimes(1)
      const [content, options] = blobSpy.mock.calls[0]!
      expect(options).toEqual({ type: 'text/html;charset=utf-8' })
      expect(content).toBeInstanceOf(Array)
      expect((content as string[])[0]).toContain('<!DOCTYPE html>')
      expect((content as string[])[0]).toContain('10 PRINT "HELLO"')

      blobSpy.mockRestore()
    })

    it('calls URL.createObjectURL with the blob', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: 'My Program',
        theme: 'dark',
        includeSound: true,
        includeSprites: true,
      })

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
      const blobArg = createObjectURLSpy.mock.calls[0]![0]
      expect(blobArg).toBeInstanceOf(Blob)
    })

    it('creates a temporary anchor element with download attribute set to filename', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: 'My Program',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(capturedAnchors).toHaveLength(1)
      const anchor = capturedAnchors[0]!
      expect(anchor.getAttribute('download')).toEqual('My Program.html')
      expect(anchor.getAttribute('href')).toEqual(MOCK_BLOB_URL)
    })

    it('triggers click on the anchor element', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: 'My Program',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      const anchor = capturedAnchors[0]!
      // The anchor must be appended to the body for click to work
      expect(appendedElements).toContain(anchor)
    })

    it('calls URL.revokeObjectURL for cleanup after download', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: 'My Program',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(MOCK_BLOB_URL)
    })

    it('removes the anchor element from the DOM after download', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: 'My Program',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      const anchor = capturedAnchors[0]!
      expect(removedElements).toContain(anchor)
    })
  })

  // -- Reactive state ---------------------------------------------------------

  describe('reactive state', () => {
    it('isExporting is false initially', () => {
      const { isExporting } = mountComposable()
      expect(isExporting.value).toEqual(false)
    })

    it('exportError is empty string initially', () => {
      const { exportError } = mountComposable()
      expect(exportError.value).toEqual('')
    })

    it('exportSuccess is false initially', () => {
      const { exportSuccess } = mountComposable()
      expect(exportSuccess.value).toEqual(false)
    })

    it('isExporting returns to false after successful export', async () => {
      const { isExporting, exportHtml } = mountComposable()

      await exportHtml({
        title: 'Test',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(isExporting.value).toEqual(false)
    })

    it('sets exportSuccess to true after successful export', async () => {
      const { exportSuccess, exportHtml } = mountComposable()

      await exportHtml({
        title: 'Test',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(exportSuccess.value).toEqual(true)
    })

    it('keeps exportSuccess false when a subsequent export fails', async () => {
      const { exportSuccess, exportHtml } = mountComposable()

      // First export succeeds
      await exportHtml({
        title: 'Test',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })
      expect(exportSuccess.value).toEqual(true)

      // Second export fails — success should be reset and stay false
      const savedBlob = globalThis.Blob
      class FailingBlob {
        constructor() {
          throw new Error('Second export failed')
        }
      }
      globalThis.Blob = FailingBlob as typeof Blob

      await exportHtml({
        title: 'Test2',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(exportSuccess.value).toEqual(false)
      globalThis.Blob = savedBlob
    })

    it('sets exportError when Blob creation fails', async () => {
      const { exportHtml, exportError, exportSuccess } = mountComposable()

      // Mock Blob constructor to throw — must use class syntax per vitest docs
      const savedBlob = globalThis.Blob
      class FailingBlob {
        constructor() {
          throw new Error('Blob creation failed')
        }
      }
      globalThis.Blob = FailingBlob as typeof Blob

      await exportHtml({
        title: 'Test',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      expect(exportError.value).toEqual('Blob creation failed')
      expect(exportSuccess.value).toEqual(false)
      globalThis.Blob = savedBlob
    })

    it('trims leading and trailing whitespace from title in filename', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: ' Hello ',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      const anchor = capturedAnchors[0]!
      expect(anchor.getAttribute('download')).toEqual('Hello.html')
    })

    it('uses fallback filename when title is empty string', async () => {
      const { exportHtml } = mountComposable()

      await exportHtml({
        title: '',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      const anchor = capturedAnchors[0]!
      expect(anchor.getAttribute('download')).toEqual(DEFAULT_EXPORT_FILENAME)
    })
  })

  // -- Program store integration ----------------------------------------------

  describe('program store integration', () => {
    it('reads program source from useProgramStore', async () => {
      const { exportHtml } = mountComposable()

      const blobSpy = vi.spyOn(globalThis, 'Blob')
      await exportHtml({
        title: 'Test',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      const [content] = blobSpy.mock.calls[0]!
      expect((content as string[])[0]).toContain('10 PRINT "HELLO"')
      blobSpy.mockRestore()
    })

    it('exports the current store code without requiring a source parameter', async () => {
      mockCode.value = '20 GOTO 10'
      const { exportHtml } = mountComposable()

      const blobSpy = vi.spyOn(globalThis, 'Blob')
      await exportHtml({
        title: 'Test',
        theme: 'dark',
        includeSound: false,
        includeSprites: false,
      })

      const [content] = blobSpy.mock.calls[0]!
      expect((content as string[])[0]).toContain('20 GOTO 10')
      blobSpy.mockRestore()
    })
  })
})
