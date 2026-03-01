# Playwright MCP Reference

## Available Tools

All tools are prefixed with `mcp__playwright__`:

| Tool | Parameters | Description |
|------|------------|-------------|
| `browser_navigate` | `url` | Navigate to URL |
| `browser_snapshot` | - | Get DOM snapshot with element refs |
| `browser_click` | `ref`, `element` | Click element by ref |
| `browser_type` | `ref`, `element`, `text` | Type text into element |
| `browser_take_screenshot` | `type` | Capture viewport |
| `browser_console_messages` | `level` | Get console output |
| `browser_evaluate` | `function` | Execute JavaScript |
| `browser_press_key` | `key` | Press keyboard key |
| `browser_hover` | `ref`, `element` | Hover over element |
| `browser_wait_for` | `text` or `time` | Wait for condition |

## Snapshot-Based Interaction

Playwright MCP uses accessibility tree snapshots. Each element has a `ref` (e.g., `e555`):

```yaml
button "运行" [ref=e555] [cursor=pointer]:
  - img [ref=e557]
```

To click: use `browser_click` with `ref: e555`

## Common Patterns

### Navigate and Snapshot
```
1. browser_navigate url: http://localhost:5174/ide  # AI automation port
2. browser_snapshot → get refs
3. browser_click ref: e555 (from snapshot)
```

### Wait for Page Load
```
browser_wait_for text: "F-BASIC IDE"
```

### Execute JavaScript
```
browser_evaluate function: () => {
  return document.title;
}
```

## Error Handling

- **"Ref not found"**: Call `browser_snapshot` to get fresh refs
- **"Timeout"**: Increase wait time or check if element exists
- **"Element not editable"**: Element may need focus first

## F-BASIC IDE Workflow

The reliable workflow for testing:

1. Navigate to `/ide`
2. Click "示例" to open samples
3. Click a sample card to load code
4. Click "运行" to execute
5. Take screenshot
6. Check console messages
