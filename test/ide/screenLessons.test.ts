/**
 * Tests for screen tutorial lesson data files.
 *
 * Validates the Lesson interface, lesson structure,
 * content completeness, and F-BASIC syntax correctness.
 */

import { describe, expect, it } from 'vitest'

import { screenLessons } from '@/features/ide/tutorial/index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Keywords expected in each screen lesson's code blocks.
 * Mapped by lesson index to the primary F-BASIC keyword
 * that lesson teaches.
 */
const LESSON_KEYWORDS: Array<RegExp> = [
  /\bCLS\b/,
  /\bCOLOR\b/,
  /\bLOCATE\b/,
]

/**
 * Extracts all fenced code block contents from a markdown string.
 */
function extractCodeBlocks(markdown: string): string[] {
  const blocks: string[] = []
  const regex = /```(?:\w*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(markdown)) !== null) {
    const code = match[1]?.trim()
    if (code != null && code.length > 0) {
      blocks.push(code)
    }
  }
  return blocks
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('screenLessons', () => {
  it('exports an array of exactly 3 lessons', () => {
    expect(screenLessons).toHaveLength(3)
  })

  it('each entry satisfies the Lesson interface', () => {
    for (const lesson of screenLessons) {
      expect(typeof lesson.title).toEqual('string')
      expect(typeof lesson.content).toEqual('string')
    }
  })

  it('each lesson has a non-empty title', () => {
    const expectedTitles = ['CLS', 'COLOR', 'LOCATE']

    for (let i = 0; i < screenLessons.length; i++) {
      const lesson = screenLessons[i]!
      expect(lesson.title.length).toBeGreaterThan(0)
      expect(lesson.title).toEqual(expectedTitles[i])
    }
  })

  it('each lesson has non-empty content', () => {
    for (const lesson of screenLessons) {
      expect(lesson.content.length).toBeGreaterThan(0)
    }
  })

  it('each lesson contains at least one fenced code block', () => {
    for (const lesson of screenLessons) {
      const blocks = extractCodeBlocks(lesson.content)
      expect(blocks.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('code blocks contain expected F-BASIC keywords', () => {
    for (let i = 0; i < screenLessons.length; i++) {
      const lesson = screenLessons[i]!
      const blocks = extractCodeBlocks(lesson.content)
      const allCode = blocks.join('\n')
      const keyword = LESSON_KEYWORDS[i]!
      expect(allCode).toMatch(keyword)
    }
  })

  it('all lessons export const values are usable independently', async () => {
    const { lesson6Cls } = await import(
      '@/features/ide/tutorial/lessons/lesson6Cls'
    )
    const { lesson7Color } = await import(
      '@/features/ide/tutorial/lessons/lesson7Color'
    )
    const { lesson8Locate } = await import(
      '@/features/ide/tutorial/lessons/lesson8Locate'
    )

    expect(lesson6Cls.title).toEqual('CLS')
    expect(lesson7Color.title).toEqual('COLOR')
    expect(lesson8Locate.title).toEqual('LOCATE')
  })

  it('CLS lesson explains clearing the screen', () => {
    const lesson = screenLessons[0]!
    expect(lesson.content).toContain('CLS')
    expect(lesson.content).toMatch(/clear/i)
  })

  it('COLOR lesson explains color patterns', () => {
    const lesson = screenLessons[1]!
    expect(lesson.content).toContain('COLOR')
    expect(lesson.content).toMatch(/color/i)
  })

  it('LOCATE lesson explains cursor positioning', () => {
    const lesson = screenLessons[2]!
    expect(lesson.content).toContain('LOCATE')
    expect(lesson.content).toMatch(/cursor/i)
  })
})
