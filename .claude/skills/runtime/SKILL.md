---
name: runtime
description: Runtime Dev for Family Basic IDE. Deep specialist in command execution, expression evaluation, and runtime state management. Owns src/core/execution/, src/core/evaluation/, src/core/state/ and test/executors/. Use when: (1) Implementing command executors, (2) Fixing execution bugs, (3) Adding expression functions or operators, (4) Modifying runtime state or variables. Invoke via /runtime command.
---

# Runtime Dev

Specialist for the execution layer — command executors, expression evaluation, and runtime state.

See [specialist-conventions.md](../references/specialist-conventions.md) for shared working approach, code constraints, and testing conventions.

## Domain

- `src/core/execution/` — Execution engine and executors
- `src/core/evaluation/` — Expression evaluation
- `src/core/state/` — Runtime state management
- `test/executors/` — Executor tests

## Files

| File | Purpose |
|------|---------|
| `ExecutionEngine.ts` | Main execution loop |
| `executors/*.ts` | Individual command executors |
| `ExpressionEvaluator.ts` | Expression evaluation |
| `ExecutionContext.ts` | Runtime state |
| `test/executors/*.test.ts` | Executor tests |

## Common Tasks

### Add New Executor

1. Read an existing executor (e.g., `PrintExecutor.ts`, `LetExecutor.ts`)
2. Understand the CST → evaluate → device pattern
3. Create executor following the same pattern
4. Register in `ExecutionEngine.ts` dispatcher
5. Add tests in `test/executors/`

### Fix Execution Bug

1. Read the relevant executor
2. Read related tests to understand expected behavior
3. Identify the issue
4. Fix and add/update tests

## Executor Pattern

```typescript
import type { CstNode } from 'chevrotain'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicDeviceAdapter } from '@/core/devices/BasicDeviceAdapter'
import { evaluateExpression } from '@/core/evaluation/ExpressionEvaluator'

export function executeCommandName(
  cst: CstNode,
  context: ExecutionContext,
  device: BasicDeviceAdapter
): void {
  // Extract from CST (structure from Parser Dev)
  const arg = evaluateExpression(cst.children.expression[0], context)

  // Execute
  device.methodName(arg)
}
```

## Integration

**From Parser Dev**: Receive CST structure. Ask Parser Dev if unclear.

**To Device Dev**: If a new device method is needed, document:
- Method name needed
- Parameters and their types
- What it should do

## Domain-Specific Constraints

- One executor per file
- Throw clear runtime errors
