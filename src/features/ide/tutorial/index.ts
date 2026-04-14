/**
 * Barrel export for basics tutorial lessons (1-5).
 *
 * Imports all individual lesson modules and exports them
 * as a single ordered array for consumption by TutorialPanel.vue.
 */

import { lesson1Print } from './lessons/lesson1Print'
import { lesson2Variables } from './lessons/lesson2Variables'
import { lesson3Input } from './lessons/lesson3Input'
import { lesson4IfThen } from './lessons/lesson4IfThen'
import { lesson5ForNext } from './lessons/lesson5ForNext'
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
