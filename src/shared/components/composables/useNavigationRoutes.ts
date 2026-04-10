import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteRecordNormalized } from 'vue-router'
import { useRouter } from 'vue-router'

export interface NavRoute {
  path: string
  name: string
  icon: string
  title: string
  description: string
}

export interface GroupedRoutes {
  main: NavRoute[]
  tools: NavRoute[]
  testing: NavRoute[]
}

/**
 * Get translation key from route name
 */
const getItemKey = (routeName: string): string => {
  const nameMap: Record<string, string> = {
    Home: 'home',
    Ide: 'ide',
    CharacterSpriteViewer: 'spriteViewer',
    PerformanceDiagnostics: 'performanceDiagnostics',
    KonvaSpriteTest: 'konvaSpriteTest',
    PositionSyncLoadTest: 'positionSyncLoadTest',
    PrintVsSpritesTest: 'printVsSpritesTest',
    SoundTest: 'soundTest',
  }
  return nameMap[routeName] ?? routeName.toLowerCase()
}

/**
 * Composable for grouping router routes into navigation categories.
 *
 * Filters routes with `meta.showInNav === true` and groups them
 * by `meta.group` (main, tools, testing).
 *
 * Routes with `meta.debug === true` are only included when `isDebugEnabled` is true.
 */
export function useNavigationRoutes(isDebugEnabled: Ref<boolean>) {
  const { t } = useI18n()
  const router = useRouter()

  const groupedRoutes = computed<GroupedRoutes>(() => {
    const groups: GroupedRoutes = { main: [], tools: [], testing: [] }

    router
      .getRoutes()
      .filter((r: RouteRecordNormalized) => r.meta.showInNav === true)
      .filter((r: RouteRecordNormalized) => {
        // Hide debug-only routes when debug mode is off
        if (r.meta.debug === true && !isDebugEnabled.value) {
          return false
        }
        return true
      })
      .forEach((r: RouteRecordNormalized) => {
        const group = (r.meta.group as 'main' | 'tools' | 'testing') ?? 'main'
        const itemKey = getItemKey(String(r.name))

        groups[group].push({
          path: r.path,
          name: String(r.name),
          icon: r.meta.icon as string,
          title: t(`navigation.items.${itemKey}.name`),
          description: t(`navigation.items.${itemKey}.description`),
        })
      })

    return groups
  })

  return { groupedRoutes }
}
