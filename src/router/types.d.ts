import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Page title for display in navigation or browser tab */
    title?: string
    /** Whether to show this route in navigation */
    showInNav?: boolean
    /** Icon identifier for the route (e.g., 'mdi:monitor') */
    icon?: string
    /** Navigation group for organizing routes */
    group?: 'main' | 'tools' | 'testing'
    /** Parent route name for nested navigation */
    parent?: string
    /** Whether this route requires authentication */
    requiresAuth?: boolean
    /** Whether this route is only visible in debug mode */
    debug?: boolean
  }
}
