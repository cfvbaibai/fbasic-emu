/**
 * Barrel export for tutorial lesson data files.
 *
 * Imports all individual lesson modules and exports them
 * as ordered arrays for consumption by TutorialPanel.vue.
 */

import { lesson1Print } from './lessons/lesson1Print'
import { lesson2Variables } from './lessons/lesson2Variables'
import { lesson3Input } from './lessons/lesson3Input'
import { lesson4IfThen } from './lessons/lesson4IfThen'
import { lesson5ForNext } from './lessons/lesson5ForNext'
import { lesson6Cls } from './lessons/lesson6Cls'
import { lesson7Color } from './lessons/lesson7Color'
import { lesson8Locate } from './lessons/lesson8Locate'
import { lesson9Sprites } from './lessons/lesson9Sprites'
import { lesson10SpriteMovement } from './lessons/lesson10SpriteMovement'
import { lesson11SpritePosition } from './lessons/lesson11SpritePosition'
import { lesson12BackgroundGraphics } from './lessons/lesson12BackgroundGraphics'
import { lesson13SpriteColors } from './lessons/lesson13SpriteColors'
import { lesson14PlayingSound } from './lessons/lesson14PlayingSound'
import { lesson15BackgroundMusic } from './lessons/lesson15BackgroundMusic'
import { lesson16BuildingAGame1 } from './lessons/lesson16BuildingAGame1'
import { lesson17BuildingAGame2 } from './lessons/lesson17BuildingAGame2'
import type { Lesson } from './types'

/**
 * Ordered array of basics tutorial lessons.
 *
 * Lesson order:
 * 1. PRINT — output text and values to screen
 * 2. Variables — numeric and string variables, assignment
 * 3. INPUT — getting user input
 * 4. IF/THEN — conditional execution
 * 5. FOR/NEXT — loops
 */
export const basicsLessons: Lesson[] = [
  lesson1Print,
  lesson2Variables,
  lesson3Input,
  lesson4IfThen,
  lesson5ForNext,
]

/**
 * Ordered array of screen tutorial lessons.
 *
 * Lesson order:
 * 6. CLS — clearing the screen
 * 7. COLOR — setting text and background colors
 * 8. LOCATE — cursor positioning and screen functions
 */
export const screenLessons: Lesson[] = [
  lesson6Cls,
  lesson7Color,
  lesson8Locate,
]

/**
 * Ordered array of games tutorial lessons.
 *
 * Lesson order:
 * 9. Sprites — introduction to sprites, DEF SPRITE, SPRITE ON/OFF
 * 10. Sprite Movement — DEF MOVE, MOVE, CUT
 * 11. Sprite Position — XPOS, YPOS, ERA
 * 12. Background Graphics — CGSET, PALETB, VIEW
 * 13. Sprite Colors — PALETS, combining sprites with backgrounds
 * 14. Playing Sound — PLAY statement, notes, tempo, duration
 * 15. Background Music — BGPLAY, BGMSTOP
 * 16. Building a Game (Part 1) — sprites, movement, collision
 * 17. Building a Game (Part 2) — sound, score, game over
 */
export const gamesLessons: Lesson[] = [
  lesson9Sprites,
  lesson10SpriteMovement,
  lesson11SpritePosition,
  lesson12BackgroundGraphics,
  lesson13SpriteColors,
  lesson14PlayingSound,
  lesson15BackgroundMusic,
  lesson16BuildingAGame1,
  lesson17BuildingAGame2,
]
