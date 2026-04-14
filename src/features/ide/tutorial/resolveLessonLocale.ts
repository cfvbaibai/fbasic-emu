/**
 * resolveLessonLocale — locale-aware lesson content resolution.
 *
 * Provides a pure utility function that resolves the correct
 * title and content for a lesson based on the current locale,
 * falling back to the base (English) values when no translation
 * is available.
 */

import type { Lesson, LessonTranslations } from './types'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolved lesson content with locale-aware title and body.
 */
export interface ResolvedLessonContent {
  title: string
  content: string
}

/**
 * Resolves the title and content for a lesson in the given locale.
 *
 * Lookup strategy:
 * 1. If `lesson.translations[locale]` exists, use its `title` and `content`.
 * 2. Otherwise, fall back to the base `lesson.title` and `lesson.content`.
 *
 * @param lesson - The lesson data (base + optional translations).
 * @param locale - The current locale identifier (e.g. `'ja'`, `'zh-CN'`).
 * @returns An object with the resolved `title` and `content`.
 */
export function resolveLessonLocale(
  lesson: Lesson,
  locale: string,
): ResolvedLessonContent {
  const translation = getTranslation(lesson, locale)
  if (translation) {
    return {
      title: translation.title,
      content: translation.content,
    }
  }

  return {
    title: lesson.title,
    content: lesson.content,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves the translation for the given locale, or `undefined` if none.
 */
function getTranslation(
  lesson: Lesson,
  locale: string,
): LessonTranslations | undefined {
  return lesson.translations?.[locale]
}
