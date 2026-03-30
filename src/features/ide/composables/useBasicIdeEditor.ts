/**
 * Editor: parser, highlighting, parse/validate, sample loading, capabilities.
 */

import { FBasicParser } from '@/core/parser/FBasicParser'
import { getSampleCode, getSampleCodeKeys } from '@/core/samples'
import { getSampleBgData, hasSampleBgData } from '@/core/samples/sampleBgData'
import type { HighlighterInfo, ParserInfo } from '@/core/types/execution-types'
import { createEmptyGrid } from '@/features/bg-editor/composables/useBgGrid'
import { logComposable } from '@/shared/logger'

import type { BasicIdeState } from './useBasicIdeState'
import { useProgramStore } from './useProgramStore'

export interface BasicIdeEditor {
  updateHighlighting: () => Promise<void>
  parseCode: () => Promise<unknown>
  validateCode: () => Promise<boolean>
  loadSampleCode: (sampleType: string) => boolean
  sampleSelectOptions: Array<{ value: string; label: string }>
  getParserCapabilities: () => ParserInfo
  getHighlighterCapabilities: () => HighlighterInfo
}

/**
 * Create editor APIs (parser, highlight, parse, samples, capabilities).
 */
export function useBasicIdeEditor(state: BasicIdeState): BasicIdeEditor {
  const parser = new FBasicParser()

  const updateHighlighting = async () => {
    state.highlightedCode.value = state.code.value
  }

  const parseCode = async (): Promise<unknown> => {
    try {
      const result = await parser.parse(state.code.value)
      if (result.success && result.cst) {
        return result.cst
      }
      if (result.errors) {
        state.errors.value = result.errors.map(error => ({
          line: error.location?.start?.line ?? 0,
          message: error.message,
          type: 'syntax',
        }))
      }
      return null
    } catch (error) {
      logComposable.error('Parse error:', error)
      state.errors.value = [
        {
          line: 0,
          message: error instanceof Error ? error.message : 'Parse error',
          type: 'syntax',
        },
      ]
      return null
    }
  }

  const validateCode = async (): Promise<boolean> => {
    const cst = await parseCode()
    return cst !== null
  }

  const loadSampleCode = (sampleType: string): boolean => {
    if (!sampleType) return false
    const sample = getSampleCode(sampleType)
    if (sample) {
      // Load code into IDE state (triggers sync to program store via watch)
      state.code.value = sample.code
      state.currentSampleType.value = sampleType

      // Load BG data into program store if sample has associated BG
      const programStore = useProgramStore()
      const bgKey = sample.bgKey
      const hasBg = bgKey ? hasSampleBgData(bgKey) : false
      if (hasBg && bgKey) {
        const bgData = getSampleBgData(bgKey)
        programStore.setBg(bgData)
      } else {
        // Clear BG data when sample has no associated BG
        programStore.setBg(createEmptyGrid())
      }

      void updateHighlighting()
      return hasBg
    }
    return false
  }

  const sampleSelectOptions = getSampleCodeKeys().map(key => {
    return { value: key, label: key }
  })

  const getParserCapabilities = (): ParserInfo => parser.getParserInfo()

  const getHighlighterCapabilities = (): HighlighterInfo => ({
    name: 'Basic Highlighter',
    version: '1.0.0',
    features: ['basic-syntax'],
  })

  return {
    updateHighlighting,
    parseCode,
    validateCode,
    loadSampleCode,
    sampleSelectOptions,
    getParserCapabilities,
    getHighlighterCapabilities,
  }
}
