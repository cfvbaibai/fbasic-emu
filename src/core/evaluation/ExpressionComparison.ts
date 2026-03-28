/**
 * Expression Comparison Helpers
 *
 * Standalone comparison logic for expression evaluation.
 * Extracted from ExpressionEvaluator.ts for modularity.
 */

/** Regex matching strings that represent numeric values (integer or decimal). */
const NUMERIC_STRING_REGEX = /^-?\d+(\.\d+)?$/

/**
 * Check if a value is a string that represents a numeric value.
 * Accepts integer strings ("42", "-7") and decimal strings ("3.14", "-0.5").
 */
export function isNumericString(value: number | string): value is string {
  return typeof value === 'string' && NUMERIC_STRING_REGEX.test(value)
}

/** Compare two numbers using the given operator. Returns -1 for true, 0 for false. */
function compareNumbers(
  left: number,
  right: number,
  operator: '=' | '<>' | '<' | '>' | '<=' | '>='
): number {
  switch (operator) {
    case '=': return left === right ? -1 : 0
    case '<>': return left !== right ? -1 : 0
    case '<': return left < right ? -1 : 0
    case '>': return left > right ? -1 : 0
    case '<=': return left <= right ? -1 : 0
    case '>=': return left >= right ? -1 : 0
  }
}

/** Compare two strings lexicographically using the given operator. Returns -1 for true, 0 for false. */
function compareStrings(
  left: string,
  right: string,
  operator: '=' | '<>' | '<' | '>' | '<=' | '>='
): number {
  switch (operator) {
    case '=': return left === right ? -1 : 0
    case '<>': return left !== right ? -1 : 0
    case '<': return left < right ? -1 : 0
    case '>': return left > right ? -1 : 0
    case '<=': return left <= right ? -1 : 0
    case '>=': return left >= right ? -1 : 0
  }
}

/**
 * Compare two values using the given operator.
 * Returns -1 for true, 0 for false (per Family BASIC spec).
 *
 * Comparison rules:
 * - number vs number: numeric comparison
 * - string vs string: lexicographic comparison
 * - number vs string (or string vs number): if the string is a valid numeric
 *   string (integer or decimal), do numeric comparison; otherwise fall back to
 *   lexicographic string comparison
 */
export function compareValues(
  leftValue: number | string,
  rightValue: number | string,
  operator: '=' | '<>' | '<' | '>' | '<=' | '>='
): number {
  // Both numbers: numeric comparison
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return compareNumbers(leftValue, rightValue, operator)
  }

  // Mixed type: check if the string operand is a numeric string
  if (typeof leftValue === 'number' && isNumericString(rightValue)) {
    return compareNumbers(leftValue, Number(rightValue), operator)
  }
  if (typeof rightValue === 'number' && isNumericString(leftValue)) {
    return compareNumbers(Number(leftValue), rightValue, operator)
  }

  // Both strings, or mixed type with non-numeric string: lexicographic comparison
  return compareStrings(String(leftValue), String(rightValue), operator)
}
