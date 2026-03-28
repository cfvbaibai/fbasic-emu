# Shooting Game Sound Enhancement — Design

## Concept

Replace the flat, monophonic sound effects in the shooting game sample with rich 3-channel retro arcade music. The game is a 4-level sprite shooting gallery (crosshair control, escalating speed, score tracking, victory screen) — classic shmup aesthetic calls for chiptune-style sound.

## Creative Direction

**Retro Arcade / Classic Shmup** — chiptune that honors the NES-era feel. No BGM during gameplay (event-driven only), to keep focus on play and preserve classic arcade silences.

## Event Sound Map

| Event | Trigger (approx) | Character |
|-------|-----------------|-----------|
| Level Start | Start of each level | Ascending 4-note fanfare across all 3 channels, triumphant |
| Shoot | Player fires | Quick laser "pew" — short high note with sharp attack |
| Hit | Target destroyed | Satisfying chord stab + percussive burst, rewarding |
| Victory | All levels cleared | Full chord spread across channels + melodic flourish |

## 3-Channel Strategy

F-BASIC supports 3 independent audio channels (separated by colons in PLAY string). Use them to create depth:

- **Channel 0 (Bass)**: Low root notes — O2-O3 range, longer durations
- **Channel 1 (Lead)**: Melody/arpeggio — O4-O5 range, sharp attack
- **Channel 2 (Percussion)**: Noise bursts — timed rests to align with other channels

## Implementation Notes

- Event-driven only — no looping BGM during gameplay
- No tempo scaling with difficulty — keep it consistent across levels
- No repeating bgm phrases — each event plays its own distinct sound/music
- Keep music data separate from game logic (DATA/READ or similar)
- Preserve all existing game mechanics and logic

## Scope

Changes limited to `src/core/samples/programs/comprehensive/shooting.bas` only.
