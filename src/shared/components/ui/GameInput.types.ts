/**
 * Type definitions for GameInput component
 */

export interface GameInputProps {
  /** Input value (v-model) */
  modelValue: string | number
  /** Input type */
  type?: 'text' | 'number' | 'password' | 'email' | 'url' | 'search'
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Input size */
  size?: 'small' | 'medium' | 'large'
  /** Whether the input has a clear button */
  clearable?: boolean
  /** Optional test selector forwarded to the native input element */
  dataTestid?: string
}

export interface GameInputEmits {
  /** Update model value (v-model) */
  'update:modelValue': [value: string | number]
  /** Focus event */
  focus: [event: FocusEvent]
  /** Blur event */
  blur: [event: FocusEvent]
  /** Clear button clicked */
  clear: []
}
