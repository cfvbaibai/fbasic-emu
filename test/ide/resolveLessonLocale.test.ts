/**
 * Tests for resolveLessonLocale utility.
 */

import { describe, expect, it } from 'vitest'

import { resolveLessonLocale } from '@/features/ide/tutorial/resolveLessonLocale'
import type { Lesson } from '@/features/ide/tutorial/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLesson(
  overrides: Partial<Lesson> = {},
): Lesson {
  return {
    title: 'English Title',
    content: 'English content body.',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveLessonLocale', () => {
  it('returns translated title and content when locale translation exists', () => {
    const lesson = makeLesson({
      translations: {
        ja: {
          title: '日本語タイトル',
          content: '日本語のコンテンツ本文。',
        },
      },
    })

    const result = resolveLessonLocale(lesson, 'ja')

    expect(result).toEqual({
      title: '日本語タイトル',
      content: '日本語のコンテンツ本文。',
    })
  })

  it('returns base title and content when locale translation is missing', () => {
    const lesson = makeLesson({
      title: 'English Title',
      content: 'English content body.',
      translations: {
        ja: {
          title: '日本語タイトル',
          content: '日本語のコンテンツ本文。',
        },
      },
    })

    const result = resolveLessonLocale(lesson, 'zh-CN')

    expect(result).toEqual({
      title: 'English Title',
      content: 'English content body.',
    })
  })

  it('returns base title and content when translations field is undefined', () => {
    const lesson = makeLesson({
      title: 'Fallback Title',
      content: 'Fallback content.',
    })

    const result = resolveLessonLocale(lesson, 'ja')

    expect(result).toEqual({
      title: 'Fallback Title',
      content: 'Fallback content.',
    })
  })
})
