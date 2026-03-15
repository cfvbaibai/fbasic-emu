import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect } from 'vitest'

import { COLS, MAX_SPRITES, ROWS } from '@/core/animation/sharedDisplayBuffer'
import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { getCodeByChar } from '@/shared/utils/backgroundLookup'

export interface DisplaySnapshotMeta {
  sampleKey: string
  checkpoint: string
}

export interface SpriteSnapshot {
  actionNumber: number
  x: number
  y: number
  isActive: boolean
  isVisible: boolean
  frameIndex: number
  remainingDistance: number
  totalDistance: number
  direction: number
  speed: number
  priority: number
  characterType: number
  colorCombination: number
}

export interface DisplaySnapshotV1 {
  version: 1
  sequence: number
  cursor: { x: number; y: number }
  scalars: {
    bgPalette: number
    spritePalette: number
    backdropColor: number
    cgenMode: number
  }
  chars: number[]
  patterns: number[]
  sprites: SpriteSnapshot[]
  meta: DisplaySnapshotMeta
}

export interface WaitForStableOptions {
  stablePolls?: number
  intervalMs?: number
  timeoutMs?: number
}

const THIS_DIR = dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_FIXTURE_DIR = resolve(THIS_DIR, '..', 'fixtures', 'display-snapshots')

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waitForSequenceStable(
  accessor: SharedDisplayBufferAccessor,
  options: WaitForStableOptions = {}
): Promise<number> {
  const stablePolls = options.stablePolls ?? 3
  const intervalMs = options.intervalMs ?? 20
  const timeoutMs = options.timeoutMs ?? 1000
  const start = Date.now()

  let last = accessor.readSequence()
  let stableCount = 0

  while (Date.now() - start < timeoutMs) {
    await sleep(intervalMs)
    const next = accessor.readSequence()
    if (next === last) {
      stableCount++
      if (stableCount >= stablePolls) {
        return next
      }
    } else {
      stableCount = 0
      last = next
    }
  }

  throw new Error(`Sequence did not stabilize within ${timeoutMs}ms`)
}

export function captureDisplaySnapshotV1(
  accessor: SharedDisplayBufferAccessor,
  meta: DisplaySnapshotMeta
): DisplaySnapshotV1 {
  const state = accessor.readScreenState()
  const chars: number[] = []
  const patterns: number[] = []

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const idx = y * COLS + x
      const cell = state.buffer[y]?.[x]
      const char = cell?.character ?? ' '
      chars[idx] = getCodeByChar(char) ?? char.charCodeAt(0)
      patterns[idx] = cell?.colorPattern ?? 0
    }
  }

  const sprites: SpriteSnapshot[] = []
  for (let actionNumber = 0; actionNumber < MAX_SPRITES; actionNumber++) {
    const pos = accessor.readSpritePosition(actionNumber) ?? { x: 0, y: 0 }
    sprites.push({
      actionNumber,
      x: pos.x,
      y: pos.y,
      isActive: accessor.readSpriteIsActive(actionNumber),
      isVisible: accessor.readSpriteIsVisible(actionNumber),
      frameIndex: accessor.readSpriteFrameIndex(actionNumber),
      remainingDistance: accessor.readSpriteRemainingDistance(actionNumber),
      totalDistance: accessor.readSpriteTotalDistance(actionNumber),
      direction: accessor.readSpriteDirection(actionNumber),
      speed: accessor.readSpriteSpeed(actionNumber),
      priority: accessor.readSpritePriority(actionNumber),
      characterType: accessor.readSpriteCharacterType(actionNumber),
      colorCombination: accessor.readSpriteColorCombination(actionNumber),
    })
  }

  return {
    version: 1,
    sequence: accessor.readSequence(),
    cursor: { x: state.cursorX, y: state.cursorY },
    scalars: {
      bgPalette: state.bgPalette,
      spritePalette: state.spritePalette,
      backdropColor: state.backdropColor,
      cgenMode: state.cgenMode,
    },
    chars,
    patterns,
    sprites,
    meta,
  }
}

export function rowTextFromSnapshot(snapshot: DisplaySnapshotV1, row: number): string {
  const start = row * COLS
  const end = start + COLS
  return snapshot.chars
    .slice(start, end)
    .map(code => String.fromCharCode(code))
    .join('')
}

export function expectDisplaySnapshotToMatchFixture(snapshot: DisplaySnapshotV1, fixtureName: string): void {
  const fixturePath = resolve(SNAPSHOT_FIXTURE_DIR, `${fixtureName}.json`)
  if (process.env.UPDATE_DISPLAY_SNAPSHOTS === '1') {
    mkdirSync(SNAPSHOT_FIXTURE_DIR, { recursive: true })
    writeFileSync(fixturePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
    return
  }

  const expectedRaw = readFileSync(fixturePath, 'utf8')
  const expected = JSON.parse(expectedRaw) as DisplaySnapshotV1
  expect(snapshot).toEqual(expected)
}
