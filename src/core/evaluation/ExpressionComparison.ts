/**
 * Expression Comparison Helpers
 *
 * Standalone comparison logic for expression evaluation.
 * Extracted from ExpressionEvaluator.ts for modularity.
 */

/**
 * Compare two values using the given operator.
 * Returns -1 for true, 0 for false (per Family BASIC spec).
 * String comparisons are lexicographic.
 */
export function compareValues(
  leftValue: number | string,
  rightValue: number | string,
  operator: '=' | '<>' | '<' | '>' | '<=' | '>='
): number {
  if (typeof leftValue === 'string' || typeof rightValue === 'string') {
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
  } else {
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
  return 0
}
