/**
 * Tutorial lesson data types.
 *
 * Defines the structure for lesson content consumed by
 * LessonContent.vue and indexed by useTutorial.ts.
 */

/**
 * Represents a single tutorial lesson.
 *
 * Each lesson contains a title for navigation display and
 * markdown content that may include headings, paragraphs,
 * inline formatting, and fenced code blocks.
 */
export interface Lesson {
  /** Display title shown in the lesson navigation. */
  title: string

  /**
   * Markdown content for the lesson body.
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
}
