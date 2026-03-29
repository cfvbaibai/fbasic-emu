import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

const STATEMENT_RULE_TO_CAPABILITY: Record<string, string> = {
  beepStatement: 'BEEP',
  bgplayStatement: 'BGPLAY',
  cgenStatement: 'CGEN',
  cgsetStatement: 'CGSET',
  clearStatement: 'CLEAR',
  clsStatement: 'CLS',
  colorStatement: 'COLOR',
  cutStatement: 'CUT',
  dataStatement: 'DATA',
  defMoveStatement: 'DEF MOVE',
  defSpriteStatement: 'DEF SPRITE',
  dimStatement: 'DIM',
  endStatement: 'END',
  eraStatement: 'ERA',
  forStatement: 'FOR',
  gosubStatement: 'GOSUB',
  gotoStatement: 'GOTO',
  ifThenStatement: 'IF...THEN',
  inputStatement: 'INPUT',
  letStatement: 'LET',
  linputStatement: 'LINPUT',
  locateStatement: 'LOCATE',
  moveStatement: 'MOVE',
  nextStatement: 'NEXT',
  onStatement: 'ON...GOTO/GOSUB',
  paletStatement: 'PALET',
  pauseStatement: 'PAUSE',
  playStatement: 'PLAY',
  positionStatement: 'POSITION',
  printStatement: 'PRINT',
  readStatement: 'READ',
  restoreStatement: 'RESTORE',
  returnStatement: 'RETURN',
  spriteOnOffStatement: 'SPRITE ON/OFF',
  spriteStatement: 'SPRITE',
  swapStatement: 'SWAP',
  viewStatement: 'VIEW',
}

const FUNCTION_TOKEN_TO_CAPABILITY: Record<string, string> = {
  Abs: 'ABS',
  Asc: 'ASC',
  Chr: 'CHR$',
  Hex: 'HEX$',
  Inkey: 'INKEY$',
  Left: 'LEFT$',
  Len: 'LEN',
  Mid: 'MID$',
  Move: 'MOVE',
  Pos: 'POS',
  Right: 'RIGHT$',
  Rnd: 'RND',
  Scr: 'SCR$',
  Sgn: 'SGN',
  Stick: 'STICK',
  Str: 'STR$',
  Strig: 'STRIG',
  Val: 'VAL',
  Xpos: 'XPOS',
  Ypos: 'YPOS',
}

function getRouterStatementRules(): string[] {
  const routerPath = resolve(process.cwd(), 'src/core/execution/StatementRouter.ts')
  const source = readFileSync(routerPath, 'utf8')
  const matches = source.matchAll(/singleCommandCst\.children\.(\w+)/g)
  return [...new Set([...matches].map(match => match[1]).filter((value): value is string => Boolean(value)))]
}

function getFunctionTokenNames(): string[] {
  const evaluatorPath = resolve(process.cwd(), 'src/core/evaluation/FunctionEvaluator.ts')
  const source = readFileSync(evaluatorPath, 'utf8')
  const matches = source.matchAll(/const \w+Token = getFirstToken\(cst\.children\.(\w+)\)/g)
  return [...new Set([...matches].map(match => match[1]).filter((value): value is string => Boolean(value)))]
}

describe('Parser capability metadata', () => {
  test('supported statements track StatementRouter execution surface', () => {
    const parserInfo = new FBasicParser().getParserInfo()
    const routerRules = getRouterStatementRules()

    const unmappedRules = routerRules.filter(rule => !STATEMENT_RULE_TO_CAPABILITY[rule])
    expect(unmappedRules).toEqual([])

    const expectedStatements = new Set(routerRules.map(rule => STATEMENT_RULE_TO_CAPABILITY[rule]))
    expectedStatements.add('REM') // REM parses as a no-op (no singleCommand branch).

    expect([...expectedStatements].sort()).toEqual([...parserInfo.supportedStatements].sort())
  })

  test('supported functions track FunctionEvaluator call surface', () => {
    const parserInfo = new FBasicParser().getParserInfo()
    const functionTokens = getFunctionTokenNames()

    const unmappedTokens = functionTokens.filter(token => !FUNCTION_TOKEN_TO_CAPABILITY[token])
    expect(unmappedTokens).toEqual([])

    const expectedFunctions = new Set(functionTokens.map(token => FUNCTION_TOKEN_TO_CAPABILITY[token]))

    expect([...expectedFunctions].sort()).toEqual([...parserInfo.supportedFunctions].sort())
  })
})
