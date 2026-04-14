/**
 * Shared Test Helper: extractCodeBlocks
 *
 * Extracts all fenced code block contents from a markdown string.
 * Used by tutorial lesson tests to validate F-BASIC code examples.
 */

/**
 * Extracts all fenced code block contents from a markdown string.
 *
 * Matches standard fenced code blocks (```language\n...\n```) and
 * returns an array of trimmed code strings, skipping empty blocks.
 */
export function extractCodeBlocks(markdown: string): string[] {
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
