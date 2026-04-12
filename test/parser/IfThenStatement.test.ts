/**
 * IF-THEN Statement Parser Tests
 */

import { describe, expect, it } from 'vitest'

import { getFirstCstNode } from '@/core/parser/cst-helpers'
import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'

describe('IF-THEN Statement', () => {
  describe('Parser Tests', () => {
    it('should parse IF-THEN with numeric comparison', () => {
      const source = '10 IF X = 5 THEN PRINT "Equal"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()

      const statements = result.cst?.children.statement
      expect(statements).toBeDefined()

      const statementCst = getFirstCstNode(statements)
      expect(statementCst).toBeDefined()

      if (!statementCst) return

      const commandListCst = getFirstCstNode(statementCst.children.commandList)
      expect(commandListCst).toBeDefined()

      if (!commandListCst) return

      const commandCst = getFirstCstNode(commandListCst.children.command)
      expect(commandCst).toBeDefined()

      if (!commandCst) return

      const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
      expect(singleCommandCst).toBeDefined()

      if (!singleCommandCst) return

      const ifThenStmtCst = getFirstCstNode(singleCommandCst.children.ifThenStatement)
      expect(ifThenStmtCst).toBeDefined()

      if (!ifThenStmtCst) return

      // After refactoring, IF-THEN uses logicalExpression instead of comparisonExpression
      expect(ifThenStmtCst.children.logicalExpression).toBeDefined()
      expect(ifThenStmtCst.children.commandList).toBeDefined()
    })

    it('should parse IF-THEN with greater than comparison', () => {
      const source = '10 IF X > 10 THEN PRINT "Greater"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with less than comparison', () => {
      const source = '10 IF X < 10 THEN PRINT "Less"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with not equal comparison', () => {
      const source = '10 IF X <> 5 THEN PRINT "Not Equal"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with greater than or equal comparison', () => {
      const source = '10 IF X >= 10 THEN PRINT "Greater or Equal"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with less than or equal comparison', () => {
      const source = '10 IF X <= 10 THEN PRINT "Less or Equal"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with single expression (boolean)', () => {
      const source = '10 IF X THEN PRINT "True"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with LET statement in THEN clause', () => {
      const source = '10 IF X = 5 THEN Y = 10'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with PRINT statement in THEN clause', () => {
      const source = '10 IF X = 5 THEN PRINT "Hello"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with expression in condition', () => {
      const source = '10 IF X + Y > 10 THEN PRINT "Sum"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with string comparison', () => {
      const source = '10 IF A$ = "Hello" THEN PRINT "Match"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with colon-separated statements', () => {
      const source = '10 IF X = 5 THEN PRINT "Yes": PRINT "No"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF without THEN (THEN-less IF with PRINT)', () => {
      const source = '10 IF X = 1 PRINT "X=1"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()

      const statements = result.cst?.children.statement
      expect(statements).toBeDefined()

      const statementCst = getFirstCstNode(statements)
      expect(statementCst).toBeDefined()

      if (!statementCst) return

      const commandListCst = getFirstCstNode(statementCst.children.commandList)
      expect(commandListCst).toBeDefined()

      if (!commandListCst) return

      const commandCst = getFirstCstNode(commandListCst.children.command)
      expect(commandCst).toBeDefined()

      if (!commandCst) return

      const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
      expect(singleCommandCst).toBeDefined()

      if (!singleCommandCst) return

      const ifThenStmtCst = getFirstCstNode(singleCommandCst.children.ifThenStatement)
      expect(ifThenStmtCst).toBeDefined()

      if (!ifThenStmtCst) return

      // THEN-less IF should have logicalExpression and commandList (no THEN token)
      expect(ifThenStmtCst.children.logicalExpression).toBeDefined()
      expect(ifThenStmtCst.children.commandList).toBeDefined()
      // THEN token should NOT be present
      expect(ifThenStmtCst.children.Then).toBeUndefined()
    })

    it('should parse IF without THEN with LET assignment', () => {
      const source = '10 IF A = 0 Y = 10'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF without THEN with BEEP command', () => {
      const source = '10 IF A = 0 BEEP'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF without THEN with colon-separated statements', () => {
      const source = '10 IF X = 1 PRINT A: PRINT B'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()

      const statements = result.cst?.children.statement
      expect(statements).toBeDefined()

      const statementCst = getFirstCstNode(statements)
      expect(statementCst).toBeDefined()

      if (!statementCst) return

      const commandListCst = getFirstCstNode(statementCst.children.commandList)
      expect(commandListCst).toBeDefined()

      if (!commandListCst) return

      const commandCst = getFirstCstNode(commandListCst.children.command)
      expect(commandCst).toBeDefined()

      if (!commandCst) return

      const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
      expect(singleCommandCst).toBeDefined()

      if (!singleCommandCst) return

      const ifThenStmtCst = getFirstCstNode(singleCommandCst.children.ifThenStatement)
      expect(ifThenStmtCst).toBeDefined()

      if (!ifThenStmtCst) return

      // THEN-less IF should have logicalExpression and commandList (no THEN token)
      expect(ifThenStmtCst.children.logicalExpression).toBeDefined()
      expect(ifThenStmtCst.children.commandList).toBeDefined()
      // THEN token should NOT be present
      expect(ifThenStmtCst.children.Then).toBeUndefined()

      // The commandList inside the THEN-less IF should contain colon-separated commands
      const innerCommandList = getFirstCstNode(ifThenStmtCst.children.commandList)
      expect(innerCommandList).toBeDefined()

      if (!innerCommandList) return

      const innerCommands = innerCommandList.children.command
      expect(innerCommands).toBeDefined()

      if (!innerCommands) return

      expect(innerCommands.length).toEqual(2)
    })

    it('should reject IF-THEN without condition', () => {
      const source = '10 IF THEN PRINT "Error"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(false)
    })

    it('should parse IF-THEN with multiple statements in THEN clause', () => {
      // From manual page 64: IF A$<>"Y" THEN BEEP:GOTO 30
      const source = '10 IF X = 5 THEN PRINT "Yes": PRINT "No"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with AND operator', () => {
      // From manual page 52: IF X>0 AND X<10 THEN 1000
      const source = '10 IF X > 0 AND X < 10 THEN PRINT "Between"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with OR operator', () => {
      // From manual page 52: IF X<0 OR X>10 THEN 1000
      const source = '10 IF X < 0 OR X > 10 THEN PRINT "Outside"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with complex logical expression', () => {
      const source = '10 IF X > 0 AND X < 10 OR X = 20 THEN PRINT "Valid"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with NOT operator', () => {
      const source = '10 IF NOT X = 0 THEN PRINT "Not Zero"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })

    it('should parse IF-THEN with string not equal comparison', () => {
      // From manual page 64 example: IF A$<>"Y" THEN BEEP:GOTO 30
      const source = '10 IF A$ <> "Y" THEN PRINT "Not Y"'
      const result = parseWithChevrotain(source)

      expect(result.success).toBe(true)
    })
  })
})
