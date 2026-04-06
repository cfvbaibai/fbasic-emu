# Runtime Team

## Ownership
- **Files**: `src/core/execution/*`, `src/core/evaluation/*`, `src/core/state/*`, `test/executors/*`, `test/evaluation/*`
- **Responsibilities**: Command execution, expression evaluation, program state, control flow

## Architecture

### Execution Flow
```
CST (from Parser)
  → ExecutionEngine.execute()
  → StatementExecutor (specific executor)
  → ExpressionEvaluator (for arguments)
  → ExecutionContext (state updates)
  → BasicDeviceAdapter (I/O)
```

### Key Files
- `ExecutionEngine.ts` - Main execution loop, dispatches to executors
- `executors/*.ts` - Individual command executors (33 executors)
- `ExpressionEvaluator.ts` - Evaluates expressions from CST
- `ExecutionContext.ts` - Runtime state (variables, arrays, program counter, etc.)

**Key Pattern**: Each BASIC command has a dedicated executor class.

## Common Tasks

### Add New Command Executor

**Example**: Implement `CircleExecutor` after Parser Team adds grammar

1. **Create executor** in `src/core/execution/executors/CircleExecutor.ts`:
   ```typescript
   import type { CstNode } from 'chevrotain'
   import type { ExecutionContext } from '@/core/state/ExecutionContext'
   import type { BasicDeviceAdapter } from '@/core/devices/BasicDeviceAdapter'
   import { evaluateExpression } from '@/core/evaluation/ExpressionEvaluator'

   export function executeCircle(
     cst: CstNode,
     context: ExecutionContext,
     device: BasicDeviceAdapter
   ): void {
     const args = cst.children.expression
     const x = evaluateExpression(args[0], context)
     const y = evaluateExpression(args[1], context)
     const radius = evaluateExpression(args[2], context)

     device.drawCircle(x, y, radius) // Requires Platform Team support
   }
   ```

2. **Register in ExecutionEngine** dispatcher:
   ```typescript
   // In ExecutionEngine.ts
   if (statement.children.circleStatement) {
     executeCircle(statement.children.circleStatement[0], context, device)
   }
   ```

3. **Add executor tests** in `test/executors/CircleExecutor.test.ts`:
   ```typescript
   import { describe, test, expect, vi } from 'vitest'
   import { executeCircle } from '@/core/execution/executors/CircleExecutor'
   import { createTestContext, createMockDevice } from '../test-helpers'

   describe('CircleExecutor', () => {
     test('executes CIRCLE with coordinates', () => {
       const context = createTestContext()
       const device = createMockDevice()
       const cst = parseCst('10 CIRCLE(100, 100, 50)')

       executeCircle(cst, context, device)

       expect(device.drawCircle).toHaveBeenCalledWith(100, 100, 50)
     })
   })
   ```

### Fix Execution Bug

1. Identify which executor has the bug
2. Add test case reproducing the bug
3. Fix executor logic
4. Verify test passes and existing tests still pass

### Add Expression Function

Example: Add `ABS()` function

1. Update `ExpressionEvaluator.ts`:
   ```typescript
   if (cst.children.absFunction) {
     const arg = evaluateExpression(cst.children.expression[0], context)
     return Math.abs(arg)
   }
   ```

2. Add tests in `test/evaluation/`

## Integration Points

### Receives from Parser Team
- **CST nodes** for statements and expressions

### Uses Platform Team
- **BasicDeviceAdapter** for I/O operations
- **AnimationManager** for sprite commands (via device adapter)

### Communication with UI Team (via Worker Messages)
- **Receives**: `EXECUTE`, `STOP`, `INPUT_VALUE`, `SET_SHARED_ANIMATION_BUFFER`, `SET_SHARED_JOYSTICK_BUFFER`, `STRIG_EVENT`, `STICK_EVENT`
- **Sends**: `OUTPUT`, `SCREEN_CHANGED`, `ERROR`, `RESULT`, `REQUEST_INPUT`, `PLAY_SOUND`, `PROGRESS`

**See**: `docs/reference/worker-messages.md` for complete message type reference.

### Manages
- **ExecutionContext** - Variables, arrays, program state
- **Control flow** - GOTO, GOSUB, FOR/NEXT, IF/THEN

## Patterns & Conventions

### Executor Function Signature
```typescript
export function executeCommandName(
  cst: CstNode,
  context: ExecutionContext,
  device: BasicDeviceAdapter
): void {
  // Extract arguments from CST
  // Evaluate expressions
  // Update context or call device
}
```

### Expression Evaluation
```typescript
import { evaluateExpression } from '@/core/evaluation/ExpressionEvaluator'

const value = evaluateExpression(cst.children.expression[0], context)
```

### State Updates
```typescript
// Set variable
context.setVariable('A', 42)

// Get variable
const value = context.getVariable('A')

// Arrays
context.setArrayValue('ARR', [1, 2], 100)
const value = context.getArrayValue('ARR', [1, 2])
```

### Device I/O
```typescript
// Output
device.printOutput(text)
device.clearScreen()

// Input (async)
const input = await device.getInput()

// Joystick (polling)
const state = device.getStickState(joystickId)
```

## Common Executor Examples

### Simple Command (CLS)
```typescript
export function executeCls(
  cst: CstNode,
  context: ExecutionContext,
  device: BasicDeviceAdapter
): void {
  device.clearScreen()
}
```

### Command with Arguments (LOCATE)
```typescript
export function executeLocate(
  cst: CstNode,
  context: ExecutionContext,
  device: BasicDeviceAdapter
): void {
  const x = evaluateExpression(cst.children.expression[0], context)
  const y = evaluateExpression(cst.children.expression[1], context)
  device.setCursorPosition(x, y)
}
```

### Control Flow (GOTO)
```typescript
export function executeGoto(
  cst: CstNode,
  context: ExecutionContext,
  device: BasicDeviceAdapter
): void {
  const lineNumber = evaluateExpression(cst.children.expression[0], context)
  context.setProgramCounter(lineNumber)
}
```

## Testing

- **Unit tests**: `test/executors/`, `test/evaluation/` — mock device adapter, verify calls
- **Program tests**: `test/program/` — headless full-program tests via Vitest harness
- **Pattern**: Test helpers from `test/test-helpers.ts`
- **See**: `docs/testing-strategy.md` for split-of-concern boundaries and ownership

### Test Template
```typescript
import { describe, test, expect, vi } from 'vitest'
import { executeCommand } from '@/core/execution/executors/CommandExecutor'
import { createExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicDeviceAdapter } from '@/core/devices/BasicDeviceAdapter'

describe('CommandExecutor', () => {
  test('executes command with expected behavior', () => {
    const context = createExecutionContext()
    const device: BasicDeviceAdapter = {
      printOutput: vi.fn(),
      // ... other methods
    }

    const cst = parseCst('10 COMMAND arg1, arg2')
    executeCommand(cst, context, device)

    expect(device.printOutput).toHaveBeenCalledWith('expected')
  })
})
```

## Code Constraints

- Files: **MAX 500 lines** (one executor per file)
- TypeScript: strict mode, no `any`, `import type` for types
- Tests: `.toEqual()` for exact matching, not `.toContain()`
- Error handling: Throw clear runtime errors

## Reference

- **F-BASIC manual**: `docs/reference/family-basic-manual/` (command behavior)
- **Existing executors**: Study similar commands for patterns
- **Worker message types**: `docs/reference/worker-messages.md`
- **Shared buffer layout**: `docs/reference/shared-display-buffer.md`
