---
name: browser-test
description: |
  Browser automation testing for F-BASIC IDE using Playwright MCP.
  Use when you need to: (1) Test the IDE UI by running BASIC programs, (2) Capture console output and errors,
  (3) Inspect DOM elements like screen buffer or sprite states, (4) Take screenshots for visual verification,
  (5) Debug runtime issues by capturing browser logs. Triggers: "test in browser", "run UI test",
  "capture console", "check screen output", "verify sprites render".
---

# Browser Testing for F-BASIC IDE

## Prerequisites

- Dev server running on **port 5174** (AI automation port)
  - If 5173 is in use by human, Vite auto-assigns 5174
  - Or start a second instance: `pnpm dev` in a separate terminal
- Chrome browser installed
- MCP servers: `playwright` (primary), `chrome-devtools` (optional)

## Quick Reference

| Task | Tool | Example |
|------|------|---------|
| Navigate | `browser_navigate` | `url: http://localhost:5174/ide` |
| Click | `browser_click` | `ref: e555` (from snapshot) |
| Screenshot | `browser_take_screenshot` | `type: png` |
| Console logs | `browser_console_messages` | `level: info` |
| DOM snapshot | `browser_snapshot` | Returns element refs |
| Execute JS | `browser_evaluate` | `function: () => {...}` |

## Recommended Workflow: Load Sample + Run

Typing into Monaco editor is unreliable. Use sample loading instead:

```
1. browser_navigate to http://localhost:5174/ide
2. browser_snapshot to get current refs
3. browser_click the "示例" (Examples) button
4. browser_snapshot to get dialog refs
5. browser_click desired sample card
6. browser_click the "运行" (Run) button
7. browser_take_screenshot to capture output
8. browser_console_messages to check logs
```

## UI Element Reference (Chinese)

| Element | Text | Notes |
|---------|------|-------|
| Examples button | `示例` | Opens sample dialog |
| Run button | `运行` | Executes program |
| Stop button | `停止` | Disabled until running |
| Clear button | `清除` | Clears screen |
| Debug button | `调试` | Opens debug panel |
| Samples dialog | `加载示例` | Contains sample programs |

## Working with Snapshots

Element refs (e.g., `e555`) change each page load. Always:

1. Call `browser_snapshot` before interacting
2. Use the latest refs from snapshot result
3. Refs become stale after navigation

## Screenshot Output

Screenshots save to `.playwright-mcp/` directory:
```
.playwright-mcp/page-2026-03-01T08-55-51-644Z.png
```

## Console Message Levels

```
browser_console_messages with level:
- "error" - Errors only
- "warning" - Errors + warnings
- "info" - Errors + warnings + logs (default)
- "debug" - All messages
```

## Tips

- Use `browser_snapshot` to discover clickable elements
- Chinese button text: 运行 (Run), 示例 (Examples), 停止 (Stop)
- Screenshots are saved automatically with timestamps
- Console messages include source file and line numbers

## References

- [playwright-mcp.md](references/playwright-mcp.md) - Detailed Playwright patterns
- [chrome-devtools-mcp.md](references/chrome-devtools-mcp.md) - Chrome DevTools patterns
