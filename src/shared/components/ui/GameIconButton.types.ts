/**
 * Type definitions for GameIconButton component
 */

export interface GameIconButtonProps {
  /** Button visual style variant */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** Button size */
  size?: 'small' | 'medium' | 'large'
  /** Button variant - action buttons trigger events, toggle buttons maintain state */
  variant?: 'action' | 'toggle'
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether the button is in loading state */
  loading?: boolean
  /** Icon name in format "prefix:name" (e.g., "mdi:play") */
  icon?: string
  /** Whether the button is selected (for toggle variant) */
  selected?: boolean
  /** Tooltip text */
  title?: string
  /** Whether to use circular shape */
  circular?: boolean
  /** Optional test selector forwarded to the native button element */
  dataTestid?: string
}

export interface GameIconButtonEmits {
  /** Click event */
  click: [event: MouseEvent]
}
