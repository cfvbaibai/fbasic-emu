# File Splitting Guide

When a file approaches the **500-line limit**, it is a signal that the file has grown beyond a single responsibility. The goal is not to mechanically extract methods into `*Helpers.ts` files to squeeze under the line count — it is to identify the underlying design issue and fix it properly.

## Principles

1. **Diagnose before cutting.** A long file is a symptom, not the disease. Understand *why* the file grew before deciding how to split it.
2. **One responsibility per file.** After splitting, each file should have a clear, singular purpose that can be described in one sentence.
3. **Cohesion over convenience.** Group code by what it *does*, not by what it *uses*. Code that changes together belongs together.
4. **The extracted file should stand on its own.** If an extracted module only makes sense in the context of its parent, the split was wrong.

## Diagnosis: Why Is the File Big?

Before any refactoring, classify the root cause:

| Cause | Symptom | Strategy |
|-------|---------|----------|
| **Mixed responsibilities** | File handles input, output, state, and orchestration | Split by responsibility into separate modules |
| **God class** | One class/object does too many things | Decompose into collaborating objects with clear interfaces |
| **Repeated patterns** | Similar logic repeated with slight variations | Abstract the pattern into a generic utility or composable |
| **Data-heavy** | Large lookup tables, mappings, or constants | Extract data into its own file, import it |
| **Test setup bloat** | Test file has massive fixture setup | Extract shared fixtures into `__fixtures__/` or test helpers |

## Splitting Strategies (Ordered by Preference)

### 1. Responsibility Decomposition (Preferred)

Split a file into modules that each own one concern. This is the most robust approach.

**Example — `WebWorkerDeviceAdapter.ts` (500+ lines)**

Bad: Extract `handleOutput()` and `handleSpriteUpdate()` into `DeviceHelpers.ts` — this is just moving code.

Good: Identify distinct responsibilities and split into focused modules:
- `DeviceOutputHandler.ts` — owns all output message construction and sending
- `DeviceInputHandler.ts` — owns input state management and event handling
- `DeviceSpritePositionHelpers.ts` — owns sprite coordinate queries and caching

Each extracted file has a clear domain, can be tested independently, and would make sense as a standalone module.

### 2. Interface Extraction

When a file mixes public API surface with implementation details:

```
BigFile.ts (450 lines)
├── Public interface + validation (50 lines)
├── Core business logic (200 lines)
├── Helper utilities (100 lines)
└── Internal types (100 lines)
```

Split into:
- `BigFile.ts` — public API, delegates to implementation
- `BigFileCore.ts` — core business logic
- `BigFileUtils.ts` — internal utilities (only if truly reusable)

### 3. Composable Extraction (Vue Components)

When a Vue component grows large due to mixed logic:

- Extract reactive state management into a composable (`use<Domain>.ts`)
- Extract computed properties that model domain concepts into their own composables
- Extract complex event handlers into composables or plain utility functions
- The component itself should be thin: template + wiring

### 4. Layer Splitting

When a file spans multiple architectural layers:

```
BigExecutor.ts (480 lines)
├── Input validation (60 lines)
├── State mutation (200 lines)
├── Device I/O (150 lines)
└── Error handling (70 lines)
```

Split by layer — validation, core logic, I/O adapters. Each layer can change independently.

## Anti-Patterns

### The `*Helpers.ts` Dump

Creating a single `*Helpers.ts` file and throwing everything that doesn't fit into it. This is just renaming the problem — the "helper" file itself becomes a 400-line catch-all with no coherent purpose.

**Wrong:**
```
WebWorkerDeviceAdapter.ts (497 lines)  ← split by moving 50 lines out
DeviceHelpers.ts (170 lines)            ← random assortment of functions
```

**Right:**
```
WebWorkerDeviceAdapter.ts (300 lines)   ← orchestration only
DeviceOutputHandler.ts (120 lines)      ← output responsibility
DeviceInputHandler.ts (100 lines)       ← input responsibility
```

### The Trivial Extraction

Moving a single 30-line private function to its own file just to reduce the line count. This creates unnecessary indirection and file churn.

**Ask yourself**: Does this function have a reason to exist independently? Will it be tested independently? Will it be reused? If the answer to all three is "no", it probably belongs where it is.

### The Mechanical Cut

Splitting a file at an arbitrary line boundary (e.g., "move everything after line 350") without considering logical boundaries. The result is two files that still need to understand each other's internals.

## Naming Conventions

| Pattern | When to Use |
|---------|-------------|
| `<Domain><Responsibility>.ts` | The file owns a specific responsibility within a domain (e.g., `DeviceOutputHandler.ts`) |
| `<Domain><Concept>.ts` | The file models a single concept (e.g., `PlayCompletionTracker.ts`) |
| `use<Domain>.ts` | Vue composable encapsulating reactive logic |
| `<Domain>Constants.ts` | Extracted constants/mappings for a domain |
| `<Domain>Types.ts` | Extracted type definitions (use sparingly — prefer co-locating types with their usage) |

Avoid generic names like `utils`, `helpers`, `common` — they signal unclear responsibility.

## Process

When a file needs splitting:

1. **Read the file end-to-end.** Understand what it does before changing it.
2. **Identify the responsibilities.** List the distinct concerns the file handles.
3. **Propose the split.** Write down what each new file will contain and why.
4. **Check for existing modules.** Don't create a new file if an existing one already covers the responsibility.
5. **Extract types first.** Move shared types/interfaces, then extract implementations that depend on them.
6. **Update imports.** Ensure the original file imports from the new modules.
7. **Write tests for extracted modules.** Each new module should have its own tests.
8. **Verify the original file's tests still pass.** Refactoring should not change behavior.
9. **Review the result.** Each file should be under 500 lines and have a clear, singular purpose.
