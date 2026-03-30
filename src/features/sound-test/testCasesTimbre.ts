/**
 * Test Case Data for Timbre & Output
 *
 * Duty cycle (waveform), envelope, volume, multi-channel, and complete songs.
 */

import type { SoundTestCase } from './soundTestTypes'

// ============================================
// Duty Cycle
// ============================================
export const DUTY_CYCLE_TESTS: SoundTestCase[] = [
  {
    id: 'duty-y0',
    category: 'Duty Cycle',
    name: 'Duty Y0 (12.5%)',
    description: 'Narrow pulse wave',
    musicString: 'Y0CDEFGAB',
    expectedBehavior: 'Thin, buzzy sound (12.5% duty cycle)',
  },
  {
    id: 'duty-y1',
    category: 'Duty Cycle',
    name: 'Duty Y1 (25%)',
    description: 'Quarter pulse wave',
    musicString: 'Y1CDEFGAB',
    expectedBehavior: 'Slightly fuller buzzy sound (25% duty cycle)',
  },
  {
    id: 'duty-y2',
    category: 'Duty Cycle',
    name: 'Duty Y2 (50% - Default)',
    description: 'Square wave - default',
    musicString: 'Y2CDEFGAB',
    expectedBehavior: 'Classic 8-bit square wave sound (50% duty, this is default)',
  },
  {
    id: 'duty-y3',
    category: 'Duty Cycle',
    name: 'Duty Y3 (75%)',
    description: 'Wide pulse wave',
    musicString: 'Y3CDEFGAB',
    expectedBehavior: 'Fuller, more hollow sound (75% duty cycle)',
  },
  {
    id: 'duty-compare',
    category: 'Duty Cycle',
    name: 'Duty Cycle Comparison',
    description: 'Compare all duty cycles',
    musicString: 'Y0CY1CY2CY3C',
    expectedBehavior: 'Same note with 4 different timbres',
  },
]

// ============================================
// Envelope
// ============================================
export const ENVELOPE_TESTS: SoundTestCase[] = [
  {
    id: 'envelope-m0',
    category: 'Envelope',
    name: 'Envelope M0 (Volume Mode)',
    description: 'Constant volume',
    musicString: 'M0V15C',
    expectedBehavior: 'Note at constant maximum volume (no decay)',
  },
  {
    id: 'envelope-m1',
    category: 'Envelope',
    name: 'Envelope M1 (Decay Mode)',
    description: 'Decaying volume',
    musicString: 'M1V15C9',
    expectedBehavior: 'Note starts loud and gradually fades (exponential decay)',
  },
  {
    id: 'envelope-compare',
    category: 'Envelope',
    name: 'M0 vs M1 Comparison',
    description: 'Compare volume modes',
    musicString: 'M0V15C9 M1V15C9',
    expectedBehavior: 'First note constant volume, second note fades',
  },
  {
    id: 'envelope-short',
    category: 'Envelope',
    name: 'M1 Short Decay (V0)',
    description: 'Quick decay',
    musicString: 'M1V0C9',
    expectedBehavior: 'Note fades very quickly',
  },
  {
    id: 'envelope-long',
    category: 'Envelope',
    name: 'M1 Long Decay (V15)',
    description: 'Slow decay',
    musicString: 'M1V15C9',
    expectedBehavior: 'Note fades slowly over the full duration',
  },
]

// ============================================
// Volume
// ============================================
export const VOLUME_TESTS: SoundTestCase[] = [
  {
    id: 'volume-v0',
    category: 'Volume',
    name: 'Volume V0 (Silent)',
    description: 'Minimum volume - should be silent',
    musicString: 'M0V0C',
    expectedBehavior: 'Should be silent or nearly silent',
  },
  {
    id: 'volume-v7',
    category: 'Volume',
    name: 'Volume V7 (Medium)',
    description: 'Medium volume',
    musicString: 'M0V7C',
    expectedBehavior: 'Medium volume tone',
  },
  {
    id: 'volume-v15',
    category: 'Volume',
    name: 'Volume V15 (Maximum)',
    description: 'Maximum volume',
    musicString: 'M0V15C',
    expectedBehavior: 'Loud, full volume tone',
  },
  {
    id: 'volume-crescendo',
    category: 'Volume',
    name: 'Volume Crescendo',
    description: 'Gradually increasing volume',
    musicString: 'M0V1CM0V5CM0V10CM0V15C',
    expectedBehavior: 'Four notes getting progressively louder',
  },
]

// ============================================
// Multi-Channel
// ============================================
export const MULTI_CHANNEL_TESTS: SoundTestCase[] = [
  {
    id: 'channel-2ch-harmony',
    category: 'Multi-Channel',
    name: '2-Channel Harmony',
    description: 'Two notes played simultaneously',
    musicString: 'C:E',
    expectedBehavior: 'Two tones at once (C and E) forming a harmony',
  },
  {
    id: 'channel-3ch-harmony',
    category: 'Multi-Channel',
    name: '3-Channel Harmony',
    description: 'Three notes played simultaneously',
    musicString: 'C:E:G',
    expectedBehavior: 'Three tones at once (C, E, G) forming a C major chord',
  },
  {
    id: 'channel-melody-bass',
    category: 'Multi-Channel',
    name: 'Melody + Bass',
    description: 'High melody with low bass',
    musicString: 'O3CDEFGAB:O1C9',
    expectedBehavior: 'High melody (scale) with sustained low bass note',
  },
  {
    id: 'channel-counterpoint',
    category: 'Multi-Channel',
    name: 'Counterpoint',
    description: 'Two independent melodies',
    musicString: 'O2C5D5E5F5G5:O3E5F5G5A5B5',
    expectedBehavior: 'Two melodies playing at once, starting at different notes',
  },
  {
    id: 'channel-full-chord',
    category: 'Multi-Channel',
    name: 'Full Chord Progression',
    description: 'Chord progression with 3 voices',
    musicString: 'O3C9:O3E9:O3G9 O3F9:O3A9:O4C9 O3G9:O3B9:O4D9 O3C9:O3E9:O3G9',
    expectedBehavior: 'C major -> F major -> G major -> C major chord progression',
  },
]

// ============================================
// Complete Songs
// ============================================
export const COMBINED_TESTS: SoundTestCase[] = [
  {
    id: 'combined-twinkle',
    category: 'Complete Songs',
    name: 'Twinkle Twinkle Little Star',
    description: 'Simple nursery rhyme',
    musicString: 'T3 CCGGAAG7 FFEEDDC7',
    expectedBehavior: 'Should recognize "Twinkle Twinkle Little Star" melody',
  },
  {
    id: 'combined-scale-updown',
    category: 'Complete Songs',
    name: 'Scale Up and Down',
    description: 'C major scale ascending and descending',
    musicString: 'T4 O2C5D5E5F5G5A5B5O3C5 O3C5O2B5A5G5F5E5D5C5',
    expectedBehavior: 'Scale goes up, then back down',
  },
]
