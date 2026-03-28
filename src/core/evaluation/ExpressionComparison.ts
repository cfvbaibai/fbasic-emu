/**
 * Expression Comparison Helpers
 *
 * Standalone comparison logic for expression evaluation.
 * Extracted from ExpressionEvaluator.ts for modularity.
 */

/**
 * Check if a value is a numeric string (parseable as a finite number).
 * Integer-only strings like "42" or "-7" return true.
 * Strings like "3.14", "hello", "" return false.
 */
function isNumericString(value: string): boolean {
  if (value.length === 0) return false
  return /^-?\d+$/.test(value)
}

/**
 * Compare two values using the given operator.
 * Returns -1 for true, 0 for false (per Family BASIC spec).
 *
 * Comparison rules:
 * - number vs number: numeric comparison
 * - string vs string: lexicographic comparison
 * - number vs string (or string vs number): if the string is a valid integer,
 *   do numeric comparison; otherwise fall back to string comparison
 */
export function compareValues(
  leftValue: number | string,
  rightValue: number | string,
  operator: '=' | '<>' | '<' | '>' | '<=' | '>='
): number {
  const leftIsString = typeof leftValue === 'string'
  const rightIsString = typeof rightValue === 'string'

  // Mixed types: number vs string — try numeric comparison if string is numeric
  if (leftIsString !== rightIsString) {
    const strValue = leftIsString ? (leftValue) : (rightValue as string)
    if (isNumericString(strValue)) {
      const leftNum = Number(leftValue)
      const rightNum = Number(rightValue)
      switch (operator) {
        case '=': return leftNum === rightNum ? -1 : 0
        case '<>': return leftNum !== rightNum ? -1 : 0
        case '<': return leftNum < rightNum ? -1 : 0
        case '>': return leftNum > rightNum ? -1 : 0
        case '<=': return leftNum <= rightNum ? -1 : 0
        case '>=': return leftNum >= rightNum ? -1 : 0
      }
    }
    // Non-numeric string vs number: fall through to string comparison
  }

  // Both strings, or mixed with non-numeric string — lexicographic comparison
  if (leftIsString || rightIsString) {
    const leftStr = String(leftValue)
    const rightStr = String(rightValue)
    switch (operator) {
      case '=': return leftStr === rightStr ? -1 : 0
      case '<>': return leftStr !== rightStr ? -1 : 0
      case '<': return leftStr < rightStr ? -1 : 0
      case '>': return leftStr > rightStr ? -1 : 0
      case '<=': return leftStr <= rightStr ? -1 : 0
      case '>=': return leftStr >= rightStr ? -1 : 0
    }
  }

  // Both numbers — numeric comparison
  const leftNum = Number(leftValue)
  const rightNum = Number(rightValue)
  switch (operator) {
    case '=': return leftNum === rightNum ? -1 : 0
    case '<>': return leftNum !== rightNum ? -1 : 0
    case '<': return leftNum < rightNum ? -1 : 0
    case '>': return leftNum > rightNum ? -1 : 0
    case '<=': return leftNum <= rightNum ? -1 : 0
    case '>=': return leftNum >= rightNum ? -1 : 0
  }
  return 0
}
