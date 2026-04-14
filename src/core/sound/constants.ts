/**
 * Sound System Constants
 *
 * Shared constants for the PLAY command sound system.
 */

/**
 * Envelope decay time calibration table (milliseconds)
 *
 * Base values from NES APU hardware specification:
 * - Volume decrements from 15 to 0 in 16 steps
 * - Each step takes (V+1)/240 seconds (NTSC 240Hz clock)
 * - Total decay time = 16 × (V+1) / 240 seconds
 *
 * V0 = 66.7ms (fastest decay)
 * V15 = 1066.7ms (slowest decay)
 */
export const ENVELOPE_DECAY_BASE: Record<number, number> = {
  0: 66.7,
  1: 133.3,
  2: 200.0,
  3: 266.7,
  4: 333.3,
  5: 400.0,
  6: 466.7,
  7: 533.3,
  8: 600.0,
  9: 666.7,
  10: 733.3,
  11: 800.0,
  12: 866.7,
  13: 933.3,
  14: 1000.0,
  15: 1066.7,
}

/**
 * Channel index for Channel C (third channel)
 * Per F-BASIC manual page 81: "envelope and duty do not change for channel C"
 */
export const CHANNEL_C_INDEX = 2

/**
 * Default envelope mode for Channel C
 * Channel C uses fixed volume mode (M0) with max volume
 */
export const CHANNEL_C_DEFAULT_ENVELOPE = 0

/**
 * Default duty cycle for Channel C
 * Channel C uses 50% duty cycle (Y2)
 */
export const CHANNEL_C_DEFAULT_DUTY = 2

/**
 * Default volume for composer playback preview (0-15 scale)
 *
 * Used by the music composer's real-time preview to set initial channel volume.
 * The F-BASIC volume range is 0-15; 10 provides a comfortable listening level.
 */
export const COMPOSER_DEFAULT_VOLUME = 10
