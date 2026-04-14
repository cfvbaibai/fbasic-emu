/**
 * Sound Service
 *
 * Manages per-channel sound state (T, Y, M, V, O, L) across PLAY calls.
 * Each of the 3 channels maintains independent state that persists between commands.
 *
 * This service belongs to the execution layer, not the parser layer.
 * The parser (MusicDSLParser) is pure - it only parses strings to symbolic data.
 * This service compiles that symbolic data to audio using channel-specific state.
 */

import { CHANNEL_COUNT } from '@/core/constants'
import { compileToAudio, parseMusicToAst } from '@/core/sound/MusicDSLParser'
import { SoundStateManager } from '@/core/sound/SoundStateManager'
import type { CompiledAudio } from '@/core/sound/types'

/**
 * Service for managing sound state and compiling music.
 * Lives in the execution layer and coordinates with PlayExecutor.
 */
export class SoundService {
  /** Per-channel state managers - each channel has independent state */
  private stateManagers: SoundStateManager[]

  constructor() {
    // Create 3 separate state managers for 3 independent channels
    this.stateManagers = []
    for (let i = 0; i < CHANNEL_COUNT; i++) {
      this.stateManagers.push(new SoundStateManager())
    }
  }

  /**
   * Compile a music string to audio events.
   * Uses per-channel state managers that persist across PLAY calls.
   *
   * @param musicString - F-BASIC music DSL string
   * @returns Compiled audio ready for playback
   */
  compileMusic(musicString: string): CompiledAudio {
    const score = parseMusicToAst(musicString)
    return compileToAudio(score, this.stateManagers)
  }

  /**
   * Reset all channel states to defaults.
   * Called when a new program starts or CLEAR button is pressed.
   */
  reset(): void {
    for (const manager of this.stateManagers) {
      manager.reset()
    }
  }

  /**
   * Get the state manager for a specific channel (for testing/debugging)
   */
  getStateManager(channelIndex: number): SoundStateManager | undefined {
    return this.stateManagers[channelIndex]
  }
}
