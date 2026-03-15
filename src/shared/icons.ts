import { addIcon } from '@iconify/vue'

type IconModule = {
  default: {
    body: string
    width?: number
    height?: number
  }
}

const mdiIconModules = import.meta.glob<IconModule>('../../node_modules/@iconify-json/mdi/icons/*.json')
const loadedIcons = new Set<string>()
const pendingLoads = new Map<string, Promise<void>>()

/**
 * Load an mdi icon from the local icon package only when it is requested.
 */
export async function ensureLocalIcon(iconName: string): Promise<void> {
  if (!iconName.startsWith('mdi:')) return
  if (loadedIcons.has(iconName)) return

  const existingLoad = pendingLoads.get(iconName)
  if (existingLoad) {
    await existingLoad
    return
  }

  const iconId = iconName.slice('mdi:'.length)
  const modulePath = `../../node_modules/@iconify-json/mdi/icons/${iconId}.json`
  const loader = mdiIconModules[modulePath]
  if (!loader) return

  const loadPromise = loader()
    .then((module) => {
      addIcon(iconName, module.default)
      loadedIcons.add(iconName)
    })
    .finally(() => {
      pendingLoads.delete(iconName)
    })

  pendingLoads.set(iconName, loadPromise)
  await loadPromise
}
