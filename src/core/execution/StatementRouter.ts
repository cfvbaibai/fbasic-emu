/**
 * Statement Router
 *
 * Routes BASIC statements to their appropriate executors using CST.
 * Simple statements are dispatched via the data-driven route map;
 * complex statements with custom control flow are handled inline.
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import type { DataService } from '@/core/services/DataService'
import type { VariableService } from '@/core/services/VariableService'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

import { BeepExecutor } from './executors/BeepExecutor'
import { BgplayExecutor } from './executors/BgplayExecutor'
import { CgenExecutor } from './executors/CgenExecutor'
import { CgsetExecutor } from './executors/CgsetExecutor'
import { ClearExecutor } from './executors/ClearExecutor'
import { ClsExecutor } from './executors/ClsExecutor'
import { ColorExecutor } from './executors/ColorExecutor'
import { CutExecutor } from './executors/CutExecutor'
import { DefMoveExecutor } from './executors/DefMoveExecutor'
import { DefSpriteExecutor } from './executors/DefSpriteExecutor'
import { DimExecutor } from './executors/DimExecutor'
import { EndExecutor } from './executors/EndExecutor'
import { EraExecutor } from './executors/EraExecutor'
import { ForExecutor } from './executors/ForExecutor'
import { GosubExecutor } from './executors/GosubExecutor'
import { GotoExecutor } from './executors/GotoExecutor'
import { IfThenExecutor } from './executors/IfThenExecutor'
import { InputExecutor } from './executors/InputExecutor'
import { LetExecutor } from './executors/LetExecutor'
import { LinputExecutor } from './executors/LinputExecutor'
import { LocateExecutor } from './executors/LocateExecutor'
import { MoveExecutor } from './executors/MoveExecutor'
import { NextExecutor } from './executors/NextExecutor'
import { OnExecutor } from './executors/OnExecutor'
import { PaletExecutor } from './executors/PaletExecutor'
import { PauseExecutor } from './executors/PauseExecutor'
import { PlayExecutor } from './executors/PlayExecutor'
import { PositionExecutor } from './executors/PositionExecutor'
import { PrintExecutor } from './executors/PrintExecutor'
import { ReadExecutor } from './executors/ReadExecutor'
import { RestoreExecutor } from './executors/RestoreExecutor'
import { ReturnExecutor } from './executors/ReturnExecutor'
import { SpriteExecutor } from './executors/SpriteExecutor'
import { SpriteOnOffExecutor } from './executors/SpriteOnOffExecutor'
import { SwapExecutor } from './executors/SwapExecutor'
import { ViewExecutor } from './executors/ViewExecutor'
import type { ExpandedStatement } from './statement-expander'
import { tryDispatchSimpleStatement } from './statementRouteMap'

export class StatementRouter {
  printExecutor: PrintExecutor
  letExecutor: LetExecutor
  forExecutor: ForExecutor
  nextExecutor: NextExecutor
  endExecutor: EndExecutor
  pauseExecutor: PauseExecutor
  ifThenExecutor: IfThenExecutor
  inputExecutor: InputExecutor
  linputExecutor: LinputExecutor
  gotoExecutor: GotoExecutor
  gosubExecutor: GosubExecutor
  returnExecutor: ReturnExecutor
  onExecutor: OnExecutor
  dimExecutor: DimExecutor
  readExecutor: ReadExecutor
  restoreExecutor: RestoreExecutor
  clsExecutor: ClsExecutor
  swapExecutor: SwapExecutor
  clearExecutor: ClearExecutor
  locateExecutor: LocateExecutor
  colorExecutor: ColorExecutor
  cgsetExecutor: CgsetExecutor
  cgenExecutor: CgenExecutor
  paletExecutor: PaletExecutor
  defSpriteExecutor: DefSpriteExecutor
  spriteExecutor: SpriteExecutor
  spriteOnOffExecutor: SpriteOnOffExecutor
  defMoveExecutor: DefMoveExecutor
  moveExecutor: MoveExecutor
  cutExecutor: CutExecutor
  eraExecutor: EraExecutor
  positionExecutor: PositionExecutor
  playExecutor: PlayExecutor
  bgplayExecutor: BgplayExecutor
  viewExecutor: ViewExecutor
  beepExecutor: BeepExecutor

  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator,
    private variableService: VariableService,
    private dataService: DataService
  ) {
    this.printExecutor = new PrintExecutor(context, evaluator)
    this.letExecutor = new LetExecutor(variableService)
    this.forExecutor = new ForExecutor(context, evaluator, variableService)
    this.nextExecutor = new NextExecutor(context, variableService)
    this.endExecutor = new EndExecutor(context)
    this.pauseExecutor = new PauseExecutor(context, evaluator)
    this.ifThenExecutor = new IfThenExecutor(context, evaluator)
    this.inputExecutor = new InputExecutor(context, variableService)
    this.linputExecutor = new LinputExecutor(context, variableService)
    this.gotoExecutor = new GotoExecutor(context)
    this.gosubExecutor = new GosubExecutor(context)
    this.returnExecutor = new ReturnExecutor(context)
    this.onExecutor = new OnExecutor(context, evaluator, dataService)
    this.dimExecutor = new DimExecutor(context, evaluator, variableService)
    this.readExecutor = new ReadExecutor(dataService, variableService, evaluator)
    this.restoreExecutor = new RestoreExecutor(dataService)
    this.clsExecutor = new ClsExecutor(context)
    this.swapExecutor = new SwapExecutor(variableService)
    this.clearExecutor = new ClearExecutor(variableService)
    this.locateExecutor = new LocateExecutor(context, evaluator)
    this.colorExecutor = new ColorExecutor(context, evaluator)
    this.cgsetExecutor = new CgsetExecutor(context, evaluator)
    this.cgenExecutor = new CgenExecutor(context, evaluator)
    this.paletExecutor = new PaletExecutor(context, evaluator)
    this.defSpriteExecutor = new DefSpriteExecutor(context, evaluator)
    this.spriteExecutor = new SpriteExecutor(context, evaluator)
    this.spriteOnOffExecutor = new SpriteOnOffExecutor(context)
    this.defMoveExecutor = new DefMoveExecutor(context, evaluator)
    this.moveExecutor = new MoveExecutor(context, evaluator)
    this.cutExecutor = new CutExecutor(context, evaluator)
    this.eraExecutor = new EraExecutor(context, evaluator)
    this.positionExecutor = new PositionExecutor(context, evaluator)
    this.playExecutor = new PlayExecutor(context, evaluator)
    this.bgplayExecutor = new BgplayExecutor(context, evaluator)
    this.viewExecutor = new ViewExecutor(context)
    this.beepExecutor = new BeepExecutor(context)
  }

  /**
   * Route an expanded statement to its appropriate executor
   * Each expanded statement contains a single command (colon-separated commands are already expanded)
   */
  async executeStatement(expandedStatement: ExpandedStatement): Promise<void> {
    const commandCst = expandedStatement.command
    const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)

    if (!singleCommandCst) {
      // No singleCommand means this is a no-op (e.g., REM line with no executable code)
      // This is valid for GOTO/GOSUB targets that are comment lines
      return
    }

    // Try data-driven dispatch for simple statements first
    const dispatched = tryDispatchSimpleStatement(
      this,
      singleCommandCst,
      expandedStatement.lineNumber
    )
    if (dispatched) {
      await dispatched
      return
    }

    // Handle complex control-flow statements that require custom logic
    await this.executeComplexStatement(singleCommandCst, expandedStatement)
  }

  /**
   * Execute statements with complex control flow that cannot be handled
   * by the simple data-driven route map.
   */
  private async executeComplexStatement(
    singleCommandCst: CstNode,
    expandedStatement: ExpandedStatement
  ): Promise<void> {
    if (singleCommandCst.children.ifThenStatement) {
      await this.executeIfThen(singleCommandCst, expandedStatement)
    } else if (singleCommandCst.children.onStatement) {
      const onStmtCst = getFirstCstNode(singleCommandCst.children.onStatement)
      if (onStmtCst) {
        // ON may jump to another line - don't advance to next statement if it jumps
        this.onExecutor.execute(onStmtCst, expandedStatement.lineNumber)
        return
      }
    } else if (singleCommandCst.children.gotoStatement) {
      const gotoStmtCst = getFirstCstNode(singleCommandCst.children.gotoStatement)
      if (gotoStmtCst) {
        // GOTO jumps to another line - don't advance to next statement
        this.gotoExecutor.execute(gotoStmtCst, expandedStatement.lineNumber)
        return
      }
    } else if (singleCommandCst.children.gosubStatement) {
      const gosubStmtCst = getFirstCstNode(singleCommandCst.children.gosubStatement)
      if (gosubStmtCst) {
        // GOSUB jumps to another line - don't advance to next statement
        this.gosubExecutor.execute(gosubStmtCst, expandedStatement.lineNumber)
        return
      }
    } else if (singleCommandCst.children.returnStatement) {
      const returnStmtCst = getFirstCstNode(singleCommandCst.children.returnStatement)
      if (returnStmtCst) {
        // RETURN may jump to another line - don't advance to next statement if it jumps
        this.returnExecutor.execute(returnStmtCst, expandedStatement.lineNumber)
        return
      }
    } else if (singleCommandCst.children.forStatement) {
      this.executeForStatement(singleCommandCst, expandedStatement)
    } else if (singleCommandCst.children.nextStatement) {
      const nextStmtCst = getFirstCstNode(singleCommandCst.children.nextStatement)
      if (nextStmtCst) {
        // NEXT may modify statement index (jump back to FOR)
        const shouldContinue = this.nextExecutor.execute(nextStmtCst, expandedStatement.lineNumber)
        if (shouldContinue) {
          // Loop continues - don't advance to next statement
          return
        }
      }
    } else if (singleCommandCst.children.endStatement) {
      const endStmtCst = getFirstCstNode(singleCommandCst.children.endStatement)
      if (endStmtCst) {
        // END stops execution immediately
        this.endExecutor.execute(endStmtCst)
        return // Don't continue executing
      }
    } else if (singleCommandCst.children.pauseStatement) {
      const pauseStmtCst = getFirstCstNode(singleCommandCst.children.pauseStatement)
      if (pauseStmtCst) {
        await this.pauseExecutor.execute(pauseStmtCst)
      }
      return
    } else if (singleCommandCst.children.inputStatement) {
      const inputStmtCst = getFirstCstNode(singleCommandCst.children.inputStatement)
      if (inputStmtCst) {
        await this.inputExecutor.execute(inputStmtCst)
      }
      return
    } else if (singleCommandCst.children.linputStatement) {
      const linputStmtCst = getFirstCstNode(singleCommandCst.children.linputStatement)
      if (linputStmtCst) {
        await this.linputExecutor.execute(linputStmtCst)
      }
      return
    } else if (singleCommandCst.children.dataStatement) {
      // DATA statements are preprocessed, but we still need to handle them during execution
      // (they're no-ops during execution, but we process them during preprocessing)
      const dataStmtCst = getFirstCstNode(singleCommandCst.children.dataStatement)
      if (dataStmtCst) {
        // DATA statements are already processed during preprocessing
        // During execution, they are no-ops
        if (this.context.config.enableDebugMode) {
          this.context.addDebugOutput('DATA: Statement already processed during preprocessing')
        }
      }
    } else {
      // Other statement types not yet implemented
      this.context.addError({
        line: expandedStatement.lineNumber,
        message: 'Unsupported statement type',
        type: ERROR_TYPES.RUNTIME,
        code: 'UNSUPPORTED_FEATURE',
      })
    }
  }

  /**
   * Execute IF-THEN statement with condition evaluation, line number jumps,
   * and THEN clause execution including FOR/NEXT loop handling.
   */
  private async executeIfThen(
    singleCommandCst: CstNode,
    expandedStatement: ExpandedStatement
  ): Promise<void> {
    const ifThenStmtCst = getFirstCstNode(singleCommandCst.children.ifThenStatement)
    if (!ifThenStmtCst) return

    // Evaluate condition
    const conditionIsTrue = this.ifThenExecutor.evaluateCondition(ifThenStmtCst, expandedStatement.lineNumber)

    // When condition is false, skip colon-scoped statements on the same line
    if (!conditionIsTrue && expandedStatement.ifScopeEndIndex !== undefined) {
      this.context.jumpToStatement(expandedStatement.ifScopeEndIndex + 1)
      return
    }

    // Execute THEN clause if condition is true
    if (!conditionIsTrue) return

    // Check if it's a line number jump (IF ... THEN number or IF ... GOTO number)
    if (this.ifThenExecutor.hasLineNumberJump(ifThenStmtCst)) {
      const targetLineNumber = this.ifThenExecutor.getLineNumber(ifThenStmtCst)
      if (targetLineNumber !== undefined) {
        const targetStatementIndex = this.context.findStatementIndexByLine(targetLineNumber)
        if (targetStatementIndex === -1) {
          this.context.addError({
            line: expandedStatement.lineNumber,
            message: `IF-THEN: line number ${targetLineNumber} not found`,
            type: ERROR_TYPES.RUNTIME,
          })
        } else {
          if (this.context.config.enableDebugMode) {
            this.context.addDebugOutput(
              `IF-THEN: jumping to line ${targetLineNumber} (statement index ${targetStatementIndex})`
            )
          }
          this.context.jumpToStatement(targetStatementIndex)
          return // Don't advance to next statement
        }
      }
    }

    // Otherwise, execute statements in THEN clause
    const thenCommandListCst = this.ifThenExecutor.getThenClause(ifThenStmtCst)
    if (!thenCommandListCst) return

    // Get all commands from the command list (colon-separated commands)
    const thenCommands = getCstNodes(thenCommandListCst.children.command)

    // Execute each command in the THEN clause sequentially
    // Use a local index counter to track position within THEN clause for FOR/NEXT loops
    let thenCommandIndex = 0
    while (thenCommandIndex < thenCommands.length) {
      const commandCst = thenCommands[thenCommandIndex]
      if (!commandCst) break

      const thenStatement: ExpandedStatement = {
        statementIndex: expandedStatement.statementIndex, // Keep same statement index
        lineNumber: expandedStatement.lineNumber,
        command: commandCst,
      }

      // Execute the command
      await this.executeStatement(thenStatement)

      // Check if NEXT caused a jump back (loop continuation)
      // If so, we need to restart from the FOR statement in the THEN clause
      const thenSingleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
      if (thenSingleCommandCst?.children.nextStatement) {
        const nextStmtCst = getFirstCstNode(thenSingleCommandCst.children.nextStatement)
        if (nextStmtCst) {
          // Check if NEXT caused a jump - if loop stack has a loop for this line
          // and the current statement index matches, we need to find the FOR in THEN clause
          // NEXT always refers to the innermost loop (no variable name in Family BASIC)
          const activeLoop = this.context.loopStack.find(
            loop => loop.statementIndex === expandedStatement.statementIndex
          )
          if (activeLoop) {
            // Loop is active - find the FOR statement in THEN clause and restart from there
            // Find the index of the FOR statement for this variable
            const varName = activeLoop.variableName
            for (let i = 0; i < thenCommands.length; i++) {
              const cmd = thenCommands[i]
              const singleCmd = getFirstCstNode(cmd?.children.singleCommand)
              const forStmt = getFirstCstNode(singleCmd?.children.forStatement)
              if (forStmt) {
                const forVarToken = getFirstToken(forStmt.children.Identifier)
                if (forVarToken?.image.toUpperCase() === varName) {
                  thenCommandIndex = i // Jump back to FOR statement
                  break
                }
              }
            }
            continue // Continue loop to re-execute from FOR
          }
        }
      }

      // Move to next command
      thenCommandIndex++
    }
  }

  /**
   * Execute FOR statement with loop-stack check for re-entry from NEXT.
   */
  private executeForStatement(
    singleCommandCst: CstNode,
    expandedStatement: ExpandedStatement
  ): void {
    const forStmtCst = getFirstCstNode(singleCommandCst.children.forStatement)
    if (!forStmtCst) return

    // Check if loop is already active (jumped back from NEXT)
    // If so, skip FOR initialization
    const identifierToken = getFirstToken(forStmtCst.children.Identifier)
    if (identifierToken) {
      const varName = identifierToken.image.toUpperCase()
      const existingLoop = this.context.loopStack.find(
        loop => loop.variableName === varName && loop.statementIndex === expandedStatement.statementIndex
      )
      if (existingLoop) {
        // Loop already active - skip FOR initialization
        return
      }
    }
    // Pass current statement index and line number for loop tracking
    this.forExecutor.execute(forStmtCst, expandedStatement.statementIndex, expandedStatement.lineNumber)
  }
}
