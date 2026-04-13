/**
 * Tests for basics tutorial lesson data files.
 *
 * Validates the Lesson interface, lesson structure,
 * content completeness, and F-BASIC syntax correctness.
 */

import { describe, expect, it } from 'vitest'

import { basicsLessons } from '@/features/ide/tutorial/index'
import type { Lesson } from '@/features/ide/tutorial/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Keywords expected in each lesson's code blocks.
 * Mapped by lesson index to the primary F-BASIC keyword
 * that lesson teaches.
 */
const LESSON_KEYWORDS: Array<RegExp> = [
  /\bPRINT\b/,
  /\bPRINT\b/,
  /\bINPUT\b/,
  /\bIF\b.*\bTHEN\b/,
  /\bFOR\b.*\bTO\b/,
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

describe('basicsLessons', () => {
  it('exports an array of exactly 5 lessons', () => {
    expect(basicsLessons).toHaveLength(5)
  })

  it('each entry satisfies the Lesson interface', () => {
    for (const lesson of basicsLessons) {
      expect(typeof lesson.title).toEqual('string')
      expect(typeof lesson.content).toEqual('string')
    }
  })

  it('each lesson has a non-empty title', () => {
    const expectedTitles = ['PRINT', 'Variables', 'INPUT', 'IF / THEN', 'FOR / NEXT']

    for (let i = 0; i < basicsLessons.length; i++) {
      const lesson = basicsLessons[i]!
      expect(lesson.title.length).toBeGreaterThan(0)
      expect(lesson.title).toEqual(expectedTitles[i])
    }
  })

  it('each lesson has non-empty content', () => {
    for (const lesson of basicsLessons) {
      expect(lesson.content.length).toBeGreaterThan(0)
    }
  })

  it('each lesson contains at least one fenced code block', () => {
    for (const lesson of basicsLessons) {
      const blocks = extractCodeBlocks(lesson.content)
      expect(blocks.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('code blocks contain expected F-BASIC keywords', () => {
    for (let i = 0; i < basicsLessons.length; i++) {
      const lesson = basicsLessons[i]!
      const blocks = extractCodeBlocks(lesson.content)
      const allCode = blocks.join('\n')
      const keyword = LESSON_KEYWORDS[i]!
      expect(allCode).toMatch(keyword)
    }
  })

  it('Lesson interface can be imported and used for type annotation', () => {
    const lesson: Lesson = {
      title: 'Test',
      content: '```basic\n10 PRINT "HI"\n```',
    }
    expect(lesson.title).toEqual('Test')
    expect(lesson.content).toContain('PRINT')
  })

  it('all lessons export const values are usable independently', async () => {
    const { lesson1Print } = await import(
      '@/features/ide/tutorial/lessons/lesson1Print'
    )
    const { lesson2Variables } = await import(
      '@/features/ide/tutorial/lessons/lesson2Variables'
    )
    const { lesson3Input } = await import(
      '@/features/ide/tutorial/lessons/lesson3Input'
    )
    const { lesson4IfThen } = await import(
      '@/features/ide/tutorial/lessons/lesson4IfThen'
    )
    const { lesson5ForNext } = await import(
      '@/features/ide/tutorial/lessons/lesson5ForNext'
    )

    expect(lesson1Print.title).toEqual('PRINT')
    expect(lesson2Variables.title).toEqual('Variables')
    expect(lesson3Input.title).toEqual('INPUT')
    expect(lesson4IfThen.title).toEqual('IF / THEN')
    expect(lesson5ForNext.title).toEqual('FOR / NEXT')
  })
})
