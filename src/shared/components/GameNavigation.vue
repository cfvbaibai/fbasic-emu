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
.game-navigation {
  border-bottom: 1px solid var(--game-nav-border);
  flex-shrink: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font: 700 1.5rem var(--game-font-family-heading);
  color: var(--base-solid-primary);
  text-shadow: 0 0 10px var(--game-accent-glow), 0 2px 4px var(--base-alpha-gray-00-80);
  letter-spacing: 2px;
  white-space: nowrap;
}

.title-icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 0 8px var(--game-accent-glow));
}

.nav-items {
  display: flex;
  gap: 0.375rem;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1rem;
  flex-shrink: 0;
}

.build-number {
  font-family: var(--game-font-family-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--game-text-tertiary);
  padding: 0.25rem 0.5rem;
  background: var(--base-alpha-gray-100-10);
  border: 1px solid var(--game-surface-border);
  border-radius: 4px;
  white-space: nowrap;
}

.debug-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--base-alpha-gray-100-10);
  border: 1px solid var(--game-surface-border);
  border-radius: 4px;
  color: var(--game-text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.debug-toggle:hover {
  border-color: var(--base-solid-primary);
  color: var(--game-text-secondary);
}

.debug-toggle.active {
  color: var(--base-solid-primary);
  border-color: var(--base-solid-primary);
  background: var(--base-alpha-gray-100-10);
}

/* Nav button styles */
.nav-button {
  position: relative;
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 8px;
  padding: 0.5rem 0.875rem;
  color: var(--game-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow:
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.nav-button:hover {
  background: var(--game-surface-bg-hover-gradient);
  border-color: var(--base-solid-primary);
  color: var(--game-text-primary);
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px var(--game-accent-glow),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.nav-button.active {
  background: linear-gradient(
    135deg,
    var(--base-solid-primary) 0%,
    var(--base-solid-primary) 100%
  );
  border-color: var(--base-solid-primary);
  color: var(--game-text-contrast);
  font-weight: 700;
  box-shadow:
    var(--game-shadow-glow),
    0 4px 8px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-30);
}

.nav-button.active::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--base-solid-gray-00);
  border-radius: 8px 0 0 8px;
  box-shadow: 0 0 8px var(--base-alpha-gray-00-50);
}

.nav-icon {
  font-size: 1rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.nav-button.active .nav-icon {
  color: var(--game-text-contrast);
  filter: drop-shadow(0 0 4px var(--base-alpha-gray-00-30));
}

.nav-button:hover .nav-icon {
  transform: scale(1.1);
}

.nav-button-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.nav-button-name {
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.2;
}

.nav-button-desc {
  display: none;
}

.nav-button-grouped {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.nav-button-grouped .nav-button-name {
  font-size: 0.8rem;
}

/* Nav group styles */
.nav-group {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 8px;
  color: var(--game-text-tertiary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow:
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.nav-group-header:hover {
  background: var(--base-alpha-gray-100-10);
  border-color: var(--base-solid-primary);
  color: var(--game-text-secondary);
}

.nav-group-icon {
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.nav-group-dropdown {
  position: fixed;
  min-width: 250px;
  max-width: 320px;
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow:
    0 4px 12px var(--base-alpha-gray-00-40),
    0 0 8px var(--game-accent-glow);
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-group-dropdown.expanded {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* Responsive design */
/* stylelint-disable declaration-block-single-line-max-declarations */
@media (width <= 768px) {
  .nav-container { flex-direction: column; gap: 1rem; padding: 1rem; }
  .nav-title { font-size: 1.25rem; }
  .nav-items { width: 100%; flex-direction: column; justify-content: center; }
  .nav-button { width: 100%; min-width: auto; padding: 0.5rem 0.875rem; }
  .nav-button-content { align-items: center; text-align: center; }
  .nav-group, .nav-group-header { width: 100%; }

  .nav-group-dropdown {
    position: fixed; left: 1rem !important; right: 1rem;
    width: auto; min-width: auto; max-width: none;
  }
  .nav-controls { width: 100%; margin: 0.5rem 0 0; justify-content: center; gap: 0.5rem; }
}

@media (width <= 480px) {
  .nav-items { flex-direction: column; }
  .nav-button { width: 100%; min-width: unset; }
}
/* stylelint-enable declaration-block-single-line-max-declarations */
</style>
