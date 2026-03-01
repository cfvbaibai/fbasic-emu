# Roadmap

**Last Updated**: 2026-03-01

---

## Current Status

Family Basic IDE is feature-complete for core F-BASIC functionality. Major systems implemented:

- **Parser**: Full F-BASIC grammar with Chevrotain, includes REPL-only command parsing
- **Runtime**: Executors for all core statements
- **Platform**: Screen, sprites, animation, sound, joystick
- **UI**: Vue 3 IDE with i18n support, VueUse integration
- **BG Editor**: Integrated BG GRAPHIC editor with VIEW command support (complete)

---

## Active Work

**No active work.** All planned commands are implemented.

Track future work via [GitHub Issues](https://github.com/cfvbaibai/fbasic-ide/issues).

---

## Command Analysis

### Fully Implemented (~55 commands/functions)

**Statements**: BEEP, CGEN, CGSET, CLEAR, CLS, COLOR, CUT, DATA, DEF MOVE, DEF SPRITE, DIM, END, ERA, FOR/NEXT, GOTO, GOSUB, IF/THEN, INPUT, LET, LINPUT, LOCATE, MOVE, ON, PALET/PALETB/PALETS, PAUSE, PLAY, POSITION, PRINT, READ, REM, RESTORE, RETURN, SPRITE/SPRITE ON/OFF, SWAP, VIEW

**Functions**: ABS, ASC, CHR$, CSRLIN, HEX$, INKEY$, LEFT$, LEN, MID$, MOVE(n), POS, RIGHT$, RND, SCR$, SGN, STICK, STR$, STRIG, VAL, XPOS, YPOS

### REPL-Only (Parsed with IDE Error Message)

These commands are recognized by the parser but produce "Not applicable for IDE version" error:

| Command | Description | Error Message |
|---------|-------------|---------------|
| LIST | List program | "LIST: Not applicable for IDE version" |
| NEW | Erase program | "NEW: Not applicable for IDE version" |
| RUN | Execute program | "RUN: Not applicable for IDE version" |
| SAVE | Save to tape | "SAVE: Not applicable for IDE version" |
| LOAD | Load from tape | "LOAD: Not applicable for IDE version" |
| LOAD? | Verify tape | "LOAD?: Not applicable for IDE version" |
| KEY | Define function keys | "KEY: Not applicable for IDE version" |
| KEYLIST | List function keys | "KEYLIST: Not applicable for IDE version" |
| CONT | Continue after STOP | "CONT: Not applicable for IDE version" |
| SYSTEM | Exit to menu | "SYSTEM: Not applicable for IDE version" |
| POKE | Write memory | "POKE: Not applicable for IDE version" |
| PEEK | Read memory | "PEEK: Not applicable for IDE version" |
| FRE | Free memory | "FRE: Not applicable for IDE version" |
| STOP | Pause execution | "STOP: Not applicable for IDE version" |

---

## Completed

### INKEY$ Full Implementation (2026-03-01)

**What was implemented**:
- INKEY$ function with non-blocking (default) and blocking (`n=0`) modes
- SharedArrayBuffer-based keyboard input via Web Worker
- IDE keyboard capture composable with Joystick/Keyboard mode toggle (F9)
- Comprehensive test coverage (~30 test cases)

### Command Coverage Complete (2026-02-25)

**What was implemented**:
- CSRLIN, POS, SCR$ functions for screen state queries
- BEEP statement for audio feedback (Web Audio API)
- REPL-only command parsing with helpful IDE error messages
- All F-BASIC commands now either implemented or gracefully handled

### Memory Leak Prevention (2026-02-25)

**What was implemented**:
- Proper cleanup in composables with `onScopeDispose` and `watch` cleanup
- VueUse integration for reactive primitives (`useStorage`, `toRef`, `toValue`)
- Refactored `useBasicIdeState` and `useProgramStore` for memory safety

### Syntax Highlighting Fix (2026-02-24)

**What was implemented**:
- Complete F-BASIC syntax highlighting for all tokens
- Disabled hover tooltip (not useful for this language)

### BG Editor UX Enhancements (2026-02-19)

**What was implemented**:
- Responsive character palette tabs (icon-only with tooltip on hover)
- Hover preview in CHAR mode shows selected BG item before placement
- Cell canvas caching for improved painting performance
- Scale options updated (1.5x, 2x, 3x, 4x)

### BG Editor Scale Issues (2026-02-19)

**Issues fixed**:
- Scale switch display issue: Added `nextTick()` for DOM sync
- Non-integer scale rendering: Split into integer/non-integer rendering paths

### BG GRAPHIC Editor + VIEW Command Integration (2026-02-19)

**What was implemented**:
- BG Editor UI with 28×21 grid, character palette, color patterns
- Canvas-based rendering with localStorage persistence
- VIEW command executor to copy BG GRAPHIC to background screen
- Worker communication to send BG data from main thread to web worker
- Sample code "BG VIEW Test" for manual testing

**Key fix**: BG data now sent to web worker before code execution, enabling VIEW command to access BG Editor content during runtime.

---

### Issue Tracking

Track work items via [GitHub Issues](https://github.com/cfvbaibai/fbasic-ide/issues).

Labels:
- `bug` - Bug fixes
- `enhancement` - New features
- `refactor` - Code improvements

**Recently Closed**:
- [#1](https://github.com/cfvbaibai/fbasic-ide/issues/1): CSRLIN, POS, SCR$, BEEP functions
- [#2](https://github.com/cfvbaibai/fbasic-ide/issues/2): REPL-only command parsing

---

## Backlog

### Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Documentation | README, user guide, architecture | Low |
| Performance | Incremental dirty updates (if needed) | Low |
| STOP/CONT | Pause/resume execution | Low (requires state persistence) |

---

## Archived Plans

- [Roadmap V1](archive/planning/roadmap-v1-2026-02-12.md) — Initial development phases (2026-01-24 to 2026-02-06)
- [Outstanding Work Plan V1](archive/planning/outstanding-work-plan-v1-2026-02-12.md) — Remaining commands tracking

---

## Implementation Pattern

For new commands/features:

1. **Parser**: Add token to `parser-tokens.ts`, rule to `FBasicChevrotainParser.ts`
2. **Executor**: Create in `src/core/execution/executors/`
3. **Router**: Register in `StatementRouter.ts`
4. **Device**: Add methods to `src/core/devices/*.ts` if needed
5. **Tests**: Create in `test/executors/`
6. **Docs**: Add JSDoc to executor

**Code Standards**:
- File size: max 500 lines
- TypeScript: strict mode, no `any`
- Tests: happy path + errors + edge cases

---

## References

- [F-BASIC Reference Skill](../.claude/skills/fbasic-reference/SKILL.md)
- [Family BASIC Manual](reference/family-basic-manual/)
- [Team Contexts](teams/)
