/**
 * Tutorial lesson data types.
 *
 * Defines the structure for lesson content consumed by
 * LessonContent.vue and indexed by useTutorial.ts.
 */

/**
 * Localized title and content for a single lesson.
 *
 * Used by the optional `translations` field on {@link Lesson}
 * to provide per-locale overrides without modifying the
 * base (English) lesson data.
 */
export interface LessonTranslations {
  /** Localized display title shown in the lesson navigation. */
  title: string

  /**
   * Localized markdown content for the lesson body.
   *
   * Must follow the same markdown syntax as the base `content` field
   * on {@link Lesson}.
   */
  content: string
}

/**
 * Represents a single tutorial lesson.
 *
 * Each lesson contains a title for navigation display and
 * markdown content that may include headings, paragraphs,
 * inline formatting, and fenced code blocks.
 *
 * Translations are optional and keyed by locale identifier
 * (e.g. `'ja'`, `'zh-CN'`, `'zh-TW'`). When a translation
 * for the current locale is available, it takes precedence
 * over the base `title` and `content`. Use
 * {@link resolveLessonLocale} to resolve the correct values.
 */
export interface Lesson {
  /** Display title shown in the lesson navigation (English default). */
  title: string

  /**
   * Markdown content for the lesson body (English default).
   *
   * Supported syntax:
   * - Headings: `#` `##` `###`
   * - Paragraphs (separated by blank lines)
   * - Bold: `**text**`
   * - Italic: `*text*`
   * - Inline code: `` `code` ``
   * - Fenced code blocks: ` ```basic ... ``` `
   *
   * Code blocks render with a "Try It" button that
   * allows users to load the code into the editor.
   */
  content: string

  /**
   * Optional per-locale translations keyed by locale identifier.
   *
   * Example: `{ 'ja': { title: '...', content: '...' } }`
   *
   * When omitted, the base `title` and `content` serve as the
   * fallback for all locales.
   */
  translations?: Record<string, LessonTranslations>
}
