/**
 * Lesson 15: Background Music — Non-blocking music with BGPLAY.
 *
 * Covers BGPLAY for playing background music,
 * BGMSTOP for stopping it, and combining music with programs.
 */

import type { Lesson } from '../types'

export const lesson15BackgroundMusic: Lesson = {
  title: 'Background Music',

  content: [
    '# Lesson 15: Background Music',

    'Unlike `PLAY` which blocks your program,',
    '`BGPLAY` plays music in the background.',
    'This means your program can keep running',
    'while the music plays.',

    '## BGPLAY — Background Music',

    '```basic',
    'BGPLAY "music string"',
    '```',

    'The music string uses the same format as `PLAY`:',
    '- Notes: `C`, `D`, `E`, `F`, `G`, `A`, `B`',
    '- Octave: `O` followed by a number',
    '- Tempo: `T` followed by a number',
    '- Duration: number after a note',

    '## Basic Example',
    '```basic',
    '10 BGPLAY "T5O4C4D4E4F4G4A4B4"',
    '20 FOR I=1 TO 10',
    '30 PRINT "MUSIC IS PLAYING";I',
    '40 PAUSE 20',
    '50 NEXT',
    '60 PRINT "DONE"',
    '```',

    'The music plays while the program',
    'continues to print messages.',

    '## Combining Music with Sprites',

    'Background music works great with games:',
    '```basic',
    '10 SPRITE ON',
    '20 BGPLAY "T5O3C4C4G4G4A4A4G8"',
    '30 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '40 SPRITE 0,10,100',
    '50 DEF MOVE(0)=SPRITE(0,0,4,200,0,1)',
    '60 MOVE 0',
    '70 PAUSE 60',
    '80 CUT 0',
    '90 LOCATE 0,22',
    '```',

    '## Starting New Music',

    'You can call `BGPLAY` again to start',
    'a new song. The old song is replaced:',
    '```basic',
    '10 BGPLAY "T5O4C4D4E4"',
    '20 PAUSE 60',
    '30 BGPLAY "T5O3E4E4F4G4"',
    '40 PAUSE 60',
    '50 LOCATE 0,22',
    '```',

    '## Stopping Background Music',

    'Use `BGMSTOP` to stop background music',
    'entirely. This is different from calling',
    '`BGPLAY` again — it silences the music',
    'without starting a new song:',
    '```basic',
    '10 BGPLAY "T5O4C4D4E4F4G4A4B4"',
    '20 PAUSE 40',
    '30 BGMSTOP',
    '40 PRINT "MUSIC STOPPED"',
    '```',

    '## PLAY vs BGPLAY vs BGMSTOP',

    '- `PLAY` — Waits for music to finish',
    '  before continuing the program',
    '- `BGPLAY` — Music plays in the background',
    '  while the program continues',
    '- `BGPLAY` again — Replaces the current song',
    '- `BGMSTOP` — Stops background music entirely',

    'Use `PLAY` for sound effects and short sounds.',
    'Use `BGPLAY` for background music in games.',
    'Use `BGMSTOP` to silence the music.',

    '## Try It',

    'Try a program with background music',
    'and sprites:',
    '```basic',
    '10 SPRITE ON',
    '20 BGPLAY "T5O4E4E4F4G4G4F4E4D4C4"',
    '30 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '40 FOR I=0 TO 15',
    '50 SPRITE 0,I*15,80',
    '60 PAUSE 10',
    '70 NEXT',
    '80 ERA 0',
    '90 PRINT "END"',
    '```',
  ].join('\n\n'),
}
