/**
 * Lesson 2: Variables — Numeric and string variables, assignment.
 *
 * Covers numeric variables, string variables (ending with $),
 * the 2-character name distinction rule, and default values.
 */

import type { Lesson } from '../types'

export const lesson2Variables: Lesson = {
  title: 'Variables',

  content: [
    '# Lesson 2: Variables',

    'A **variable** is a named box that stores a value.',
    'You assign values with `=` and use the variable name',
    'to recall the value later.',

    '## Numeric Variables',

    'Numeric variables hold numbers. Assign them like this:',

    '```basic',
    '10 A=10',
    '20 B=25',
    '30 PRINT A+B',
    '```',

    'Variable names start with a letter.',
    'The computer uses only the **first 2 characters** to',
    'tell variables apart, so `SCORE` and `SC` are the same:',

    '```basic',
    '10 SC=100',
    '20 SCORE=200',
    '30 PRINT SC',
    '```',

    '## String Variables',

    'String variables hold text. Their names end with `$`:',

    '```basic',
    '10 A$="MARIO"',
    '20 B$="LUIGI"',
    '30 PRINT A$',
    '40 PRINT B$',
    '```',

    'Just like numeric variables, only the first 2 characters',
    'of the name matter. `NA$` and `NAME$` refer to the same variable.',

    '## Combining Strings',

    'Use `+` to join two string variables:',

    '```basic',
    '10 A$="FAMILY"',
    '20 B$=" BASIC"',
    '30 PRINT A$+B$',
    '```',

    '## Default Values',

    'A numeric variable you have not assigned yet equals **0**.',
    'A string variable you have not assigned yet equals **""** (empty):',

    '```basic',
    '10 PRINT X',
    '20 PRINT Z$',
    '```',

    '## Try It',

    '```basic',
    '10 A=7',
    '20 B=3',
    '30 PRINT "A+B=";A+B',
    '40 N$="RESULT"',
    '50 PRINT N$;"=";A*B',
    '```',
  ].join('\n\n'),
}
