/**
 * Export Runtime — Bootloader for standalone F-BASIC HTML export
 *
 * Provides the {@link runExportProgram} function that wires the parser,
 * interpreter, and main-thread device adapter together for execution
 * in a standalone HTML file (no web workers, no SharedArrayBuffer).
 *
 * This module is the entry point for the Vite library build that produces
 * a self-contained IIFE bundle inlined into exported HTML files.
 */

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { MainThreadDeviceAdapter } from '@/core/devices/MainThreadDeviceAdapter'
import type { ExecutionResult } from '@/core/types/execution-types'

/** Options for running an export program. */
export interface RunExportProgramOptions {
  /** The F-BASIC program source code to execute. */
  source: string
  /** The canvas surface to render output to. */
  canvas: CanvasSurface
  /** Maximum number of interpreter iterations before stopping. */
  maxIterations: number
}

/**
 * Runs an F-BASIC program on the main thread with a canvas device adapter.
 *
 * Creates a {@link MainThreadDeviceAdapter} wired to the provided canvas,
 * then creates a {@link BasicInterpreter} and executes the given program
 * source. Returns the execution result including success status, errors,
 * and execution time.
 *
 * This is the entry point called by the standalone HTML export to run
 * F-BASIC programs without web workers or SharedArrayBuffer.
 *
 * @param options - Program source, canvas, and execution limits
 * @returns The execution result from the interpreter
 */
export async function runExportProgram(
  options: RunExportProgramOptions,
): Promise<ExecutionResult> {
  const deviceAdapter = new MainThreadDeviceAdapter({ canvas: options.canvas })

  const config = {
    deviceAdapter,
    maxIterations: options.maxIterations,
    maxOutputLines: Infinity,
  }

  const interpreter = new BasicInterpreter(config)

  const result = await interpreter.execute(options.source)

  return result
}
