# Vue Best Practices Optimization Plan

**Review Date:** 2026-03-03
**Status:** Pending
**Overall Grade:** B+

---

## Executive Summary

The codebase demonstrates strong Vue 3 fundamentals with Composition API and TypeScript. Main areas for improvement: error handling, component testing, and performance optimization.

---

## Critical Issues (Fix Immediately)

### 1. No Global Error Handler
- **File:** `src/main.ts:45-61`
- **Issue:** No `app.config.errorHandler` or `app.config.warnHandler`
- **Impact:** Uncaught Vue errors bubble to console with no user feedback
- **Fix:**
  ```typescript
  app.config.errorHandler = (err, instance, info) => {
    logApp.error('Vue error:', err, info)
    // Optionally show user-friendly error toast
  }
  ```

### 2. No Error Boundary Components
- **File:** `src/App.vue` and all feature components
- **Issue:** No `onErrorCaptured` usage anywhere
- **Impact:** A crash in one component crashes the entire app
- **Fix:** Create ErrorBoundary component for critical sections (IDE editor, screen renderer)

### 3. Duplicate RouteMeta Type Declarations
- **Files:**
  - `src/router/index.ts:7-15`
  - `src/router/types.d.ts:3-13`
- **Issue:** Two conflicting `RouteMeta` declarations with different properties
- **Fix:** Consolidate into single declaration with all properties:
  ```typescript
  interface RouteMeta {
    title?: string
    showInNav?: boolean
    icon?: string
    group?: 'main' | 'tools' | 'testing'
    parent?: string
    requiresAuth?: boolean
  }
  ```

### 4. Missing 404 Catch-All Route
- **File:** `src/router/index.ts`
- **Issue:** No route defined for unmatched paths
- **Impact:** Users navigating to invalid URLs see blank page
- **Fix:** Add catch-all route:
  ```typescript
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/features/error/NotFoundPage.vue'),
    meta: { title: 'Not Found' }
  }
  ```

---

## Important Issues (Fix Soon)

### 5. No Vue Component Tests
- **Files:** Entire `src/features/` directory
- **Issue:** Zero `.vue` component tests exist
- **Impact:** UI components are untested
- **Fix:** Add `@vue/test-utils` and create component tests

### 6. Mutable State Exposed from Composables
- **File:** `useSpriteViewerStore.ts:88-105`
- **Issue:** Returns mutable refs directly, allowing external code to bypass actions
- **Fix:** Wrap with `readonly()` and only expose actions for mutation

### 7. Expensive Deep Watch on Large Data Structure
- **File:** `Screen.vue:339-358`
- **Issue:** `deep: true` on 32x30 ScreenCell array causes deep traversal on every change
- **Fix:** Consider using sequence number or dirty flag pattern instead

### 8. Manual Event Listeners Instead of `useEventListener`
- **Files:**
  - `useKeyboardInput.ts:86-111`
  - `useKeyboardJoystick.ts:194-212`
- **Issue:** Manual lifecycle management is error-prone and verbose
- **Fix:** Use `useEventListener` from VueUse which auto-cleans on unmount

### 9. Manual Animation Frame Management
- **File:** `usePerformanceDiagnosticsMetrics.ts:218-238`
- **Issue:** Manual RAF loop with cleanup
- **Fix:** Use `useRafFn` from VueUse for cleaner RAF loop with automatic cleanup

### 10. Primitive/Object Values Using `ref()` Instead of `shallowRef()`
- **Files:**
  - `IdePage.vue:124-125`
  - `Screen.vue:68,76-77,80,83-84,88,91`
- **Issue:** Using `ref()` for objects/arrays that are replaced, not mutated
- **Fix:** Use `shallowRef()` for better performance

### 11. No Global Unhandled Rejection Handler
- **File:** `src/main.ts`
- **Issue:** No `window.onunhandledrejection` listener
- **Impact:** Promise rejections in web worker communication could go uncaught
- **Fix:**
  ```typescript
  window.addEventListener('unhandledrejection', (event) => {
    logApp.error('Unhandled rejection:', event.reason)
  })
  ```

### 12. Inconsistent Error Logging
- **Files:**
  - `AnimationManager.ts:205,230,256,304` - uses `console.warn`
  - `AnimationWorker.ts:163` - uses `console.error`
  - `useProgramStore.ts:161,169` - uses `console.error`
  - `useSoundTestResults.ts:87` - uses `console.error`
- **Issue:** Mix of `console.error/warn` and structured logger
- **Fix:** Replace with structured logger calls

### 13. Composable Testing Anti-Pattern
- **File:** `useProgramStore.test.ts:30-32`
- **Issue:** Dynamic imports inside each test suggest module caching issues
- **Fix:** Use proper Pinia testing setup with `setActivePinia(createPinia())` in `beforeEach`

### 14. Async Handling with setTimeout
- **File:** `useProgramStore.test.ts:124`
- **Issue:** Uses magic number timeout instead of proper async utilities
- **Fix:** Use `flushPromises` from `@vue/test-utils` or `vi.useFakeTimers()`

### 15. No Navigation Guards Infrastructure
- **File:** `src/router/index.ts`
- **Issue:** No global guards (`beforeEach`, `afterEach`) or per-route guards
- **Impact:** Cannot implement auth protection, data pre-fetching, or analytics
- **Fix:** Add guard infrastructure if auth is planned

### 16. Unused `requiresAuth` Meta Property
- **File:** `src/router/types.d.ts:8`
- **Issue:** Declared but never used in any route
- **Fix:** Either implement auth guards or remove the property

---

## Minor Issues (Low Priority)

### 17. External CSS Import in Scoped Style Block
- **File:** `Screen.vue:475`
- **Issue:** `@import url('@/shared/styles/screen-crt.css')` in scoped block can cause specificity issues
- **Fix:** Consider importing in script or using a global style

### 18. Could Use `defineModel` (Vue 3.4+)
- **File:** `GameInput.vue:34-37`
- **Issue:** Manual computed getter/setter for v-model
- **Fix:** Could be simplified with `const model = defineModel<string | number>()`

### 19. Console Statements in Production Code
- **File:** `useBasicIdeEnhanced.ts:84-108`
- **Issue:** `debugBuffer()` contains `console.group/console.log` statements
- **Fix:** Consider conditional logging or a debug utility

### 20. No Scroll Behavior Configuration
- **File:** `src/router/index.ts:141-144`
- **Issue:** `createRouter` options don't include `scrollBehavior`
- **Fix:**
  ```typescript
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
  ```

### 21. No Route Transitions
- **File:** `src/App.vue:34`
- **Issue:** Plain `<router-view />` without transition wrapper
- **Fix:** Consider adding transitions for UX polish

### 22. Redundant watch + onMounted for Initialization
- **File:** `CodeEditor.vue:67-72`
- **Issue:** Watch with `immediate: true` already covers initialization; onMounted is redundant
- **Fix:** Remove redundant onMounted call

### 23. Non-Reactive Race Flag
- **File:** `Screen.vue:94`
- **Issue:** `let renderInProgress = false` is not reactive, could cause race conditions
- **Fix:** Add documentation or use a more robust approach

### 24. Missing Test Setup File
- **File:** `test/setup.ts`
- **Issue:** Only has console.log statements
- **Fix:** Configure with testing-library matchers, Pinia setup, global mocks

### 25. Component Size Approaching Limit
- **File:** `Screen.vue` is 477 lines (limit is 500)
- **Fix:** Extract Konva rendering logic to dedicated composables

### 26. Manual provide/inject Pattern
- **Files:**
  - `useScreenZoom.ts:23-65`
  - `useScreenContext.ts:55-71`
  - `useScreenDebug.ts:23-64`
  - `useSpriteViewerStore.ts:108-124`
- **Issue:** Manual provide/inject could be simplified
- **Fix:** Use VueUse's `createInjectionState` for cleaner API

### 27. Manual localStorage Without Reactivity
- **File:** `useKeyboardJoystick.ts:53-89`
- **Issue:** Manual localStorage read/write without reactivity
- **Fix:** Use `useLocalStorage` with custom serializer

### 28. Module-Level Singleton State
- **Files:**
  - `useBgEditorState.ts:22-27`
  - `useProgramStore.ts:26-38`
- **Issue:** Module-level state can cause issues with SSR and testing
- **Fix:** Wrap in `createGlobalState` for proper singleton management

---

## Strengths (What the Codebase Does Well)

| Area | Rating | Notes |
|------|--------|-------|
| Composition API `<script setup>` | ⭐⭐⭐⭐⭐ | 100% adoption across all 57 Vue files |
| TypeScript Integration | ⭐⭐⭐⭐⭐ | Strong typing throughout |
| Props/Emits Definitions | ⭐⭐⭐⭐⭐ | Type-based with interfaces |
| Provide/Inject | ⭐⭐⭐⭐⭐ | Uses `InjectionKey` with error handling |
| Scoped Styles | ⭐⭐⭐⭐⭐ | All components use `<style scoped>` |
| Lazy-loaded Routes | ⭐⭐⭐⭐⭐ | All routes use dynamic imports |
| Lifecycle Cleanup | ⭐⭐⭐⭐ | Proper `onUnmounted`/`onDeactivated` usage |
| VueUse Adoption | ⭐⭐⭐⭐ | Good usage of `useLocalStorage`, `useElementSize`, etc. |
| Composables Organization | ⭐⭐⭐⭐ | 37 well-organized composables |

---

## Implementation Priority

### Phase 1: Critical (This Week)
- [ ] Add global error handler in `main.ts`
- [ ] Add 404 catch-all route
- [ ] Consolidate RouteMeta type declarations
- [ ] Create ErrorBoundary component

### Phase 2: Important (Next Sprint)
- [ ] Replace manual event listeners with `useEventListener`
- [ ] Add `readonly()` to mutable composable returns
- [ ] Evaluate deep watch on screenBuffer
- [ ] Start adding component tests with `@vue/test-utils`
- [ ] Replace `ref()` with `shallowRef()` for replaced objects

### Phase 3: Minor (Backlog)
- [ ] Replace `console.error/warn` with structured logger
- [ ] Refactor Screen.vue under 500 lines
- [ ] Consider `createInjectionState` for provide/inject patterns
- [ ] Add scroll behavior to router
- [ ] Configure test setup file properly
