/**
 * Lesson 4: IF/THEN — Conditional execution.
 *
 * Covers the IF...THEN statement for branching logic,
 * comparison operators, and jumping to line numbers.
 */

import type { Lesson } from '../types'

export const lesson4IfThen: Lesson = {
  title: 'IF / THEN',

  content: [
    '# Lesson 4: IF / THEN',

    'The `IF...THEN` statement lets your program make decisions.',
    'It checks a condition and runs a command only when',
    'the condition is true.',

    '## Basic Syntax',

    '```basic',
    'IF condition THEN command',
    '```',

    'If the condition is **true**, the command after `THEN` runs.',
    'If the condition is **false**, the program skips to the next line.',

    '## Comparison Operators',

    'You can compare values using these operators:',

    '- `=` — equal to',
    '- `<>` — not equal to',
    '- `>` — greater than',
    '- `<` — less than',
    '- `>=` — greater than or equal to',
    '- `<=` — less than or equal to',

    '## Simple Example',

    '```basic',
    '10 A=10',
    '20 IF A=10 THEN PRINT "A IS 10"',
    '30 IF A>5 THEN PRINT "A IS BIG"',
    '40 IF A<5 THEN PRINT "A IS SMALL"',
    '```',

    '## Jumping to a Line Number',

    'Instead of a command, you can put a line number after `THEN`',
    'to jump to that line:',

    '```basic',
    '10 A=0',
    '20 IF A=0 THEN 50',
    '30 PRINT "THIS LINE IS SKIPPED"',
    '40 END',
    '50 PRINT "JUMPED TO LINE 50"',
    '```',

    '## Comparing Strings',

    'You can also compare string variables:',

    '```basic',
    '10 A$="YES"',
    '20 IF A$="YES" THEN PRINT "OK!"',
    '30 IF A$<>"NO" THEN PRINT "NOT NO"',
    '```',

    '## Try It',

    '```basic',
    '10 INPUT "SCORE";S',
    '20 IF S>=100 THEN PRINT "GREAT!"',
    '30 IF S<100 THEN PRINT "KEEP TRYING"',
    '```',
  ].join('\n\n'),
}
