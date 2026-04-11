/**
 * Statement Router
 *
 * Routes BASIC statements to their appropriate executors using CST.
 */

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
import { DataExecutor } from './executors/DataExecutor'
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

export class StatementRouter {
  private printExecutor: PrintExecutor
  private letExecutor: LetExecutor
  private forExecutor: ForExecutor
  private nextExecutor: NextExecutor
  private endExecutor: EndExecutor
  private pauseExecutor: PauseExecutor
  private ifThenExecutor: IfThenExecutor
  private inputExecutor: InputExecutor
  private linputExecutor: LinputExecutor
  private gotoExecutor: GotoExecutor
  private gosubExecutor: GosubExecutor
  private returnExecutor: ReturnExecutor
  private onExecutor: OnExecutor
  private dimExecutor: DimExecutor
  private dataExecutor: DataExecutor
  private readExecutor: ReadExecutor
  private restoreExecutor: RestoreExecutor
  private clsExecutor: ClsExecutor
  private swapExecutor: SwapExecutor
  private clearExecutor: ClearExecutor
  private locateExecutor: LocateExecutor
  private colorExecutor: ColorExecutor
  private cgsetExecutor: CgsetExecutor
  private cgenExecutor: CgenExecutor
  private paletExecutor: PaletExecutor
  private defSpriteExecutor: DefSpriteExecutor
  private spriteExecutor: SpriteExecutor
  private spriteOnOffExecutor: SpriteOnOffExecutor
  private defMoveExecutor: DefMoveExecutor
  private moveExecutor: MoveExecutor
  private cutExecutor: CutExecutor
  private eraExecutor: EraExecutor
  private positionExecutor: PositionExecutor
  private playExecutor: PlayExecutor
  private bgplayExecutor: BgplayExecutor
  private viewExecutor: ViewExecutor
  private beepExecutor: BeepExecutor

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
    this.dataExecutor = new DataExecutor(dataService)
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

    // Check which command type we have
    if (singleCommandCst.children.ifThenStatement) {
      const ifThenStmtCst = getFirstCstNode(singleCommandCst.children.ifThenStatement)
      if (ifThenStmtCst) {
        // Evaluate condition
        const conditionIsTrue = this.ifThenExecutor.evaluateCondition(ifThenStmtCst, expandedStatement.lineNumber)

        // When condition is false, skip colon-scoped statements on the same line
        if (!conditionIsTrue && expandedStatement.ifScopeEndIndex !== undefined) {
          this.context.jumpToStatement(expandedStatement.ifScopeEndIndex + 1)
          return
        }

        // Execute THEN clause if condition is true
        if (conditionIsTrue) {
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
          if (thenCommandListCst) {
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
              const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
              if (singleCommandCst?.children.nextStatement) {
                const nextStmtCst = getFirstCstNode(singleCommandCst.children.nextStatement)
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
        }
      }
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
    } else if (singleCommandCst.children.printStatement) {
      const printStmtCst = getFirstCstNode(singleCommandCst.children.printStatement)
      if (printStmtCst) {
        this.printExecutor.execute(printStmtCst)
      }
    } else if (singleCommandCst.children.letStatement) {
      const letStmtCst = getFirstCstNode(singleCommandCst.children.letStatement)
      if (letStmtCst) {
        this.letExecutor.execute(letStmtCst)
      }
    } else if (singleCommandCst.children.forStatement) {
      const forStmtCst = getFirstCstNode(singleCommandCst.children.forStatement)
      if (forStmtCst) {
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
    } else if (singleCommandCst.children.dimStatement) {
      const dimStmtCst = getFirstCstNode(singleCommandCst.children.dimStatement)
      if (dimStmtCst) {
        this.dimExecutor.execute(dimStmtCst, expandedStatement.lineNumber)
      }
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
    } else if (singleCommandCst.children.readStatement) {
      const readStmtCst = getFirstCstNode(singleCommandCst.children.readStatement)
      if (readStmtCst) {
        this.readExecutor.execute(readStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.restoreStatement) {
      const restoreStmtCst = getFirstCstNode(singleCommandCst.children.restoreStatement)
      if (restoreStmtCst) {
        this.restoreExecutor.execute(restoreStmtCst)
      }
    } else if (singleCommandCst.children.clsStatement) {
      const clsStmtCst = getFirstCstNode(singleCommandCst.children.clsStatement)
      if (clsStmtCst) {
        this.clsExecutor.execute(clsStmtCst)
      }
    } else if (singleCommandCst.children.swapStatement) {
      const swapStmtCst = getFirstCstNode(singleCommandCst.children.swapStatement)
      if (swapStmtCst) {
        this.swapExecutor.execute(swapStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.clearStatement) {
      const clearStmtCst = getFirstCstNode(singleCommandCst.children.clearStatement)
      if (clearStmtCst) {
        this.clearExecutor.execute(clearStmtCst)
      }
    } else if (singleCommandCst.children.locateStatement) {
      const locateStmtCst = getFirstCstNode(singleCommandCst.children.locateStatement)
      if (locateStmtCst) {
        this.locateExecutor.execute(locateStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.colorStatement) {
      const colorStmtCst = getFirstCstNode(singleCommandCst.children.colorStatement)
      if (colorStmtCst) {
        this.colorExecutor.execute(colorStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.cgsetStatement) {
      const cgsetStmtCst = getFirstCstNode(singleCommandCst.children.cgsetStatement)
      if (cgsetStmtCst) {
        this.cgsetExecutor.execute(cgsetStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.cgenStatement) {
      const cgenStmtCst = getFirstCstNode(singleCommandCst.children.cgenStatement)
      if (cgenStmtCst) {
        this.cgenExecutor.execute(cgenStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.paletStatement) {
      const paletStmtCst = getFirstCstNode(singleCommandCst.children.paletStatement)
      if (paletStmtCst) {
        this.paletExecutor.execute(paletStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.defSpriteStatement) {
      const defSpriteStmtCst = getFirstCstNode(singleCommandCst.children.defSpriteStatement)
      if (defSpriteStmtCst) {
        this.defSpriteExecutor.execute(defSpriteStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.spriteStatement) {
      const spriteStmtCst = getFirstCstNode(singleCommandCst.children.spriteStatement)
      if (spriteStmtCst) {
        this.spriteExecutor.execute(spriteStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.spriteOnOffStatement) {
      const spriteOnOffStmtCst = getFirstCstNode(singleCommandCst.children.spriteOnOffStatement)
      if (spriteOnOffStmtCst) {
        this.spriteOnOffExecutor.execute(spriteOnOffStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.defMoveStatement) {
      const defMoveStmtCst = getFirstCstNode(singleCommandCst.children.defMoveStatement)
      if (defMoveStmtCst) {
        this.defMoveExecutor.execute(defMoveStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.moveStatement) {
      const moveStmtCst = getFirstCstNode(singleCommandCst.children.moveStatement)
      if (moveStmtCst) {
        this.moveExecutor.execute(moveStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.cutStatement) {
      const cutStmtCst = getFirstCstNode(singleCommandCst.children.cutStatement)
      if (cutStmtCst) {
        this.cutExecutor.execute(cutStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.eraStatement) {
      const eraStmtCst = getFirstCstNode(singleCommandCst.children.eraStatement)
      if (eraStmtCst) {
        this.eraExecutor.execute(eraStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.positionStatement) {
      const positionStmtCst = getFirstCstNode(singleCommandCst.children.positionStatement)
      if (positionStmtCst) {
        this.positionExecutor.execute(positionStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.playStatement) {
      const playStmtCst = getFirstCstNode(singleCommandCst.children.playStatement)
      if (playStmtCst) {
        await this.playExecutor.execute(playStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.bgplayStatement) {
      const bgplayStmtCst = getFirstCstNode(singleCommandCst.children.bgplayStatement)
      if (bgplayStmtCst) {
        await this.bgplayExecutor.execute(bgplayStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.viewStatement) {
      const viewStmtCst = getFirstCstNode(singleCommandCst.children.viewStatement)
      if (viewStmtCst) {
        this.viewExecutor.execute(viewStmtCst, expandedStatement.lineNumber)
      }
    } else if (singleCommandCst.children.beepStatement) {
      const beepStmtCst = getFirstCstNode(singleCommandCst.children.beepStatement)
      if (beepStmtCst) {
        this.beepExecutor.execute(beepStmtCst)
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
}
