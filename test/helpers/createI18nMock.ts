/**
 * Creates a mock `t` translation function that looks up keys in the provided
 * messages map and performs simple `{param}` interpolation.
 *
 * @param messages - A map from i18n key to translated string (may contain
 *                   `{placeholder}` tokens).
 * @returns A `t` function with the same signature as vue-i18n's `t`.
 */
export function createI18nMock(
  messages: Record<string, string>,
): (key: string, params?: Record<string, string | number>) => string {
  return (key: string, params?: Record<string, string | number>) => {
    let text = messages[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v))
      }
    }
    return text
  }
}
