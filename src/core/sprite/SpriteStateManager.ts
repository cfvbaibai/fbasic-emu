/**
 * Sprite State Manager
 * Manages sprite definitions and states for DEF SPRITE and SPRITE commands
 */

import type { DefSpriteDefinition, SpriteState } from './types'

/**
 * SpriteStateManager - Manages 8 sprite slots (0-7)
 * Handles sprite definitions, positions, visibility, and priority
 */
export class SpriteStateManager {
  private spriteStates: Map<number, SpriteState> = new Map()
  private spriteEnabled = false

  constructor() {
    // Initialize 8 sprite slots
    for (let i = 0; i < 8; i++) {
      this.spriteStates.set(i, {
        spriteNumber: i,
        x: 0,
        y: 0,
        visible: false,
        priority: 0,
        definition: null,
      })
    }
  }

  /**
   * Enable or disable sprite display globally
   * Controls whether sprites are rendered, but does not affect sprite state
   * Sprites can be defined and positioned even when display is disabled
   */
  setSpriteEnabled(enabled: boolean): void {
    this.spriteEnabled = enabled
  }

  /**
   * Check if sprite display is enabled
   */
  isSpriteEnabled(): boolean {
    return this.spriteEnabled
  }

  /**
   * Define a sprite (DEF SPRITE command)
   * Stores the sprite definition but does not make it visible
   */
  defineSprite(definition: DefSpriteDefinition): void {
    const sprite = this.spriteStates.get(definition.spriteNumber)
    if (!sprite) {
      throw new Error(`Invalid sprite number: ${definition.spriteNumber}`)
    }

    sprite.definition = definition
    sprite.priority = definition.priority
  }

  /**
   * Display a sprite at specified position (SPRITE command)
   * Makes the sprite visible and sets its position
   */
  displaySprite(spriteNumber: number, x: number, y: number): void {
    const sprite = this.spriteStates.get(spriteNumber)
    if (!sprite) {
      throw new Error(`Invalid sprite number: ${spriteNumber}`)
    }

    if (!sprite.definition) {
      throw new Error(`Sprite ${spriteNumber} has no definition (use DEF SPRITE first)`)
    }

    sprite.x = x
    sprite.y = y
    sprite.visible = true
  }

  /**
   * Hide a sprite
   */
  hideSprite(spriteNumber: number): void {
    const sprite = this.spriteStates.get(spriteNumber)
    if (sprite) {
      sprite.visible = false
    }
  }

  /**
   * Get sprite state for a slot.
   * @param spriteNumber - Sprite slot 0-7
   * @returns SpriteState or undefined
   */
  getSpriteState(spriteNumber: number): SpriteState | undefined {
    return this.spriteStates.get(spriteNumber)
  }

  /**
   * Get all sprite states (all 8 slots).
   * @returns Array of SpriteState for slots 0-7
   */
  getAllSpriteStates(): SpriteState[] {
    return Array.from(this.spriteStates.values())
  }

  /**
   * Get all visible sprite states.
   * @returns Array of SpriteState where visible === true
   */
  getVisibleSprites(): SpriteState[] {
    return Array.from(this.spriteStates.values()).filter(s => s.visible)
  }

  /**
   * Clear all sprite definitions and states
   */
  clear(): void {
    this.spriteStates.clear()
    // Reinitialize
    for (let i = 0; i < 8; i++) {
      this.spriteStates.set(i, {
        spriteNumber: i,
        x: 0,
        y: 0,
        visible: false,
        priority: 0,
        definition: null,
      })
    }
  }

  /**
   * Reset a specific sprite slot to default (no definition, hidden, 0,0).
   * @param spriteNumber - Sprite slot 0-7
   */
  resetSprite(spriteNumber: number): void {
    this.spriteStates.set(spriteNumber, {
      spriteNumber,
      x: 0,
      y: 0,
      visible: false,
      priority: 0,
      definition: null,
    })
  }
}
