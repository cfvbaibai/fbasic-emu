<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'LessonContent',
})

const props = withDefaults(
  defineProps<{
    content?: string
  }>(),
  {
    content: '',
  },
)

const emit = defineEmits<{
  (e: 'tryCode', code: string): void
}>()

const { t } = useI18n()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodeBlockData {
  id: number
  code: string
}

// ---------------------------------------------------------------------------
// Markdown Parsing
// ---------------------------------------------------------------------------

let blockIdCounter = 0

function resetBlockIdCounter(): void {
  blockIdCounter = 0
}

/**
 * Parses a subset of markdown into an array of segments.
 *
 * Each segment is either:
 * - An HTML string (for headings, paragraphs, inline formatting)
 * - A code block object (for fenced code blocks)
 *
 * Supported markdown syntax:
 * - Headings: # ## ###
 * - Paragraphs (separated by blank lines)
 * - Bold: **text**
 * - Italic: *text*
 * - Inline code: `code`
 * - Fenced code blocks: ```lang ... ```
 */
function parseMarkdown(markdown: string): Array<{ html: string } | { codeBlock: CodeBlockData }> {
  const segments: Array<{ html: string } | { codeBlock: CodeBlockData }> = []

  // Extract fenced code blocks first
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const codeBlocks: CodeBlockData[] = []
  let processed = markdown.replace(codeBlockRegex, (_match, _lang, code: string) => {
    const id = ++blockIdCounter
    const trimmedCode = code.trim()
    if (trimmedCode.length > 0) {
      codeBlocks.push({ id, code: trimmedCode })
    }
    return `\n\n<!--CODE_BLOCK_${id}-->\n\n`
  })

  // Split into lines for block-level processing
  const lines = processed.split('\n')
  const htmlParts: string[] = []
  let inParagraph = false
  let currentParagraph = ''

  function flushParagraph(): void {
    if (currentParagraph.trim().length > 0) {
      htmlParts.push(`<p>${formatInline(currentParagraph.trim())}</p>`)
    }
    currentParagraph = ''
    inParagraph = false
  }

  function flushHtml(): void {
    const html = htmlParts.join('\n')
    if (html.length > 0) {
      segments.push({ html })
    }
    htmlParts.length = 0
  }

  for (const rawLine of lines) {
    const line: string = rawLine ?? ''

    // Check for code block placeholder
    const placeholderMatch = line.match(/^<!--CODE_BLOCK_(\d+)-->$/)
    if (placeholderMatch) {
      flushParagraph()
      flushHtml()
      const blockId = Number(placeholderMatch[1])
      const block = codeBlocks.find((b) => b.id === blockId)
      if (block) {
        segments.push({ codeBlock: block })
      }
      continue
    }

    // Check for headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      const hashes = headingMatch[1] ?? ''
      const text = headingMatch[2] ?? ''
      const level = hashes.length
      htmlParts.push(`<h${level}>${formatInline(text)}</h${level}>`)
      continue
    }

    // Blank line ends paragraph
    if (line.trim() === '') {
      flushParagraph()
      continue
    }

    // Regular text line
    if (inParagraph) {
      currentParagraph += ' ' + line.trim()
    } else {
      currentParagraph = line.trim()
      inParagraph = true
    }
  }

  flushParagraph()
  flushHtml()

  return segments
}

/**
 * Formats inline markdown: **bold**, *italic*, `code`.
 */
function formatInline(text: string): string {
  // Escape HTML entities first
  let result = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Inline code (must come before bold/italic to avoid conflicts)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold: **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic: *text*
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  return result
}

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const segments = computed(() => {
  resetBlockIdCounter()
  return parseMarkdown(props.content)
})

const codeBlocks = computed(() =>
  segments.value.filter((s): s is { codeBlock: CodeBlockData } => 'codeBlock' in s).map((s) => s.codeBlock),
)

function handleTryCode(blockId: number): void {
  const block = codeBlocks.value.find((b) => b.id === blockId)
  if (block) {
    emit('tryCode', block.code)
  }
}
</script>

<template>
  <div
    class="lesson-content"
    data-testid="lesson-content"
  >
    <template
      v-for="(segment, index) in segments"
      :key="index"
    >
      <!-- HTML segment: parsed markdown rendered as HTML -->
      <div
        v-if="'html' in segment"
        class="lesson-content-html"
        v-html="segment.html"
      />
      <!-- Code block segment: rendered with pre/code + Try It button -->
      <div
        v-else
        class="lesson-content-code-block"
      >
        <pre class="lesson-content-pre"><code>{{ segment.codeBlock.code }}</code></pre>
        <div class="lesson-content-try-it">
          <button
            class="lesson-content-try-it-button"
            data-testid="lesson-try-it-button"
            @click="handleTryCode(segment.codeBlock.id)"
          >
            {{ t('ide.tutorial.tryIt') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lesson-content {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--game-text-primary);
}

.lesson-content-html {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.lesson-content-html :deep(h1),
.lesson-content-html :deep(h2),
.lesson-content-html :deep(h3) {
  margin: 0 0 0.375rem;
  font-weight: 600;
  line-height: 1.3;
}

.lesson-content-html :deep(h1) {
  font-size: 1rem;
}

.lesson-content-html :deep(h2) {
  font-size: 0.925rem;
}

.lesson-content-html :deep(h3) {
  font-size: 0.85rem;
}

.lesson-content-html :deep(p) {
  margin: 0 0 0.5rem;
}

.lesson-content-html :deep(p:last-child) {
  margin-bottom: 0;
}

.lesson-content-html :deep(code) {
  font-family: monospace;
  font-size: 0.8em;
  padding: 0.1em 0.25em;
  background: var(--game-surface-bg-start);
  border: 1px solid var(--game-surface-border);
  border-radius: 3px;
}

.lesson-content-code-block {
  margin-bottom: 0.75rem;
}

.lesson-content-pre {
  margin: 0 0 0.25rem;
  padding: 0.5rem;
  overflow-x: auto;
  background: var(--game-surface-bg-start);
  border: 1px solid var(--game-surface-border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8em;
  white-space: pre;
}

.lesson-content-try-it {
  display: flex;
  justify-content: flex-end;
}

.lesson-content-try-it-button {
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--base-solid-primary);
  border-radius: 4px;
  background: transparent;
  color: var(--base-solid-primary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.lesson-content-try-it-button:hover {
  background: var(--base-alpha-primary-10);
}

.lesson-content-try-it-button:focus-visible {
  outline: 2px solid var(--base-solid-primary);
  outline-offset: 2px;
}
</style>
