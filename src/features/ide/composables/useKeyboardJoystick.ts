import { useEventListener, useLocalStorage } from '@vueuse/core'
import type { Ref } from 'vue'
import { ref } from 'vue'

export interface KeyBinding {
  key: string
  displayName: string
}

export interface JoystickKeyBindings {
  up: KeyBinding
  down: KeyBinding
  left: KeyBinding
  right: KeyBinding
  a: KeyBinding
  b: KeyBinding
  start: KeyBinding
  select: KeyBinding
}

export interface KeyBindingsConfig {
  joystick0: JoystickKeyBindings
  joystick1: JoystickKeyBindings
  joystick2?: JoystickKeyBindings
  joystick3?: JoystickKeyBindings
}

export const defaultJoystick0Bindings: JoystickKeyBindings = {
  up: { key: 'w', displayName: 'W' },
  down: { key: 's', displayName: 'S' },
  left: { key: 'a', displayName: 'A' },
  right: { key: 'd', displayName: 'D' },
  a: { key: 'k', displayName: 'K' },
  b: { key: 'j', displayName: 'J' },
  start: { key: 'h', displayName: 'H' },
  select: { key: 'f', displayName: 'F' },
}

export const defaultJoystick1Bindings: JoystickKeyBindings = {
  up: { key: 'ArrowUp', displayName: '↑' },
  down: { key: 'ArrowDown', displayName: '↓' },
  left: { key: 'ArrowLeft', displayName: '←' },
  right: { key: 'ArrowRight', displayName: '→' },
  a: { key: '1', displayName: '1' },
  b: { key: '2', displayName: '2' },
  start: { key: '3', displayName: '3' },
  select: { key: '4', displayName: '4' },
}

const STORAGE_KEY = 'fbasic-joystick-keybindings'

interface UseKeyboardJoystickOptions {
  enabled?: Ref<boolean> | boolean
  onDirectionStart?: (joystickId: number, direction: 'up' | 'down' | 'left' | 'right') => void
  onDirectionStop?: (joystickId: number, direction: 'up' | 'down' | 'left' | 'right') => void
  onButtonPress?: (joystickId: number, button: 'a' | 'b' | 'start' | 'select') => void
  onButtonRelease?: (joystickId: number, button: 'a' | 'b' | 'start' | 'select') => void
  keyBindings?: KeyBindingsConfig
}

/**
 * Composable for keyboard-based joystick emulation.
 *
 * Uses VueUse's useEventListener for automatic cleanup and reactive enabled state.
 * Key bindings are persisted to localStorage using useLocalStorage.
 */
export function useKeyboardJoystick(options: UseKeyboardJoystickOptions = {}) {
  const {
    enabled: enabledOption = true,
    onDirectionStart,
    onDirectionStop,
    onButtonPress,
    onButtonRelease,
    keyBindings: initialBindings,
  } = options

  // Normalize enabled to a ref
  const enabled = typeof enabledOption === 'boolean' ? ref(enabledOption) : enabledOption

  // Use VueUse's useLocalStorage for automatic persistence and reactivity
  const storedBindings = useLocalStorage<KeyBindingsConfig>(STORAGE_KEY, {
    joystick0: { ...defaultJoystick0Bindings },
    joystick1: { ...defaultJoystick1Bindings },
  })

  // Use provided bindings or stored bindings
  const keyBindings = ref<KeyBindingsConfig>(initialBindings ?? storedBindings.value)

  const pressedKeys = ref<Set<string>>(new Set())

  const heldDirections = ref<Record<number, Set<string>>>({
    0: new Set(),
    1: new Set(),
  })

  type HeldButtonKey = `${0 | 1}-${'a' | 'b' | 'start' | 'select'}`
  const heldButtons = ref<Record<HeldButtonKey, boolean>>({} as Record<HeldButtonKey, boolean>)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    pressedKeys.value.add(key)

    processJoystickBindings(key, 0, keyBindings.value.joystick0, heldDirections.value[0]!, true)
    processJoystickBindings(key, 1, keyBindings.value.joystick1, heldDirections.value[1]!, true)
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!enabled.value) return

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    pressedKeys.value.delete(key)

    processJoystickBindings(key, 0, keyBindings.value.joystick0, heldDirections.value[0]!, false)
    processJoystickBindings(key, 1, keyBindings.value.joystick1, heldDirections.value[1]!, false)
  }

  function matchBinding(binding: KeyBinding, key: string): boolean {
    const bindingKey = binding.key.length === 1 ? binding.key.toLowerCase() : binding.key
    return bindingKey === key
  }

  type Direction = 'up' | 'down' | 'left' | 'right'
  type Button = 'a' | 'b' | 'start' | 'select'

  function processJoystickBindings(
    key: string,
    joystickId: number,
    bindings: JoystickKeyBindings,
    directions: Set<string>,
    isKeyDown: boolean
  ): void {
    const directionsMap: Record<Direction, Direction> = { up: 'up', down: 'down', left: 'left', right: 'right' }
    const buttons: Button[] = ['a', 'b', 'start', 'select']

    for (const dir of Object.keys(directionsMap) as Direction[]) {
      const binding = bindings[dir]
      if (matchBinding(binding, key)) {
        if (isKeyDown) {
          if (!directions.has(dir)) {
            directions.add(dir)
            onDirectionStart?.(joystickId, dir)
          }
        } else {
          directions.delete(dir)
          onDirectionStop?.(joystickId, dir)
        }
      }
    }

    for (const btn of buttons) {
      const binding = bindings[btn]
      if (matchBinding(binding, key)) {
        const heldKey = `${joystickId}-${btn}` as HeldButtonKey
        if (isKeyDown) {
          if (!heldButtons.value[heldKey]) {
            heldButtons.value[heldKey] = true
            onButtonPress?.(joystickId, btn)
          }
        } else {
          heldButtons.value[heldKey] = false
          onButtonRelease?.(joystickId, btn)
        }
      }
    }
  }

  // Use VueUse's useEventListener for automatic cleanup on unmount
  useEventListener(window, 'keydown', handleKeyDown)
  useEventListener(window, 'keyup', handleKeyUp)

  const updateKeyBindings = (newBindings: KeyBindingsConfig) => {
    keyBindings.value = newBindings
    storedBindings.value = newBindings
  }

  const resetToDefaults = () => {
    const defaults = {
      joystick0: { ...defaultJoystick0Bindings },
      joystick1: { ...defaultJoystick1Bindings },
    }
    updateKeyBindings(defaults)
  }

  return {
    keyBindings,
    pressedKeys,
    updateKeyBindings,
    resetToDefaults,
  }
}
