# UI Team

## Ownership
- **Files**: `src/features/*`, `src/shared/components/*`, `src/shared/styles/*`, `test/components/*`
- **Responsibilities**: Vue components, IDE features, theming, user interaction

## Architecture

### Component Structure
```
src/
├── features/
│   ├── ide/                    # Main IDE interface
│   │   ├── components/        # IDE-specific components
│   │   ├── composables/       # IDE logic (web worker, state)
│   │   └── BasicIde.vue       # Main IDE container
│   └── sprite-viewer/         # Character sprite viewer
└── shared/
    ├── components/ui/         # Reusable Game* UI components
    └── styles/               # Global CSS (theme.css, utilities.css)
```

### Key Files
- `BasicIde.vue` - Main IDE container
- `composables/useBasicIdeWebWorkerUtils.ts` - Worker communication
- `composables/useBasicIdeMessageHandlers.ts` - Message handling
- `shared/styles/theme.css` - Theme system (CSS variables)

## Vue 3 Patterns

### Component Template
```vue
<script setup lang="ts">
// 1. Imports (types first)
import type { Ref } from 'vue'
import { ref, computed } from 'vue'

// 2. Props/Emits
const props = defineProps<{ value: string }>()
const emit = defineEmits<{ update: [value: string] }>()

// 3. Composables
const { state } = useFeature()

// 4. Reactive state
const localState = ref('')

// 5. Computed properties
const displayValue = computed(() => props.value.toUpperCase())

// 6. Methods
function handleClick() {
  emit('update', displayValue.value)
}

// 7. Lifecycle hooks
onMounted(() => {
  // initialization
})
</script>

<template>
  <div class="container">
    {{ displayValue }}
  </div>
</template>

<style scoped>
/* Always use scoped styles */
/* Prefer CSS variables over hardcoded values */
.container {
  color: var(--game-text-primary);
  background: var(--game-surface-bg-gradient);
}
</style>
```

### Props Reactivity
```typescript
// ❌ Wrong - loses reactivity
const { value } = props

// ✅ Correct - preserves reactivity
import { toValue } from 'vue'
const currentValue = computed(() => toValue(props.value))
```

### Template Refs (Vue 3.5+)
```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
const element = useTemplateRef('myElement')
</script>

<template>
  <div ref="myElement">Content</div>
</template>
```

### CSS v-bind
```vue
<script setup lang="ts">
const iconColor = computed(() => props.iconColor ?? 'var(--base-solid-primary)')
</script>

<style scoped>
.card {
  --icon-color: v-bind(iconColor);
}
.icon { color: var(--icon-color); }
</style>
```

## Theme System

### Three-Layer System
1. **Base Layer** (`--base-solid-*`, `--base-alpha-*`) - Raw colors
2. **Game Layer** (`--game-*`) - Semantic game-themed (PREFERRED)
3. **Semantic Layer** (`--semantic-solid-*`, `--semantic-alpha-*`) - Status colors

**Key Rule**: Always prefer `--game-*` variables.

### Common Patterns

**Text**:
```css
.primary-text { color: var(--game-text-primary); }
.muted-text { color: var(--game-text-muted); }
```

**Backgrounds**:
```css
.surface { background: var(--game-surface-bg-gradient); }
.elevated { background: var(--game-elevated-bg); }
```

**Effects**:
```css
.shadow { box-shadow: var(--game-shadow-base); }
.glow { box-shadow: var(--game-accent-glow); }
```

**Borders**:
```css
.bordered { border: 1px solid var(--game-surface-border); }
```

### Solid vs Alpha Colors

**Solid** (`-solid-`): Text, backgrounds, borders, brand
**Alpha** (`-alpha-`): Shadows, glows, overlays, hovers

**NEVER** use alpha colors for main backgrounds or borders.

### When to Add New Variables

Only add new CSS variables when:
1. Pattern appears in 3+ components
2. No existing variable fits
3. Value needs theme variation

Otherwise, use existing variables or inline values.

## Common Tasks

### Add New IDE Feature

1. **Create component** in `src/features/ide/components/`:
   ```vue
   <script setup lang="ts">
   // Feature logic
   </script>

   <template>
     <div class="feature">
       <!-- UI -->
     </div>
   </template>

   <style scoped>
   .feature {
     /* Use CSS variables */
   }
   </style>
   ```

2. **Add to BasicIde.vue** if needed

3. **Add tests** in `test/components/`

### Add Web Worker Communication

1. **Update worker utils** in `composables/useBasicIdeWebWorkerUtils.ts`

2. **Add message handler** in `composables/useBasicIdeMessageHandlers.ts`:
   ```typescript
   function handleNewMessage(message: WorkerMessage) {
     if (message.type === 'NEW_TYPE') {
       // Handle message
     }
   }
   ```

### Update Theme

1. **Edit** `src/shared/styles/theme.css`

2. **Update both** `[data-theme="dark"]` and `[data-theme="light"]`

3. **Use CSS variables** in components (never hardcode colors)

## Integration Points

### Uses Runtime Team (via Worker)
- **Sends**: `EXECUTE`, `STOP`, `INPUT_VALUE`, `SET_SHARED_ANIMATION_BUFFER`, `SET_SHARED_JOYSTICK_BUFFER`, `STRIG_EVENT`, `STICK_EVENT`
- **Receives**: `OUTPUT`, `SCREEN_CHANGED`, `ERROR`, `RESULT`, `REQUEST_INPUT`, `PLAY_SOUND`, `PROGRESS`

**See**: `docs/reference/worker-messages.md` for complete message type reference.

### Uses Platform Team (via SharedBuffer)
- **Reads**: Sprite positions from SharedArrayBuffer
- **Renders**: Via Konva on main thread

## Patterns & Conventions

### Composable Pattern
```typescript
// composables/useFeature.ts
export function useFeature() {
  const state = ref(initialValue)
  const derived = computed(() => transform(state.value))

  function action() {
    // logic
  }

  return { state, derived, action }
}
```

### Component File Organization
```vue
<script setup lang="ts">
// 1. Type imports
import type { Ref } from 'vue'

// 2. Value imports
import { ref, computed } from 'vue'

// 3. Props/Emits
defineProps<Props>()
defineEmits<Emits>()

// 4. Composables
// 5. State
// 6. Computed
// 7. Methods
// 8. Lifecycle
</script>

<template>
  <!-- Simple, readable templates -->
</template>

<style scoped>
/* CSS variables, utility classes */
</style>
```

## Testing

- **Component tests**: `test/components/` — Vitest + Vue Test Utils, user interaction and state changes
- **E2E tests**: `test/e2e/` — Playwright, IDE UI chrome only (buttons, modals, sample selector)
- **See**: `docs/testing-strategy.md` for split-of-concern boundaries — UI team owns Playwright E2E, not program logic

### Test Template
```typescript
import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/features/ide/components/MyComponent.vue'

describe('MyComponent', () => {
  test('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { value: 'test' }
    })

    expect(wrapper.text()).toContain('test')
  })

  test('emits event on click', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
```

## Code Constraints

- Files: **MAX 500 lines** (extract composables/components when needed)
- Vue: `<style scoped>` only (exception: `@/shared/styles/*` imports)
- TypeScript: strict mode, no `any`, `import type` for types
- Styling: Prefer CSS variables and utility classes over custom styles

## Reference

- **Vue 3 docs**: https://vuejs.org/
- **Composition API**: https://vuejs.org/guide/extras/composition-api-faq.html
- **Worker message types**: `docs/reference/worker-messages.md`
- **Shared buffer layout**: `docs/reference/shared-display-buffer.md`
