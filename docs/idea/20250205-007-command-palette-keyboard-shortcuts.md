# Strategic Idea: Command Palette & Keyboard-First Development Experience

**Date**: 2025-02-05
**Turn**: 7
**Status**: Conceptual
**Focus Area**: Developer Experience & Productivity
**Type**: SMALL (Focused feature implementable in 1-2 weeks)

## Vision

Add a **command palette and comprehensive keyboard shortcut system** to the Family Basic IDE that enables power-user workflow patterns—making F-BASIC development faster, more accessible, and aligned with modern IDE expectations.

## Problem Statement

### Current Developer Experience Issues

1. **Mouse-Dependent Workflow**: F-BASIC developers must use mouse for most operations
   - No quick way to run programs without clicking "Run" button
   - Sample code selection requires navigation through menus
   - Settings changes require multiple clicks through panels
   - Cannot execute commands without visual navigation

2. **No Command Discovery**: Hidden features remain undiscovered
   - Users don't know available commands without exploring UI
   - No centralized place to see all possible actions
   - Features like sprite viewer are hard to find
   - Sample programs buried in navigation

3. **Slow Iteration Cycles**: Manual operations slow down development
   - Code → Click Run → Wait → Click Stop → Edit cycle is slow
   - No quick way to toggle debug modes
   - Screen clearing requires navigation
   - Joystick configuration is tedious to access

4. **Accessibility Gap**: Keyboard-only users have limited experience
   - Not all features accessible via keyboard
   - No focus indicators for navigation
   - Screen reader users cannot efficiently navigate
   - Motor accessibility accommodations limited

5. **Modern IDE Expectations**: Developers expect VS Code-style workflow
   - Command palette (Ctrl+Shift+P) is standard in modern IDEs
   - Keyboard shortcuts are expected for common operations
   - Power users prefer keyboard-driven workflow
   - Muscle memory from other IDEs doesn't transfer

## Proposed Solution

### 1. Command Palette (Ctrl+Shift+P / Cmd+Shift+P)

Centralized command execution interface:

```typescript
interface Command {
  id: string
  title: string
  description?: string
  category: 'run' | 'edit' | 'view' | 'tools' | 'settings' | 'help'
  icon?: string
  shortcut?: string
  handler: () => void | Promise<void>
  when?: () => boolean  // Conditional availability
}

interface CommandPaletteState {
  isOpen: boolean
  query: string
  selectedIndex: number
  filteredCommands: Command[]
  recentCommands: string[]  // MRU list
}
```

**Command Categories:**

**Run Commands:**
- `run.start` - Start program execution (Ctrl+Enter / Cmd+Enter)
- `run.stop` - Stop execution (Ctrl+Shift+Enter / Cmd+Shift+Enter)
- `run.restart` - Restart program (Ctrl+Shift+R / Cmd+Shift+R)
- `run.step` - Step execution (F10)
- `run.clearScreen` - Clear output screen (Ctrl+L)

**Edit Commands:**
- `editor.formatDocument` - Format code (Shift+Alt+F)
- `editor.toggleLineNumbers` - Toggle line numbers
- `editor.gotoLine` - Go to line (Ctrl+G)
- `editor.find` - Find in code (Ctrl+F)
- `editor.replace` - Find and replace (Ctrl+H)

**View Commands:**
- `view.toggleSpriteViewer` - Toggle sprite viewer panel
- `view.toggleControls` - Toggle joystick controls
- `view.toggleOutput` - Toggle output screen
- `view.zoomIn` - Zoom in (Ctrl++)
- `view.zoomOut` - Zoom out (Ctrl+-)
- `view.resetZoom` - Reset zoom (Ctrl+0)

**Tools Commands:**
- `tools.imageAnalyzer` - Open image analyzer
- `tools.soundTest` - Test sound/music
- `tools.characterEditor` - Character sprite editor
- `tools.memoryInspector` - Inspect variable memory

**Sample Commands:**
- `samples.load` - Load sample program...
  - `samples.helloWorld` - Hello World
  - `samples.spriteDemo` - Sprite Demo
  - `samples.musicDemo` - Music Demo
  - (Dynamic list from samples directory)

**Settings Commands:**
- `settings.toggleLanguage` - Change language (en/ja/zh-CN/zh-TW)
- `settings.toggleTheme` - Toggle light/dark theme
- `settings.keybindings` - Configure keyboard shortcuts
- `settings.resetSettings` - Reset to defaults

### 2. Keyboard Shortcuts System

Comprehensive shortcut coverage:

```typescript
interface Keybinding {
  command: string
  key: string
  mac?: string  // macOS-specific alternative
  when?: string  // Context condition
}

interface KeybindingConfig {
  shortcuts: Keybinding[]
  userOverrides: Map<string, string>
}
```

**Default Keybindings:**

| Command | Windows/Linux | macOS | Context |
|---------|---------------|-------|---------|
| **Run** |
| Start program | Ctrl+Enter | Cmd+Enter | Always |
| Stop program | Ctrl+Shift+Enter | Cmd+Shift+Enter | Running |
| Restart | Ctrl+Shift+R | Cmd+Shift+R | Always |
| Step | F10 | F10 | Debugging |
| Clear screen | Ctrl+L | Cmd+L | Always |
| **Editor** |
| Find | Ctrl+F | Cmd+F | Editor focused |
| Replace | Ctrl+H | Cmd+H | Editor focused |
| Go to line | Ctrl+G | Cmd+G | Editor focused |
| Format | Shift+Alt+F | Shift+Opt+F | Editor focused |
| Toggle comment | Ctrl+/ | Cmd+/ | Editor focused |
| **Navigation** |
| Command palette | Ctrl+Shift+P | Cmd+Shift+P | Always |
| Quick open | Ctrl+P | Cmd+P | Always |
| Focus editor | Ctrl+1 | Cmd+1 | Always |
| Focus output | Ctrl+2 | Cmd+2 | Always |
| **View** |
| Toggle sidebar | Ctrl+B | Cmd+B | Always |
| Toggle sprite viewer | Ctrl+Shift+S | Cmd+Shift+S | Always |
| Toggle controls | Ctrl+Shift+K | Cmd+Shift+K | Always |
| Zoom in | Ctrl++ | Cmd++ | Always |
| Zoom out | Ctrl+- | Cmd+- | Always |
| **File** |
| New file | Ctrl+N | Cmd+N | Always |
| Save | Ctrl+S | Cmd+S | Always |
| Export | Ctrl+E | Cmd+E | Always |
| Import | Ctrl+I | Cmd+I | Always |

### 3. Quick Open (Ctrl+P / Cmd+P)

Fast file and sample navigation:

```typescript
interface QuickOpenItem {
  type: 'file' | 'sample' | 'recent'
  label: string
  description?: string
  icon: string
  action: () => void
  metadata?: {
    path?: string
    lastAccessed?: Date
    category?: string
  }
}
```

**Quick Open Features:**
- Fuzzy search across files and samples
- Recent files (MRU list)
- Sample programs by category
- Symbol search (future: jump to line numbers, labels)
- Keyboard navigation (arrow keys + Enter)

### 4. Shortcut Conflict Resolution

Handle keybinding conflicts gracefully:

```typescript
interface KeybindingConflict {
  command: string
  existingKeybinding: Keybinding
  proposedKeybinding: Keybinding
  severity: 'error' | 'warning'
}

interface KeybindingResolver {
  detectConflicts(newBinding: Keybinding): KeybindingConflict[]
  resolveConflict(conflict: KeybindingConflict, resolution: 'override' | 'keep' | 'reassign'): void
  suggestAlternative(binding: Keybinding): string[]
}
```

**Conflict Handling:**
- Warn on conflicting shortcuts
- Suggest unused key combinations
- Allow user to choose resolution
- Platform-specific variations (Ctrl vs Cmd)

### 5. Keyboard-Only Navigation

Complete keyboard accessibility:

```typescript
interface KeyboardNavigation {
  // Focus management
  focusNext(): void
  focusPrevious(): void
  focusPanel(panel: string): void

  // Panel-specific navigation
  navigatePanel(direction: 'up' | 'down' | 'left' | 'right'): void
  activateItem(): void

  // Mode switching
  enterNormalMode(): void
  enterInsertMode(): void
}
```

**Navigation Features:**
- Tab key moves focus between panels
- Arrow keys navigate within panels
- Enter activates selected item
- Escape cancels/closes dialogs
- Focus indicators on all interactive elements

### 6. Shortcut Customization UI

User-configurable keybindings:

```typescript
interface KeybindingEditor {
  // Editing
  editBinding(command: string): void
  captureKeybinding(): Keybinding | null

  // Validation
  validateBinding(binding: Keybinding): ValidationResult

  // Reset
  resetToDefaults(): void
  resetCommand(command: string): void
}
```

**Customization UI:**
- Searchable command list
- Click to record new shortcut
- Conflict detection and warnings
- Reset to defaults button
- Export/import keybindings

## Implementation Priority

### Phase 1 (Core Command Palette - Week 1)

**Goal**: Basic command palette functionality

1. **Command Registry**
   - Create `CommandRegistry` class
   - Register existing IDE commands
   - Define command categories
   - Implement command execution

2. **Command Palette UI**
   - Create command palette modal
   - Implement fuzzy search
   - Keyboard navigation (arrow keys, Enter, Escape)
   - Recent commands (MRU list)

3. **Default Keybindings**
   - Define default shortcut map
   - Implement key binding system
   - Handle keyboard events globally
   - Context-aware availability

**Files to Create:**
- `src/features/commands/CommandRegistry.ts` - Command registration system
- `src/features/commands/types.ts` - Command type definitions
- `src/features/commands/keybindings.ts` - Default keybinding configuration
- `src/features/commands/components/CommandPalette.vue` - Command palette modal
- `src/features/commands/composables/useCommandPalette.ts` - Command palette logic
- `src/features/commands/composables/useKeybindings.ts` - Keybinding handling

**Files to Modify:**
- `src/features/ide/IdePage.vue` - Register keyboard shortcuts
- `src/features/ide/composables/useBasicIdeActions.ts` - Expose actions as commands
- `src/shared/i18n/en.ts` - Add command names/labels

### Phase 2 (Quick Open & Enhanced Shortcuts - Week 2)

**Goal**: Full keyboard workflow

1. **Quick Open**
   - Quick open modal (Ctrl+P)
   - File/sample search
   - Recent files list
   - Fuzzy matching

2. **Extended Keybindings**
   - Editor shortcuts (find, replace, goto)
   - View toggles (panels, zoom)
   - Run controls (start, stop, restart)
   - Settings access

3. **Keyboard Navigation**
   - Focus management between panels
   - Tab navigation
   - Focus indicators
   - ARIA labels for screen readers

**Files to Create:**
- `src/features/commands/components/QuickOpen.vue` - Quick open modal
- `src/features/commands/composables/useQuickOpen.ts` - Quick open logic
- `src/features/commands/composables/useKeyboardNavigation.ts` - Keyboard navigation
- `src/features/commands/components/KeyboardShortcutHelp.vue` - Shortcut reference

**Files to Modify:**
- `src/features/ide/components/MonacoCodeEditor.vue` - Editor keyboard handling
- `src/features/ide/components/ScreenOutput.vue` - Screen keyboard handling
- `src/features/ide/components/IdeControls.vue` - Controls keyboard handling

### Phase 3 (Polish - Optional)

**Goal**: Advanced features and customization

1. **Keybinding Customization**
   - Keybinding editor UI
   - Conflict detection
   - Import/export
   - Reset to defaults

2. **Advanced Features**
   - Command chaining
   - Custom user commands
   - Macros (recorded sequences)
   - Context-sensitive commands

**Files to Create:**
- `src/features/commands/components/KeybindingEditor.vue` - Keybinding customization UI
- `src/features/commands/composables/useKeybindingEditor.ts` - Keybinding editing logic
- `src/features/commands/components/ShortcutReference.vue` - Complete shortcut reference

## Technical Architecture

### New Command Infrastructure

```
src/features/commands/
├── CommandRegistry.ts              # Command registration and execution
├── types.ts                        # Command type definitions
├── keybindings.ts                  # Default keybinding configuration
├── keybindingResolver.ts           # Conflict detection and resolution
├── components/
│   ├── CommandPalette.vue          # Command palette modal
│   ├── QuickOpen.vue               # Quick open modal
│   ├── KeybindingEditor.vue        # Keybinding customization UI
│   ├── ShortcutReference.vue       # Help: keyboard shortcuts
│   └── CommandMenuItem.vue         # Individual command menu item
├── composables/
│   ├── useCommandPalette.ts        # Command palette state and logic
│   ├── useKeybindings.ts           # Global keybinding handling
│   ├── useQuickOpen.ts             # Quick open state and logic
│   ├── useKeyboardNavigation.ts    # Focus management
│   └── useCommandRegistry.ts       # Register commands
└── utils/
    ├── fuzzySearch.ts              # Fuzzy search for commands
    ├── keybindingParser.ts         # Parse keybinding strings
    └── platformKeys.ts             # Platform-specific key names
```

### Integration with Existing Code

**IDE Actions Integration:**
- Existing IDE actions become commands
- No changes to action implementations
- Commands delegate to existing actions

**Monaco Integration:**
- Use Monaco's keyboard API
- Respect Monaco's default keybindings
- Override only necessary shortcuts

**Event Handling:**
- Global keyboard listener on IDE page
- Command palette takes priority when open
- Context-aware keybinding availability

## Dependencies & Tools

**No New Dependencies Required:**

All functionality can be built with:
- Vue 3 Composition API
- Existing IDE infrastructure
- TypeScript standard library

**Optional Enhancements:**
- `fuse.js` - Fuzzy search (or implement simple fuzzy matching)
- `hotkeys-js` - Keybinding handling (or implement custom)

## Success Metrics

### Developer Velocity
- **Time Savings**: Average time to execute commands
- **Shortcut Usage**: % of commands executed via keyboard vs mouse
- **Palette Usage**: # of command palette opens per session
- **Iteration Speed**: Code → Run cycle time improvement

### User Satisfaction
- **Feature Adoption**: % of users using keyboard shortcuts
- **Customization Rate**: % of users customizing keybindings
- **Accessibility**: Keyboard-only usability score
- **NPS**: Satisfaction with command palette

### Accessibility
- **WCAG Compliance**: Keyboard accessibility improvements
- **Screen Reader**: Screen reader navigation support
- **Motor Accessibility**: Reduced mouse dependency

## Benefits

### Immediate Benefits
1. **Speed**: Execute commands 3-5x faster than mouse navigation
2. **Discovery**: Command palette makes all features discoverable
3. **Accessibility**: Full keyboard-only workflow
4. **Professional**: Aligns with modern IDE expectations

### Long-Term Benefits
1. **Muscle Memory**: Transferable skills from other IDEs
2. **Power Users**: Advanced workflows for experienced developers
3. **Customization**: Personalized workflows
4. **Accessibility Base**: Foundation for further accessibility work

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Keybinding conflicts with browser/OS | Test across platforms; allow customization; provide alternatives |
| Learning curve for new users | Opt-in by default; show shortcut hints; help modal |
| Screen reader compatibility | ARIA labels; focus management; test with screen readers |
| Monaco keybinding conflicts | Use Monaco's API; respect existing bindings; override carefully |
| Mobile keyboard issues | Command palette available on mobile; customize mobile shortcuts |

## Open Questions

1. **Default Shortcuts**: Which keybindings should be default? (Match VS Code?)
2. **Mobile Support**: How to handle command palette on mobile devices?
3. **Customization Storage**: Where to store user keybindings? (localStorage, settings file?)
4. **Context Awareness**: How granular should keybinding contexts be?
5. **Conflict Resolution**: How to handle OS/browser shortcut conflicts?

## Next Steps

1. **Research**: Study VS Code, JetBrains IDEs command palette UX
2. **Inventory**: List all existing IDE actions and features
3. **Prototype**: Build basic command palette modal
4. **User Testing**: Test with F-BASIC developers
5. **Accessibility**: Audit keyboard navigation and screen reader support
6. **Documentation**: Document all keyboard shortcuts

## Example Commands Implementation

```typescript
// Command Registry Usage
import { useCommandRegistry } from '@/features/commands'

const { registerCommand, executeCommand } = useCommandRegistry()

// Register a command
registerCommand({
  id: 'run.start',
  title: 'Run Program',
  description: 'Execute the current F-BASIC program',
  category: 'run',
  icon: 'play',
  shortcut: 'Ctrl+Enter',
  handler: async () => {
    await executeProgram()
  }
})

// Execute from anywhere
await executeCommand('run.start')
```

```typescript
// Keybinding Configuration
export const DEFAULT_KEYBINDINGS: KeybindingConfig = {
  shortcuts: [
    { command: 'run.start', key: 'Ctrl+Enter', mac: 'Cmd+Enter' },
    { command: 'run.stop', key: 'Ctrl+Shift+Enter', mac: 'Cmd+Shift+Enter' },
    { command: 'commands.showPalette', key: 'Ctrl+Shift+P', mac: 'Cmd+Shift+P' },
    { command: 'quickOpen.show', key: 'Ctrl+P', mac: 'Cmd+P' },
    // ... more shortcuts
  ]
}
```

---

*"The best IDEs make power users feel powerful. A command palette turns a maze of menus into a flat list of possibilities—making every feature just a few keystrokes away. Let's make F-BASIC development feel as fast as the games it creates."*
