/**
 * Lesson 3: INPUT — Getting user input from the keyboard.
 *
 * Covers the INPUT statement with prompt strings,
 * numeric and string variable input, and basic usage patterns.
 */

import type { Lesson } from '../types'

export const lesson3Input: Lesson = {
  title: 'INPUT',

  content: [
    '# Lesson 3: INPUT',

    'The `INPUT` command waits for the user to type something',
    'on the keyboard and stores it in a variable.',

    '## Basic Input',

    'When `INPUT` runs, a `?` appears on screen.',
    'Type a value and press RETURN:',

    '```basic',
    '10 INPUT A',
    '20 PRINT "YOU TYPED:";A',
    '```',

    '## Adding a Prompt',

    'You can display a message before the `?` by placing',
    'a text string followed by `;`:',

    '```basic',
    '10 INPUT "YOUR NAME";N$',
    '20 PRINT "HELLO,";N$;"!"',
    '```',

    '## Numeric Input',

    '`INPUT` works with numeric variables too.',
    'The computer converts the typed text into a number:',

    '```basic',
    '10 INPUT "A=";A',
    '20 INPUT "B=";B',
    '30 PRINT "A+B=";A+B',
    '```',

    '## String Input',

    'For string variables, whatever you type is stored as text.',

    '```basic',
    '10 INPUT "TYPE SOMETHING";W$',
    '20 PRINT "YOU SAID:";W$',
    '```',

    '## Try It',

    'Try this small program that asks for your name and age:',

    '```basic',
    '10 INPUT "NAME";N$',
    '20 INPUT "AGE";A',
    '30 PRINT N$;" IS ";A;" YEARS OLD"',
    '```',
  ].join('\n\n'),
}
