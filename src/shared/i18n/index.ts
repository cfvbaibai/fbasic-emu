// Import type declarations
import './vue-i18n.d.ts'

import { createI18n } from 'vue-i18n'

import enBgEditor from './locales/en/bg-editor.json'
import enCommon from './locales/en/common.json'
import enDiagnostics from './locales/en/diagnostics.json'
import enHome from './locales/en/home.json'
import enIde from './locales/en/ide.json'
import enImageAnalyzer from './locales/en/image-analyzer.json'
import enMonacoEditor from './locales/en/monaco-editor.json'
import enNavigation from './locales/en/navigation.json'
import enSoundTest from './locales/en/sound-test.json'
import enSpriteViewer from './locales/en/sprite-viewer.json'
import enTesting from './locales/en/testing.json'
import jaBgEditor from './locales/ja/bg-editor.json'
import jaCommon from './locales/ja/common.json'
import jaDiagnostics from './locales/ja/diagnostics.json'
import jaHome from './locales/ja/home.json'
import jaIde from './locales/ja/ide.json'
import jaImageAnalyzer from './locales/ja/image-analyzer.json'
import jaMonacoEditor from './locales/ja/monaco-editor.json'
import jaNavigation from './locales/ja/navigation.json'
import jaSoundTest from './locales/ja/sound-test.json'
import jaSpriteViewer from './locales/ja/sprite-viewer.json'
import jaTesting from './locales/ja/testing.json'
import zhCNBgEditor from './locales/zh-CN/bg-editor.json'
import zhCNCommon from './locales/zh-CN/common.json'
import zhCNDiagnostics from './locales/zh-CN/diagnostics.json'
import zhCNHome from './locales/zh-CN/home.json'
import zhCNIde from './locales/zh-CN/ide.json'
import zhCNImageAnalyzer from './locales/zh-CN/image-analyzer.json'
import zhCNMonacoEditor from './locales/zh-CN/monaco-editor.json'
import zhCNNavigation from './locales/zh-CN/navigation.json'
import zhCNSoundTest from './locales/zh-CN/sound-test.json'
import zhCNSpriteViewer from './locales/zh-CN/sprite-viewer.json'
import zhCNTesting from './locales/zh-CN/testing.json'
import zhTWBgEditor from './locales/zh-TW/bg-editor.json'
import zhTWCommon from './locales/zh-TW/common.json'
import zhTWDiagnostics from './locales/zh-TW/diagnostics.json'
import zhTWHome from './locales/zh-TW/home.json'
import zhTWIde from './locales/zh-TW/ide.json'
import zhTWImageAnalyzer from './locales/zh-TW/image-analyzer.json'
import zhTWMonacoEditor from './locales/zh-TW/monaco-editor.json'
import zhTWNavigation from './locales/zh-TW/navigation.json'
import zhTWSoundTest from './locales/zh-TW/sound-test.json'
import zhTWSpriteViewer from './locales/zh-TW/sprite-viewer.json'
import zhTWTesting from './locales/zh-TW/testing.json'
import type { Locale, MessageSchema } from './types'

// Get saved locale from localStorage or default to browser language
const getDefaultLocale = (): Locale => {
  const saved = localStorage.getItem('locale')
  if (saved && (saved === 'en' || saved === 'ja' || saved === 'zh-CN' || saved === 'zh-TW')) {
    return saved as Locale
  }

  // Detect browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    // Check for Traditional Chinese (Taiwan, Hong Kong, Macau)
    if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('MO')) {
      return 'zh-TW'
    }
    return 'zh-CN' // Default to Simplified Chinese
  }
  if (browserLang.startsWith('ja')) {
    return 'ja'
  }
  return 'en'
}

const i18n = createI18n<{ message: MessageSchema }, Locale>({
  legacy: false, // Use Composition API mode
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    en: {
      navigation: enNavigation,
      ide: enIde,
      common: enCommon,
      home: enHome,
      spriteViewer: enSpriteViewer,
      imageAnalyzer: enImageAnalyzer,
      monacoEditor: enMonacoEditor,
      bgEditor: enBgEditor,
      soundTest: enSoundTest,
      diagnostics: enDiagnostics,
      testing: enTesting,
    },
    ja: {
      navigation: jaNavigation,
      ide: jaIde,
      common: jaCommon,
      home: jaHome,
      spriteViewer: jaSpriteViewer,
      imageAnalyzer: jaImageAnalyzer,
      monacoEditor: jaMonacoEditor,
      bgEditor: jaBgEditor,
      soundTest: jaSoundTest,
      diagnostics: jaDiagnostics,
      testing: jaTesting,
    },
    'zh-CN': {
      navigation: zhCNNavigation,
      ide: zhCNIde,
      common: zhCNCommon,
      home: zhCNHome,
      spriteViewer: zhCNSpriteViewer,
      imageAnalyzer: zhCNImageAnalyzer,
      monacoEditor: zhCNMonacoEditor,
      bgEditor: zhCNBgEditor,
      soundTest: zhCNSoundTest,
      diagnostics: zhCNDiagnostics,
      testing: zhCNTesting,
    },
    'zh-TW': {
      navigation: zhTWNavigation,
      ide: zhTWIde,
      common: zhTWCommon,
      home: zhTWHome,
      spriteViewer: zhTWSpriteViewer,
      imageAnalyzer: zhTWImageAnalyzer,
      monacoEditor: zhTWMonacoEditor,
      bgEditor: zhTWBgEditor,
      soundTest: zhTWSoundTest,
      diagnostics: zhTWDiagnostics,
      testing: zhTWTesting,
    },
  },
})

export default i18n
