/**
 * ConfirmDialog component types
 */

export interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  visible: boolean
  /** Dialog title (optional) */
  title?: string
  /** Dialog message (the question to confirm) */
  message?: string
  /** Custom label for the confirm button (defaults to i18n key) */
  confirmLabel?: string
  /** Custom label for the cancel button (defaults to i18n key) */
  cancelLabel?: string
}

export interface ConfirmDialogEmits {
  confirm: []
  cancel: []
}
