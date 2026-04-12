/** Minimal interface for reading screen character and pattern data from the shared display buffer. */
export interface ScreenBufferReader {
  readScreenChar(x: number, y: number): number
  readScreenPattern(x: number, y: number): number
}
