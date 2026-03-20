/**
 * Monaco Editor Integration for F-BASIC with Chevrotain Parser
 *
 * This file shows how to integrate Chevrotain parser with Monaco Editor
 * for syntax highlighting (Monarch) and live error diagnostics.
 *
 * Usage:
 * 1. Install: pnpm add monaco-editor
 * 2. Import and call setupMonacoLanguage() in your Monaco setup
 * 3. Use parseWithChevrotain from FBasicChevrotainParser.ts
 */

import { useDebounceFn } from '@vueuse/core'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'

// ============================================================================
// STEP 1: Define Monarch Tokenizer for Syntax Highlighting
// ============================================================================

const monarchLanguage: monaco.languages.IMonarchLanguage = {
  // Keywords - comprehensive list matching parser-tokens.ts
  keywords: [
    // Control flow
    'IF',
    'THEN',
    'ELSE',
    'FOR',
    'TO',
    'STEP',
    'NEXT',
    'GOTO',
    'GOSUB',
    'RETURN',
    'ON',
    'OFF',
    'END',
    'STOP',
    'PAUSE',
    // I/O
    'PRINT',
    'LET',
    'INPUT',
    'LINPUT',
    'DATA',
    'READ',
    'RESTORE',
    // Variables
    'DIM',
    'SWAP',
    'CLEAR',
    // Graphics
    'CLS',
    'LOCATE',
    'COLOR',
    'CGSET',
    'CGEN',
    'PALETB',
    'PALETS',
    'PALET',
    'VIEW',
    'PSET',
    'LINE',
    'CIRCLE',
    'PAINT',
    // Sprite commands
    'DEF',
    'SPRITE',
    'MOVE',
    'CUT',
    'ERA',
    'POSITION',
    // Music
    'PLAY',
    'BEEP',
    // Comments
    'REM',
    // REPL-only (included for completeness)
    'LIST',
    'NEW',
    'RUN',
    'SAVE',
    'LOAD',
    'KEY',
    'KEYLIST',
    'CONT',
    'SYSTEM',
    // Limited utility
    'POKE',
    'PEEK',
    'FRE',
  ],

  // Functions (Family BASIC supported functions)
  functions: [
    // String functions
    'LEN',
    'LEFT$',
    'RIGHT$',
    'MID$',
    'STR$',
    'HEX$',
    'CHR$',
    'ASC',
    'SCR$',
    // Arithmetic functions
    'ABS',
    'SGN',
    'RND',
    'VAL',
    // Controller input
    'STICK',
    'STRIG',
    // Sprite query
    'XPOS',
    'YPOS',
    // Cursor position
    'CSRLIN',
    'POS',
    // Keyboard
    'INKEY$',
  ],

  // Operators (arithmetic, relational, logical)
  operators: ['+', '-', '*', '/', 'MOD', '=', '<>', '<', '>', '<=', '>=', 'AND', 'OR', 'NOT', 'XOR'],

  // Tokenizer rules (order matters - more specific patterns first)
  tokenizer: {
    root: [
      // REM lines (entire line as comment) - must come before line-number rule
      // Matches: <lineNumber> REM <comment text>
      [/^\d+\s+REM.*$/i, 'comment'],
      // Apostrophe comment lines (F-BASIC manual p.67: ' is abbreviation for REM)
      // Matches: <lineNumber> ' <comment text>
      [/^\d+\s+'.*$/, 'comment'],

      // Line numbers at start of line
      [/^\d+/, 'line-number'],

      // String literals (before operators to avoid matching quotes)
      [/"[^"]*"/, 'string'],

      // String functions with $ suffix (must come before identifiers)
      // Match function name followed by $ and optionally ( for function call
      // Note: No trailing \b because $ is not a word character
      // Pattern: LEFT$(, RIGHT$(, MID$(, STR$(, HEX$(, CHR$(, SCR$(, INKEY$
      [/\b(LEFT\$|RIGHT\$|MID\$|STR\$|HEX\$|CHR\$|SCR\$|INKEY\$)/i, 'function'],

      // Numeric functions (Family BASIC supported)
      // Match function name followed by ( for function call
      [/\b(ABS|SGN|RND|VAL|LEN|STICK|STRIG|ASC|XPOS|YPOS|POS|MOVE)(?=\s*\()/i, 'function'],

      // CSRLIN - cursor line function (no parentheses needed)
      [/\bCSRLIN\b/i, 'function'],

      // Keywords (case-insensitive)
      // Note: REM is excluded here since REM lines are handled above as comments
      // Comprehensive list matching parser-tokens.ts
      [/\b(PRINT|LET|IF|THEN|ELSE|FOR|NEXT|TO|STEP|GOTO|GOSUB|RETURN|ON|OFF|END|STOP|PAUSE|INPUT|LINPUT|DIM|DATA|READ|RESTORE|SWAP|CLEAR|CLS|LOCATE|COLOR|CGSET|CGEN|PALETB|PALETS|PALET|VIEW|PSET|LINE|CIRCLE|PAINT|DEF|SPRITE|MOVE|CUT|ERA|POSITION|PLAY|BEEP|POKE|PEEK|FRE|LIST|NEW|RUN|SAVE|LOAD|KEY|KEYLIST|CONT|SYSTEM)\b/i, 'keyword'],

      // Multi-character relational operators (must come before single-character operators)
      [/<>|<=|>=/, 'operator'],

      // Logical operators (word-based, must come before single-character operators)
      [/\b(AND|OR|NOT|XOR|MOD)\b/i, 'operator'],

      // Single-character operators
      [/[+\-*/=<>]/, 'operator'],

      // Number literals (integers only in Family BASIC)
      [/\d+/, 'number'],

      // REM comments (for REM after colon - though not valid in Family BASIC, handle gracefully)
      // Note: REM lines starting with line number are handled above
      [/REM.*$/i, 'comment'],

      // Identifiers (variables)
      [/[A-Za-z][A-Za-z0-9$]*/, 'identifier'],

      // Punctuation
      [/[(),:;]/, 'delimiter'],

      // Whitespace
      [/\s+/, 'white'],
    ],
  },
}

// ============================================================================
// STEP 2: Register Language with Monaco
// ============================================================================

export function setupMonacoLanguage(): void {
  // Register the language
  monaco.languages.register({ id: 'fbasic' })

  // Set Monarch tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider('fbasic', monarchLanguage)

  // Define custom dark theme for F-BASIC with operator and function highlighting
  monaco.editor.defineTheme('fbasic-theme', {
    base: 'vs-dark', // Base on VS dark theme
    inherit: true,
    rules: [
      { token: 'line-number', foreground: '4EC9B0', fontStyle: 'bold' }, // Cyan for line numbers
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' }, // Light blue for keywords
      { token: 'function', foreground: 'DCDCAA', fontStyle: 'bold' }, // Yellow for functions
      { token: 'operator', foreground: 'D4D4D4', fontStyle: 'bold' }, // Light gray for operators
      { token: 'string', foreground: 'CE9178' }, // Orange for strings
      { token: 'number', foreground: 'B5CEA8' }, // Light green for numbers
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' }, // Green for comments
      { token: 'identifier', foreground: '9CDCFE' }, // Light blue for identifiers
      { token: 'delimiter', foreground: 'D4D4D4' }, // Light gray for punctuation
    ],
    colors: {},
  })

  // Define custom light theme for F-BASIC
  monaco.editor.defineTheme('fbasic-theme-light', {
    base: 'vs', // Base on VS light theme
    inherit: true,
    rules: [
      { token: 'line-number', foreground: '4A7C2E', fontStyle: 'bold' }, // Dark green for line numbers
      { token: 'keyword', foreground: '0066CC', fontStyle: 'bold' }, // Blue for keywords
      { token: 'function', foreground: 'B8945A', fontStyle: 'bold' }, // Brown/orange for functions
      { token: 'operator', foreground: '333333', fontStyle: 'bold' }, // Dark gray for operators
      { token: 'string', foreground: 'B85454' }, // Red for strings
      { token: 'number', foreground: '5A7C4A' }, // Green for numbers
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' }, // Green for comments
      { token: 'identifier', foreground: '1E1E1E' }, // Dark for identifiers
      { token: 'delimiter', foreground: '333333' }, // Dark gray for punctuation
    ],
    colors: {},
  })

  // ============================================================================
  // STEP 3: Set up Live Error Diagnostics Provider
  // ============================================================================

  // Register diagnostics provider for live error marking
  monaco.languages.registerDocumentFormattingEditProvider('fbasic', {
    provideDocumentFormattingEdits: () => {
      // Optional: Add code formatting
      return []
    },
  })

  // Hover provider disabled - generic tooltip not useful for F-BASIC
  // Can be re-enabled later with proper keyword/function documentation

  // Register completion provider (optional)
  monaco.languages.registerCompletionItemProvider('fbasic', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: 'PRINT',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'PRINT ',
          documentation: 'Print statement',
          range,
        },
        {
          label: 'LET',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'LET ',
          documentation: 'Variable assignment',
          range,
        },
        {
          label: 'IF',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'IF ',
          documentation: 'Conditional statement',
          range,
        },
        {
          label: 'FOR',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'FOR ',
          documentation: 'For loop',
          range,
        },
        // Add more keywords...
      ]
      return { suggestions }
    },
  })
}

// ============================================================================
// STEP 4: Convert Chevrotain Errors to Monaco Diagnostics
// ============================================================================

/**
 * Convert parse errors to Monaco Editor diagnostics
 */
export function convertToMonacoDiagnostics(
  errors: Array<{
    message: string
    line?: number
    column?: number
    length?: number
    location?: { start: { line?: number; column?: number } }
  }>,
  _model: monaco.editor.ITextModel
): monaco.editor.IMarkerData[] {
  return errors.map(error => {
    // Extract line/column from error (support both formats)
    const line = error.line ?? error.location?.start?.line ?? 1
    const column = error.column ?? error.location?.start?.column ?? 1
    const length = error.length ?? 1

    return {
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: line,
      startColumn: column,
      endLineNumber: line,
      endColumn: column + length,
      message: error.message,
      source: 'F-BASIC Parser',
    }
  })
}

// ============================================================================
// STEP 5: Set up Live Error Checking
// ============================================================================

/**
 * Set up live error checking for a Monaco editor instance
 * This will update diagnostics as the user types
 */
export function setupLiveErrorChecking(editor: monaco.editor.IStandaloneCodeEditor): void {
  const model = editor.getModel()
  if (!model) return

  // Function to update diagnostics
  const updateDiagnostics = () => {
    const source = model.getValue()

    // Use Chevrotain parser directly
    const parseResult = parseWithChevrotain(source)

    if (!parseResult.success && parseResult.errors) {
      // Convert errors to Monaco diagnostics
      const diagnostics = convertToMonacoDiagnostics(parseResult.errors, model)
      monaco.editor.setModelMarkers(model, 'fbasic', diagnostics)
    } else {
      // Clear errors if parsing succeeds
      monaco.editor.setModelMarkers(model, 'fbasic', [])
    }
  }

  // Use VueUse's useDebounceFn for debounced parsing
  const debouncedUpdateDiagnostics = useDebounceFn(updateDiagnostics, 300)

  // Listen for content changes
  model.onDidChangeContent(() => {
    void debouncedUpdateDiagnostics()
  })

  // Initial parse
  void updateDiagnostics()
}

// ============================================================================
// STEP 6: Complete Integration Example
// ============================================================================

/**
 * Complete example of setting up Monaco Editor with F-BASIC language support
 */
export function createMonacoEditor(
  container: HTMLElement,
  initialValue: string = ''
): monaco.editor.IStandaloneCodeEditor {
  if (!container) {
    throw new Error('Container element is required')
  }

  // Setup language (call once)
  setupMonacoLanguage()

  // Create editor
  const editor = monaco.editor.create(container, {
    value: initialValue,
    language: 'fbasic',
    theme: 'fbasic-theme', // Use custom F-BASIC theme
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    cursorStyle: 'line',
    wordWrap: 'on',
  })

  // Setup live error checking
  setupLiveErrorChecking(editor)

  return editor
}
