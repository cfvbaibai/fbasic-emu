/**
 * Test setup file for Vitest
 *
 * This file runs before each test file and sets up:
 * - Global test utilities
 * - Vue Test Utils configuration
 * - Mock implementations for browser APIs
 */

import { config } from '@vue/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'

// ============================================================================
// Vue Test Utils Configuration
// ============================================================================

// Global components or plugins can be registered here if needed
// config.global.components = { ... }
// config.global.plugins = [ ... ]

// Stub transitions by default for faster tests
config.global.stubs = {
  transition: true,
  'transition-group': true,
  RouterLink: true,
  RouterView: true,
}

// ============================================================================
// Browser API Mocks
// ============================================================================

// Mock ResizeObserver (required by some UI libraries)
const resizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
vi.stubGlobal('ResizeObserver', resizeObserverMock)

// Mock IntersectionObserver (required by lazy loading components)
const intersectionObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
vi.stubGlobal('IntersectionObserver', intersectionObserverMock)

// Mock matchMedia (required by responsive components)
const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
vi.stubGlobal('matchMedia', matchMediaMock)

// Mock scrollTo
vi.stubGlobal('scrollTo', vi.fn())

// Note: jsdom provides a working localStorage implementation, so we don't mock it.
// Tests that need isolated localStorage can use vi.stubGlobal in individual tests.

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Reset all mocks after each test
  vi.resetAllMocks()
})
