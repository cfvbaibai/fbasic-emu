# Parser Team

## Ownership
- **Files**: `src/core/parser/*`, `test/parser/*`
- **Responsibilities**: F-BASIC grammar, CST generation, syntax error reporting

## Architecture

Uses **Chevrotain** parser generator. Key files:
- `FBasicChevrotainParser.ts` - Main parser class (grammar rules)
- `parser-tokens.ts` - Token definitions (lexer)
- `cst-helpers.ts` - CST traversal utilities
- `FBasicParser.ts` - Parser interface/wrapper

**Key Pattern**: Direct CST output (no AST conversion). Executors consume CST nodes directly.

## Common Tasks

### Add New BASIC Command

**Example**: Add `CIRCLE` command

1. **Add token** to `parser-tokens.ts`:
   ```typescript
   const Circle = createToken({ name: "Circle", pattern: /CIRCLE/i })
   ```

2. **Add grammar rule** to `FBasicChevrotainParser.ts`:
   ```typescript
   private circleStatement() {
     this.CONSUME(Circle)
     this.CONSUME(LParen)
     this.SUBRULE(this.expression) // x
     this.CONSUME(Comma)
     this.SUBRULE2(this.expression) // y
     this.CONSUME(Comma)
     this.SUBRULE3(this.expression) // radius
     this.CONSUME(RParen)
   }
   ```

3. **Add to statement dispatcher**:
   ```typescript
   private statement() {
     this.OR([
       // ... existing statements
       { ALT: () => this.SUBRULE(this.circleStatement) },
     ])
   }
   ```

4. **Add parser tests** in `test/parser/`:
   ```typescript
   test('parses CIRCLE statement', () => {
     const result = parser.parse('10 CIRCLE(100, 100, 50)')
     expect(result.errors).toEqual([])
     expect(result.cst.children.circleStatement).toBeDefined()
   })
   ```

5. **Hand off to Runtime Team** for executor implementation

### Fix Parsing Bug

1. Check grammar rule in `FBasicChevrotainParser.ts`
2. Add test case reproducing the bug
3. Fix grammar rule (consult `docs/reference/` for F-BASIC spec)
4. Verify test passes

### Add Expression Support

Example: Add new operator or function

1. Update token definitions
2. Update expression grammar rules
3. Add tests for new expression types
4. Hand off to Runtime Team for evaluation logic

## Integration Points

### Provides to Runtime Team
- **CST nodes** with command structure
- **Syntax error messages**

### Uses
- **F-BASIC reference**: `docs/reference/family-basic-manual/` (language spec)

## Patterns & Conventions

### Grammar Rule Structure
```typescript
private commandName() {
  this.CONSUME(CommandToken)
  // Consume arguments
  this.SUBRULE(this.expression)
  this.CONSUME(Comma)
  // etc.
}
```

### Error Recovery
```typescript
// Use OR with recovery alternatives
this.OR([
  { ALT: () => this.SUBRULE(this.validSyntax) },
  { ALT: () => this.CONSUME(RecoverToken) }, // Recovery path
])
```

### Token Patterns
```typescript
// Case-insensitive keywords
const Print = createToken({ name: "Print", pattern: /PRINT/i })

// Numbers
const Number = createToken({ name: "Number", pattern: /\d+(\.\d+)?/ })

// Strings
const StringLiteral = createToken({ name: "StringLiteral", pattern: /"[^"]*"/ })
```

## Testing

- **Location**: `test/parser/`
- **Pattern**: Test both valid and invalid syntax
- **Verify**: CST structure matches expected
- **Always**: Check `result.errors` array
- **See**: `docs/testing-strategy.md` for split-of-concern boundaries

### Test Template
```typescript
import { describe, test, expect } from 'vitest'
import { createParser } from '@/core/parser/FBasicParser'

describe('CommandName Parser', () => {
  const parser = createParser()

  test('parses valid syntax', () => {
    const result = parser.parse('10 COMMAND arg1, arg2')
    expect(result.errors).toEqual([])
    expect(result.cst.children.commandStatement).toBeDefined()
  })

  test('reports error for invalid syntax', () => {
    const result = parser.parse('10 COMMAND')
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
```

## Code Constraints

- Files: **MAX 500 lines** (extract helpers if needed)
- TypeScript: strict mode, no `any`, `import type` for types
- Chevrotain: Follow existing patterns (see `FBasicChevrotainParser.ts`)

## Reference

- **Chevrotain docs**: https://chevrotain.io/docs/
- **F-BASIC manual**: `docs/reference/family-basic-manual/`
