/**
 * Type definitions for i18n translation keys
 *
 * This file provides TypeScript type safety for translation keys throughout the application.
 * The types are derived from the English locale files (master schema).
 */

import type enBgEditor from './locales/en/bg-editor.json'
import type enCoi from './locales/en/coi.json'
import type enCommon from './locales/en/common.json'
import type enDiagnostics from './locales/en/diagnostics.json'
import type enHome from './locales/en/home.json'
import type enIde from './locales/en/ide.json'
import type enImageAnalyzer from './locales/en/image-analyzer.json'
import type enKonvaTest from './locales/en/konva-test.json'
import type enMonacoEditor from './locales/en/monaco-editor.json'
import type enNavigation from './locales/en/navigation.json'
import type enSoundTest from './locales/en/sound-test.json'
import type enSpriteViewer from './locales/en/sprite-viewer.json'
import type enTesting from './locales/en/testing.json'

// Define the master schema from English locale
export type MessageSchema = {
  navigation: typeof enNavigation
  ide: typeof enIde
  common: typeof enCommon
  home: typeof enHome
  spriteViewer: typeof enSpriteViewer
  imageAnalyzer: typeof enImageAnalyzer
  monacoEditor: typeof enMonacoEditor
  bgEditor: typeof enBgEditor
  coi: typeof enCoi
  soundTest: typeof enSoundTest
  diagnostics: typeof enDiagnostics
  testing: typeof enTesting
  konvaTest: typeof enKonvaTest
}

// Define available locales
export type Locale = 'en' | 'ja' | 'zh-CN' | 'zh-TW'
