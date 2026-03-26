/**
 * F-BASIC Parser Tokens
 *
 * Token definitions and lexer setup for F-BASIC language parser.
 * Separated from parser class for better code organization.
 */

import { createToken, Lexer } from 'chevrotain'

// ============================================================================
// TOKEN DEFINITIONS
// ============================================================================

// Keywords (must be before Identifier)
// Note: PALETB and PALETS must come before PALET to match the longer form first
export const Let = createToken({ name: 'Let', pattern: /\bLET\b/i })
export const Print = createToken({ name: 'Print', pattern: /\bPRINT\b/i })
export const For = createToken({ name: 'For', pattern: /\bFOR\b/i })
export const To = createToken({ name: 'To', pattern: /\bTO\b/i })
export const Step = createToken({ name: 'Step', pattern: /\bSTEP\b/i })
export const Next = createToken({ name: 'Next', pattern: /\bNEXT\b/i })
export const End = createToken({ name: 'End', pattern: /\bEND\b/i })
export const Rem = createToken({ name: 'Rem', pattern: /\bREM\b/i })
export const Pause = createToken({ name: 'Pause', pattern: /\bPAUSE\b/i })
// BGPLAY must come before PLAY to match the longer form first
export const Bgplay = createToken({ name: 'Bgplay', pattern: /\bBGPLAY\b/i })
export const Play = createToken({ name: 'Play', pattern: /\bPLAY\b/i })
export const If = createToken({ name: 'If', pattern: /\bIF\b/i })
export const Then = createToken({ name: 'Then', pattern: /\bTHEN\b/i })
export const Goto = createToken({ name: 'Goto', pattern: /\bGOTO\b/i })
export const Gosub = createToken({ name: 'Gosub', pattern: /\bGOSUB\b/i })
export const Return = createToken({ name: 'Return', pattern: /\bRETURN\b/i })
export const On = createToken({ name: 'On', pattern: /\bON\b/i })
export const Off = createToken({ name: 'Off', pattern: /\bOFF\b/i })
export const Dim = createToken({ name: 'Dim', pattern: /\bDIM\b/i })
export const Data = createToken({ name: 'Data', pattern: /\bDATA\b/i })
export const Read = createToken({ name: 'Read', pattern: /\bREAD\b/i })
export const Restore = createToken({ name: 'Restore', pattern: /\bRESTORE\b/i })
export const Input = createToken({ name: 'Input', pattern: /\bINPUT\b/i })
export const Linput = createToken({ name: 'Linput', pattern: /\bLINPUT\b/i })
export const Cls = createToken({ name: 'Cls', pattern: /\bCLS\b/i })
export const Swap = createToken({ name: 'Swap', pattern: /\bSWAP\b/i })
export const Clear = createToken({ name: 'Clear', pattern: /\bCLEAR\b/i })
export const Locate = createToken({ name: 'Locate', pattern: /\bLOCATE\b/i })
export const Color = createToken({ name: 'Color', pattern: /\bCOLOR\b/i })
export const Cgset = createToken({ name: 'Cgset', pattern: /\bCGSET\b/i })
export const Cgen = createToken({ name: 'Cgen', pattern: /\bCGEN\b/i })
// PALETB and PALETS must come before PALET to match longer forms first
export const Paletb = createToken({ name: 'Paletb', pattern: /\bPALETB\b/i })
export const Palets = createToken({ name: 'Palets', pattern: /\bPALETS\b/i })
export const Palet = createToken({ name: 'Palet', pattern: /\bPALET\b/i })
export const View = createToken({ name: 'View', pattern: /\bVIEW\b/i })

// Sprite commands
export const Def = createToken({ name: 'Def', pattern: /\bDEF\b/i })
export const Sprite = createToken({ name: 'Sprite', pattern: /\bSPRITE\b/i })
export const Move = createToken({ name: 'Move', pattern: /\bMOVE\b/i })
export const Cut = createToken({ name: 'Cut', pattern: /\bCUT\b/i })
export const Era = createToken({ name: 'Era', pattern: /\bERA\b/i })
export const Position = createToken({ name: 'Position', pattern: /\bPOSITION\b/i })

// REPL-only commands (not applicable in IDE version)
export const List = createToken({ name: 'List', pattern: /\bLIST\b/i })
export const New = createToken({ name: 'New', pattern: /\bNEW\b/i })
export const Run = createToken({ name: 'Run', pattern: /\bRUN\b/i })
export const Save = createToken({ name: 'Save', pattern: /\bSAVE\b/i })
export const Load = createToken({ name: 'Load', pattern: /\bLOAD\b/i })
export const Key = createToken({ name: 'Key', pattern: /\bKEY\b/i })
export const Keylist = createToken({ name: 'Keylist', pattern: /\bKEYLIST\b/i })
export const Cont = createToken({ name: 'Cont', pattern: /\bCONT\b/i })
export const System = createToken({ name: 'System', pattern: /\bSYSTEM\b/i })

// Limited utility commands (not applicable in IDE version)
export const Poke = createToken({ name: 'Poke', pattern: /\bPOKE\b/i })
export const Peek = createToken({ name: 'Peek', pattern: /\bPEEK\b/i })
export const Fre = createToken({ name: 'Fre', pattern: /\bFRE\b/i })
export const Inkey = createToken({ name: 'Inkey', pattern: /\bINKEY\$/i })
export const Stop = createToken({ name: 'Stop', pattern: /\bSTOP\b/i })

// String function keywords (must be before Identifier)
export const Len = createToken({ name: 'Len', pattern: /\bLEN\b/i })
export const Left = createToken({ name: 'Left', pattern: /\bLEFT\$/i })
export const Right = createToken({ name: 'Right', pattern: /\bRIGHT\$/i })
export const Mid = createToken({ name: 'Mid', pattern: /\bMID\$/i })
export const Str = createToken({ name: 'Str', pattern: /\bSTR\$/i })
export const Hex = createToken({ name: 'Hex', pattern: /\bHEX\$/i })
export const Chr = createToken({ name: 'Chr', pattern: /\bCHR\$/i })
export const Asc = createToken({ name: 'Asc', pattern: /\bASC\b/i })

// Arithmetic function keywords (must be before Identifier)
// Family BASIC only supports: ABS, SGN, RND
export const Abs = createToken({ name: 'Abs', pattern: /\bABS\b/i })
export const Sgn = createToken({ name: 'Sgn', pattern: /\bSGN\b/i })
export const Rnd = createToken({ name: 'Rnd', pattern: /\bRND\b/i })
export const Val = createToken({ name: 'Val', pattern: /\bVAL\b/i })

// Controller input function keywords (must be before Identifier)
export const Stick = createToken({ name: 'Stick', pattern: /\bSTICK\b/i })
export const Strig = createToken({ name: 'Strig', pattern: /\bSTRIG\b/i })
// Sprite query function keywords (must be before Identifier)
export const Xpos = createToken({ name: 'Xpos', pattern: /\bXPOS\b/i })
export const Ypos = createToken({ name: 'Ypos', pattern: /\bYPOS\b/i })
// Cursor position function keywords (must be before Identifier)
export const Csrlin = createToken({ name: 'Csrlin', pattern: /\bCSRLIN\b/i })
export const Pos = createToken({ name: 'Pos', pattern: /\bPOS\b/i })
// Screen read function keyword (string function with $ suffix)
export const Scr = createToken({ name: 'Scr', pattern: /\bSCR\$/i })
// BEEP statement keyword (must be before Identifier)
export const Beep = createToken({ name: 'Beep', pattern: /\bBEEP\b/i })

// Logical operators (must be before Identifier)
export const And = createToken({ name: 'And', pattern: /\bAND\b/i })
export const Or = createToken({ name: 'Or', pattern: /\bOR\b/i })
export const Xor = createToken({ name: 'Xor', pattern: /\bXOR\b/i })
export const Not = createToken({ name: 'Not', pattern: /\bNOT\b/i })

// Comparison operators (must come before Equal to avoid ambiguity)
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ })
export const LessThan = createToken({ name: 'LessThan', pattern: /</ })
export const NotEqual = createToken({ name: 'NotEqual', pattern: /<>/ })
export const GreaterThanOrEqual = createToken({
  name: 'GreaterThanOrEqual',
  pattern: />=/,
})
export const LessThanOrEqual = createToken({
  name: 'LessThanOrEqual',
  pattern: /<=/,
})

// Operators
export const Equal = createToken({ name: 'Equal', pattern: /=/ })
export const Plus = createToken({ name: 'Plus', pattern: /\+/ })
export const Minus = createToken({ name: 'Minus', pattern: /-/ })
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ })
export const Divide = createToken({ name: 'Divide', pattern: /\// })
export const Mod = createToken({ name: 'Mod', pattern: /\bMOD\b/i })

// Punctuation
export const Comma = createToken({ name: 'Comma', pattern: /,/ })
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ })
export const Colon = createToken({ name: 'Colon', pattern: /:/ })
export const LParen = createToken({ name: 'LParen', pattern: /\(/ })
export const RParen = createToken({ name: 'RParen', pattern: /\)/ })

// Additional punctuation and special characters for REM statements
// These are only used in REM comments, so they have lower priority
export const Period = createToken({ name: 'Period', pattern: /\./ })
export const Hash = createToken({ name: 'Hash', pattern: /#/ })
export const Dollar = createToken({ name: 'Dollar', pattern: /\$/ })
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ })
export const RBracket = createToken({ name: 'RBracket', pattern: /\]/ })
export const Exclamation = createToken({ name: 'Exclamation', pattern: /!/ })
export const Question = createToken({ name: 'Question', pattern: /\?/ })
export const AtSign = createToken({ name: 'AtSign', pattern: /@/ })
export const Percent = createToken({ name: 'Percent', pattern: /%/ })
export const LBrace = createToken({ name: 'LBrace', pattern: /\{/ })
export const RBrace = createToken({ name: 'RBrace', pattern: /\}/ })
export const Pipe = createToken({ name: 'Pipe', pattern: /\|/ })
export const Tilde = createToken({ name: 'Tilde', pattern: /~/ })
export const Underscore = createToken({ name: 'Underscore', pattern: /_/ })
export const Backslash = createToken({ name: 'Backslash', pattern: /\\/ })
export const Apostrophe = createToken({ name: 'Apostrophe', pattern: /'/ })

// Literals
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"[^"]*"/,
})

// HexLiteral - &H followed by hex digits (e.g. &HDD = 221 decimal)
export const HexLiteral = createToken({
  name: 'HexLiteral',
  pattern: /&H[0-9A-Fa-f]+/,
})

// NumberLiteral - only integers allowed (no decimal point, no scientific notation)
// Family Basic only supports integer numerical variables
export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /\d+/,
})

// Identifier (must come after keywords)
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[A-Za-z][A-Za-z0-9$]*/,
})

// Whitespace (skipped)
export const Whitespace = createToken({
  name: 'Whitespace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
})

// All tokens in order (more specific patterns first)
export const allTokens = [
  Whitespace,
  // Keywords
  Let,
  Print,
  For,
  To,
  Step,
  Next,
  End,
  Rem,
  Pause,
  Bgplay,
  Play,
  If,
  Then,
  Goto,
  Gosub,
  Return,
  On,
  Off,
  Dim,
  Data,
  Read,
  Restore,
  Input,
  Linput,
  Cls,
  Swap,
  Clear,
  Locate,
  Color,
  Cgset,
  Cgen,
  Paletb,
  Palets,
  Palet,
  View,
  Def,
  Sprite,
  Move,
  Cut,
  Era,
  Position,
  // REPL-only commands (must come before Identifier)
  List,
  New,
  Run,
  Save,
  Load,
  Key,
  Keylist,
  Cont,
  System,
  // Limited utility commands (must come before Identifier)
  Poke,
  Peek,
  Fre,
  Inkey,
  Stop,
  // String functions (must come before Identifier)
  Len,
  Left,
  Right,
  Mid,
  Str,
  Hex,
  Chr,
  Asc,
  // Arithmetic functions (must come before Identifier)
  // Family BASIC only supports: ABS, SGN, RND, VAL
  Abs,
  Sgn,
  Rnd,
  Val,
  // Controller input function keywords (must come before Identifier)
  Stick,
  Strig,
  // Sprite query function keywords (must come before Identifier)
  Xpos,
  Ypos,
  // Cursor position function keywords (must come before Identifier)
  Csrlin,
  Pos,
  // Screen read function keyword (string function with $ suffix)
  Scr,
  // BEEP statement keyword (must come before Identifier)
  Beep,
  // Logical operators (must come before Identifier)
  And,
  Or,
  Xor,
  Not,
  // Comparison operators (must come before Equal to avoid ambiguity)
  GreaterThanOrEqual,
  LessThanOrEqual,
  NotEqual,
  GreaterThan,
  LessThan,
  // Operators
  Equal,
  Plus,
  Minus,
  Multiply,
  Divide,
  Mod,
  // Punctuation
  Comma,
  Semicolon,
  Colon,
  LParen,
  RParen,
  // Additional punctuation for REM statements (lower priority, after main punctuation)
  Period,
  Hash,
  Dollar,
  LBracket,
  RBracket,
  Exclamation,
  Question,
  AtSign,
  Percent,
  LBrace,
  RBrace,
  Pipe,
  Tilde,
  Underscore,
  Backslash,
  Apostrophe,
  // Literals (HexLiteral before NumberLiteral so &H... is one token)
  StringLiteral,
  HexLiteral,
  NumberLiteral,
  Identifier,
]

// ============================================================================
// LEXER
// ============================================================================

// Create lexer
export const lexer = new Lexer(allTokens, {
  positionTracking: 'full',
})
