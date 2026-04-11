# Architecture Overview

System architecture for orchestration decisions.

## System Layers

```
┌─────────────────────────────────────────┐
│  UI Layer (Vue 3)                       │
│  ├─ IDE (editor, console)               │  ← IDE Dev
│  └─ Tools (viewer, editor, diagnostics) │  ← Tools Dev
└─────────────────────────────────────────┘
         │ Worker messages / SharedBuffer
┌─────────────────────────────────────────┐
│  Core Interpreter (DOM-free)            │
│  ├─ Parser (Chevrotain CST)             │  ← Parser Dev
│  ├─ Execution Engine                    │  ← Runtime Dev
│  ├─ Expression Evaluator                │  ← Runtime Dev
│  └─ Sound System                        │  ← Sound Dev
└─────────────────────────────────────────┘
         │
┌─────────────────────────────────────────┐
│  Platform Layer                         │
│  ├─ Device Adapters                     │  ← Device Dev
│  └─ Animation & Sprites                 │  ← Graphics Dev
└─────────────────────────────────────────┘
```

## Data Flow

```
Parser → Runtime → Device → Graphics → IDE
  CST     Executor  Adapter   Buffer    Render
                 ↘ Sound ↗
```

## Worker Architecture

Interpreter runs in **Web Worker** for non-blocking execution:
- Main → Worker: `EXECUTE`, `STOP`, `INPUT_VALUE`
- Worker → Main: `OUTPUT`, `SCREEN_CHANGED`, `PLAY_SOUND`
- SharedArrayBuffer for sprite positions (Animation Worker is single writer)
