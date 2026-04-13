/**
 * Tests for games tutorial lesson data files.
 *
 * Validates the Lesson interface, lesson structure,
 * content completeness, and F-BASIC syntax correctness.
 */

import { describe, expect, it } from 'vitest'

import { gamesLessons } from '@/features/ide/tutorial/index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Keywords expected in each games lesson's code blocks.
 * Mapped by lesson index to the primary F-BASIC keyword
 * that lesson teaches.
 */
const LESSON_KEYWORDS: Array<RegExp> = [
  /\bSPRITE\b/,
  /\bDEF\s+MOVE\b/,
  /\bXPOS\b/,
  /\bCGSET\b/,
  /\bPALETS\b/,
  /\bPLAY\b/,
  /\bBGPLAY\b/,
  /\bGOTO\b/,
  /\bBGMSTOP\b/,
]

/**
 * Extracts all fenced code block contents from a markdown string.
 */
function extractCodeBlocks(markdown: string): string[] {
  const blocks: string[] = []
  const regex = /```(?:\w*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(markdown)) !== null) {
    const code = match[1]?.trim()
    if (code != null && code.length > 0) {
      blocks.push(code)
    }
  }
  return blocks
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('gamesLessons', () => {
  it('exports an array of exactly 9 lessons', () => {
    expect(gamesLessons).toHaveLength(9)
  })

  it('each entry satisfies the Lesson interface', () => {
    for (const lesson of gamesLessons) {
      expect(typeof lesson.title).toEqual('string')
      expect(typeof lesson.content).toEqual('string')
    }
  })

  it('each lesson has a non-empty title', () => {
    const expectedTitles = [
      'Sprites',
      'Sprite Movement',
      'Sprite Position',
      'Background Graphics',
      'Sprite Colors',
      'Playing Sound',
      'Background Music',
      'Building a Game (Part 1)',
      'Building a Game (Part 2)',
    ]

    for (let i = 0; i < gamesLessons.length; i++) {
      const lesson = gamesLessons[i]!
      expect(lesson.title.length).toBeGreaterThan(0)
      expect(lesson.title).toEqual(expectedTitles[i])
    }
  })

  it('each lesson has non-empty content', () => {
    for (const lesson of gamesLessons) {
      expect(lesson.content.length).toBeGreaterThan(0)
    }
  })

  it('each lesson contains at least one fenced code block', () => {
    for (const lesson of gamesLessons) {
      const blocks = extractCodeBlocks(lesson.content)
      expect(blocks.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('code blocks contain expected F-BASIC keywords', () => {
    for (let i = 0; i < gamesLessons.length; i++) {
      const lesson = gamesLessons[i]!
      const blocks = extractCodeBlocks(lesson.content)
      const allCode = blocks.join('\n')
      const keyword = LESSON_KEYWORDS[i]!
      expect(allCode).toMatch(keyword)
    }
  })

  it('all lessons export const values are usable independently', async () => {
    const { lesson9Sprites } = await import(
      '@/features/ide/tutorial/lessons/lesson9Sprites'
    )
    const { lesson10SpriteMovement } = await import(
      '@/features/ide/tutorial/lessons/lesson10SpriteMovement'
    )
    const { lesson11SpritePosition } = await import(
      '@/features/ide/tutorial/lessons/lesson11SpritePosition'
    )
    const { lesson12BackgroundGraphics } = await import(
      '@/features/ide/tutorial/lessons/lesson12BackgroundGraphics'
    )
    const { lesson13SpriteColors } = await import(
      '@/features/ide/tutorial/lessons/lesson13SpriteColors'
    )
    const { lesson14PlayingSound } = await import(
      '@/features/ide/tutorial/lessons/lesson14PlayingSound'
    )
    const { lesson15BackgroundMusic } = await import(
      '@/features/ide/tutorial/lessons/lesson15BackgroundMusic'
    )
    const { lesson16BuildingAGame1 } = await import(
      '@/features/ide/tutorial/lessons/lesson16BuildingAGame1'
    )
    const { lesson17BuildingAGame2 } = await import(
      '@/features/ide/tutorial/lessons/lesson17BuildingAGame2'
    )

    expect(lesson9Sprites.title).toEqual('Sprites')
    expect(lesson10SpriteMovement.title).toEqual('Sprite Movement')
    expect(lesson11SpritePosition.title).toEqual('Sprite Position')
    expect(lesson12BackgroundGraphics.title).toEqual('Background Graphics')
    expect(lesson13SpriteColors.title).toEqual('Sprite Colors')
    expect(lesson14PlayingSound.title).toEqual('Playing Sound')
    expect(lesson15BackgroundMusic.title).toEqual('Background Music')
    expect(lesson16BuildingAGame1.title).toEqual('Building a Game (Part 1)')
    expect(lesson17BuildingAGame2.title).toEqual('Building a Game (Part 2)')
  })

  it('Sprites lesson explains sprite basics', () => {
    const lesson = gamesLessons[0]!
    expect(lesson.content).toMatch(/SPRITE ON/)
    expect(lesson.content).toMatch(/DEF SPRITE/)
    expect(lesson.content).toMatch(/sprite/i)
  })

  it('Sprite Movement lesson explains animation', () => {
    const lesson = gamesLessons[1]!
    expect(lesson.content).toMatch(/DEF MOVE/)
    expect(lesson.content).toMatch(/\bMOVE\b/)
    expect(lesson.content).toMatch(/\bCUT\b/)
    expect(lesson.content).toMatch(/move/i)
  })

  it('Sprite Position lesson explains tracking', () => {
    const lesson = gamesLessons[2]!
    expect(lesson.content).toMatch(/\bXPOS\b/)
    expect(lesson.content).toMatch(/\bYPOS\b/)
    expect(lesson.content).toMatch(/\bERA\b/)
    expect(lesson.content).toMatch(/position/i)
  })

  it('Background Graphics lesson explains palettes', () => {
    const lesson = gamesLessons[3]!
    expect(lesson.content).toMatch(/\bCGSET\b/)
    expect(lesson.content).toMatch(/\bPALETB\b/)
    expect(lesson.content).toMatch(/\bVIEW\b/)
    expect(lesson.content).toMatch(/background/i)
  })

  it('Sprite Colors lesson explains PALETS', () => {
    const lesson = gamesLessons[4]!
    expect(lesson.content).toMatch(/\bPALETS\b/)
    expect(lesson.content).toMatch(/color/i)
  })

  it('Playing Sound lesson explains PLAY', () => {
    const lesson = gamesLessons[5]!
    expect(lesson.content).toMatch(/\bPLAY\b/)
    expect(lesson.content).toMatch(/note/i)
    expect(lesson.content).toMatch(/tempo/i)
  })

  it('Background Music lesson explains BGPLAY', () => {
    const lesson = gamesLessons[6]!
    expect(lesson.content).toMatch(/\bBGPLAY\b/)
    expect(lesson.content).toMatch(/\bBGMSTOP\b/)
    expect(lesson.content).toMatch(/music/i)
  })

  it('Building a Game (Part 1) lesson explains collision', () => {
    const lesson = gamesLessons[7]!
    expect(lesson.content).toMatch(/collision/i)
    expect(lesson.content).toMatch(/game/i)
  })

  it('Building a Game (Part 2) lesson explains score', () => {
    const lesson = gamesLessons[8]!
    expect(lesson.content).toMatch(/score/i)
    expect(lesson.content).toMatch(/game/i)
    expect(lesson.content).toMatch(/sound/i)
  })
})
