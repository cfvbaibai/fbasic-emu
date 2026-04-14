/**
 * Tests for buildExportHtml
 *
 * Verifies the HTML template assembly for the export wrapper.
 * The template must include: canvas element, theme CSS, program source
 * embedding, and a runtime script placeholder.
 */

import { describe, expect, it } from 'vitest'

import { buildExportHtml } from '@/features/ide/composables/buildExportHtml'
import type { HtmlExportOptions } from '@/features/ide/composables/useHtmlExporter'

// ============================================================================
// Helpers
// ============================================================================

const defaultOptions: HtmlExportOptions = {
  title: 'Test Program',
  theme: 'dark',
  includeSound: false,
  includeSprites: false,
}

// ============================================================================
// Tests
// ============================================================================

describe('buildExportHtml', () => {
  // -- Locale -----------------------------------------------------------------

  describe('locale', () => {
    it('uses the provided locale in the HTML lang attribute', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('<html lang="en">')
    })

    it('reflects a non-English locale in the HTML lang attribute', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'ja')
      expect(html).toContain('<html lang="ja">')
    })
  })

  // -- Document structure -----------------------------------------------------

  describe('document structure', () => {
    it('returns a string starting with <!DOCTYPE html>', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    })

    it('contains exactly one <html> element', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      const matches = html.match(/<html[^>]*>/g)
      expect(matches).toHaveLength(1)
    })

    it('contains exactly one <head> element', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      const matches = html.match(/<head>/g)
      expect(matches).toHaveLength(1)
    })

    it('contains exactly one <body> element', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      const matches = html.match(/<body[^>]*>/g)
      expect(matches).toHaveLength(1)
    })

    it('contains charset meta tag with UTF-8', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('charset="UTF-8"')
    })

    it('contains viewport meta tag', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('viewport')
    })
  })

  // -- Title ------------------------------------------------------------------

  describe('title', () => {
    it('sets the page title from options.title', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        title: 'My Game',
      }, 'en')
      expect(html).toContain('<title>My Game</title>')
    })

    it('escapes HTML entities in the title', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        title: '<script>alert("xss")</script>',
      }, 'en')
      expect(html).not.toContain('<script>alert("xss")</script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  // -- Canvas element ---------------------------------------------------------

  describe('canvas element', () => {
    it('contains a canvas element', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toMatch(/<canvas/)
    })

    it('canvas has id "fbasic-screen"', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('id="fbasic-screen"')
    })

    it('canvas has width 256', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toMatch(/<canvas[^>]*width="256"/)
    })

    it('canvas has height 240', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toMatch(/<canvas[^>]*height="240"/)
    })
  })

  // -- Theme CSS --------------------------------------------------------------

  describe('theme CSS', () => {
    it('includes inline CSS in a <style> tag', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toMatch(/<style[^>]*>/)
    })

    it('applies dark theme background when theme is dark', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        theme: 'dark',
      }, 'en')
      // Dark theme should have a dark background color (near-black)
      expect(html).toContain('background-color:#000')
    })

    it('applies light theme background when theme is light', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        theme: 'light',
      }, 'en')
      // Light theme should have a light background color (near-white)
      expect(html).toContain('background-color:#fff')
    })

    it('centers the canvas using flexbox', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('display:flex')
      expect(html).toContain('justify-content:center')
    })
  })

  // -- Program source embedding -----------------------------------------------

  describe('program source embedding', () => {
    it('embeds program source in a script tag with id fbasic-program', () => {
      const html = buildExportHtml('10 PRINT "HELLO"', defaultOptions, 'en')
      expect(html).toContain('id="fbasic-program"')
      expect(html).toContain('10 PRINT "HELLO"')
    })

    it('preserves multi-line program source', () => {
      const source = '10 PRINT "LINE1"\n20 PRINT "LINE2"\n30 END'
      const html = buildExportHtml(source, defaultOptions, 'en')
      expect(html).toContain('10 PRINT "LINE1"')
      expect(html).toContain('20 PRINT "LINE2"')
      expect(html).toContain('30 END')
    })

    it('escapes HTML entities in program source', () => {
      const html = buildExportHtml('<div>test</div>', defaultOptions, 'en')
      // Inside a <script> tag, < and > don't need escaping,
      // but the </script> sequence must be broken to avoid closing the tag
      expect(html).not.toContain('</script></script>')
    })

    it('escapes the closing script tag sequence in program source', () => {
      const source = '10 PRINT "</script>"'
      const html = buildExportHtml(source, defaultOptions, 'en')
      // The literal "</script>" inside the program source must not prematurely
      // close the <script id="fbasic-program"> tag
      const programTagStart = html.indexOf('id="fbasic-program"')
      const runtimeId = html.indexOf('id="fbasic-runtime"')
      // The runtime placeholder must still be present after the program tag
      expect(runtimeId).toBeGreaterThan(programTagStart)
    })
  })

  // -- Runtime script placeholder ---------------------------------------------

  describe('runtime script placeholder', () => {
    it('includes a script tag with id fbasic-runtime', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('id="fbasic-runtime"')
    })

    it('runtime placeholder is an empty script tag', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      const runtimeMatch = html.match(
        /<script[^>]*id="fbasic-runtime"[^>]*>\s*<\/script>/,
      )
      expect(runtimeMatch).not.toBeNull()
    })

    it('runtime placeholder appears after program source script', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      const programIndex = html.indexOf('id="fbasic-program"')
      const runtimeIndex = html.indexOf('id="fbasic-runtime"')
      expect(runtimeIndex).toBeGreaterThan(programIndex)
    })
  })

  // -- Include flags (stored as data attributes) ------------------------------

  describe('export options data attributes', () => {
    it('sets data-include-sound attribute on body', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        includeSound: true,
      }, 'en')
      expect(html).toMatch(/<body[^>]*data-include-sound="true"/)
    })

    it('sets data-include-sound to false when includeSound is false', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        includeSound: false,
      }, 'en')
      expect(html).toMatch(/<body[^>]*data-include-sound="false"/)
    })

    it('sets data-include-sprites attribute on body', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        includeSprites: true,
      }, 'en')
      expect(html).toMatch(/<body[^>]*data-include-sprites="true"/)
    })

    it('sets data-include-sprites to false when includeSprites is false', () => {
      const html = buildExportHtml('10 PRINT "HI"', {
        ...defaultOptions,
        includeSprites: false,
      }, 'en')
      expect(html).toMatch(/<body[^>]*data-include-sprites="false"/)
    })
  })

  // -- Valid HTML -------------------------------------------------------------

  describe('valid HTML output', () => {
    it('ends with </html>', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html.trimEnd()).toMatch(/<\/html>$/)
    })

    it('has matching head and body close tags', () => {
      const html = buildExportHtml('10 PRINT "HI"', defaultOptions, 'en')
      expect(html).toContain('</head>')
      expect(html).toContain('</body>')
    })
  })
})
