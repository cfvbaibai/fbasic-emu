<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { buildInfo } from '@/buildInfo'
import { useDebugMode } from '@/shared/composables/useDebugMode'
import { useLocale } from '@/shared/composables/useLocale'
import { useSkin } from '@/shared/composables/useSkin'

import { useNavigationDropdown } from './composables/useNavigationDropdown'
import { useNavigationRoutes } from './composables/useNavigationRoutes'
import GameIcon from './ui/GameIcon.vue'
import GameSelect from './ui/GameSelect.vue'

/**
 * GameNavigation component - Router-driven navigation with grouped structure.
 *
 * @example
 * ```vue
 * <GameNavigation />
 * ```
 */
defineOptions({
  name: 'GameNavigation',
})

const { t } = useI18n()
const { currentSkin, setSkin, availableSkins } = useSkin()
const { currentLocale, setLocale, availableLocales } = useLocale()
const { isDebugEnabled, toggleDebugMode } = useDebugMode()
const { groupedRoutes } = useNavigationRoutes(isDebugEnabled)

const route = useRoute()
const router = useRouter()

// Group expansion state (default to collapsed)
const toolsExpanded = ref(false)
const testingExpanded = ref(false)

// Template refs using Vue 3.5+ pattern (use unique names to avoid conflicts)
const toolsHeaderRef = useTemplateRef<HTMLElement>('toolsHeaderEl')
const toolsDropdownRef = useTemplateRef<HTMLElement>('toolsDropdownEl')
const testingHeaderRef = useTemplateRef<HTMLElement>('testingHeaderEl')
const testingDropdownRef = useTemplateRef<HTMLElement>('testingDropdownEl')

// Navigation dropdowns with click-outside and ESC key handling
const toolsDropdown = useNavigationDropdown({
  expanded: toolsExpanded,
  headerRef: toolsHeaderRef,
  dropdownRef: toolsDropdownRef,
  otherDropdowns: [testingExpanded],
})

const testingDropdown = useNavigationDropdown({
  expanded: testingExpanded,
  headerRef: testingHeaderRef,
  dropdownRef: testingDropdownRef,
  otherDropdowns: [toolsExpanded],
})

const isActive = (path: string) => {
  return route.path === path
}

const navigate = (path: string) => {
  router.push(path)
  // Close all dropdowns after navigation
  toolsDropdown.close()
  testingDropdown.close()
}

const toolsDropdownPosition = computed(() => {
  const rect = toolsHeaderRef.value?.getBoundingClientRect()
  return { top: rect ? `${rect.bottom}px` : '0px', left: rect ? `${rect.left}px` : '0px' }
})

const testingDropdownPosition = computed(() => {
  const rect = testingHeaderRef.value?.getBoundingClientRect()
  return { top: rect ? `${rect.bottom}px` : '0px', left: rect ? `${rect.left}px` : '0px' }
})

const skinOptions = computed(() => {
  return availableSkins.map(skin => ({
    label: skin.label,
    value: skin.name,
  }))
})

const handleSkinChange = (skinValue: string | number) => {
  setSkin(skinValue as typeof currentSkin.value)
}

const localeOptions = computed(() => {
  return availableLocales.map(locale => ({
    label: locale.label,
    value: locale.value,
  }))
})

const handleLocaleChange = (localeValue: string | number) => {
  setLocale(localeValue as typeof currentLocale.value)
}
</script>

<template>
  <nav class="game-navigation">
    <div class="nav-container">
      <div class="nav-title">
        <GameIcon icon="mdi:monitor" :size="28" class="title-icon" />
        <span>{{ t('navigation.appTitle') }}</span>
      </div>
      <div class="nav-items">
        <!-- Main group (always visible) -->
        <button
          v-for="item in groupedRoutes.main"
          :key="item.path"
          :class="['nav-button', { active: isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          <GameIcon :icon="item.icon" size="small" class="nav-icon" />
          <div class="nav-button-content">
            <span class="nav-button-name">{{ item.title }}</span>
            <span class="nav-button-desc">{{ item.description }}</span>
          </div>
        </button>

        <!-- Tools group (dropdown) -->
        <div v-if="groupedRoutes.tools.length > 0" class="nav-group">
          <button ref="toolsHeaderEl" class="nav-group-header" @click="toolsDropdown.toggle">
            <GameIcon
              :icon="toolsExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
              size="small"
              class="nav-group-icon"
            />
            <span class="nav-group-title">{{ t('navigation.groups.tools') }}</span>
          </button>
          <Teleport to="body">
            <div
              v-if="toolsExpanded"
              ref="toolsDropdownEl"
              :class="['nav-group-dropdown', { expanded: toolsExpanded }]"
              :style="toolsDropdownPosition"
            >
              <button
                v-for="item in groupedRoutes.tools"
                :key="item.path"
                :class="['nav-button', 'nav-button-grouped', { active: isActive(item.path) }]"
                @click="navigate(item.path)"
              >
                <GameIcon :icon="item.icon" size="small" class="nav-icon" />
                <div class="nav-button-content">
                  <span class="nav-button-name">{{ item.title }}</span>
                  <span class="nav-button-desc">{{ item.description }}</span>
                </div>
              </button>
            </div>
          </Teleport>
        </div>

        <!-- Testing group (dropdown) -->
        <div v-if="groupedRoutes.testing.length > 0" class="nav-group">
          <button ref="testingHeaderEl" class="nav-group-header" @click="testingDropdown.toggle">
            <GameIcon
              :icon="testingExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
              size="small"
              class="nav-group-icon"
            />
            <span class="nav-group-title">{{ t('navigation.groups.testing') }}</span>
          </button>
          <Teleport to="body">
            <div
              v-if="testingExpanded"
              ref="testingDropdownEl"
              :class="['nav-group-dropdown', { expanded: testingExpanded }]"
              :style="testingDropdownPosition"
            >
              <button
                v-for="item in groupedRoutes.testing"
                :key="item.path"
                :class="['nav-button', 'nav-button-grouped', { active: isActive(item.path) }]"
                @click="navigate(item.path)"
              >
                <GameIcon :icon="item.icon" size="small" class="nav-icon" />
                <div class="nav-button-content">
                  <span class="nav-button-name">{{ item.title }}</span>
                  <span class="nav-button-desc">{{ item.description }}</span>
                </div>
              </button>
            </div>
          </Teleport>
        </div>
      </div>
      <div class="nav-controls">
        <button
          :class="['debug-toggle', { active: isDebugEnabled }]"
          :title="t('navigation.debug.toggleTitle')"
          @click="toggleDebugMode"
        >
          <GameIcon :icon="isDebugEnabled ? 'mdi:bug' : 'mdi:bug-outline'" size="small" />
        </button>
        <div class="build-number" title="Build number - increments on each build and hot reload">
          #{{ buildInfo.buildNumber }}
        </div>
        <GameSelect
          :model-value="currentLocale"
          :options="localeOptions"
          size="small"
          width="100px"
          @update:model-value="handleLocaleChange"
        />
        <GameSelect
          :model-value="currentSkin"
          :options="skinOptions"
          size="small"
          width="120px"
          @update:model-value="handleSkinChange"
        />
      </div>
    </div>
  </nav>
</template>

<style scoped>
@import url('@/shared/styles/navigation.css');
</style>
