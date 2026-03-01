# Chrome DevTools MCP Reference

## Status

Chrome DevTools MCP requires Chrome to be installed and may need additional setup. Playwright MCP is recommended for most tasks.

## Available Tools

Tools are prefixed with `mcp__chrome-devtools__`:

| Tool | Description |
|------|-------------|
| `navigate_page` | Navigate to URL |
| `take_snapshot` | Get DOM snapshot |
| `take_screenshot` | Capture page |
| `click` | Click element |
| `type_text` | Type text |
| `evaluate_script` | Execute JavaScript |
| `list_console_messages` | Get console output |
| `list_network_requests` | Get network requests |

## When to Use

Chrome DevTools MCP is useful for:
- Deep console inspection with full stack traces
- Network request debugging
- Complex JavaScript evaluation
- When you need CDP-level access

## Setup Requirements

Chrome DevTools MCP requires:
1. Chrome browser installed at standard location
2. May need Chrome launched with remote debugging enabled

For most F-BASIC IDE testing, Playwright MCP is simpler and more reliable.

## JavaScript Evaluation Examples

```javascript
// Check available globals
Object.keys(window).filter(k => k.includes('FBasic'));

// Get canvas content
document.querySelector('canvas')?.toDataURL('image/png');

// Monitor console
const logs = [];
const original = console.log;
console.log = (...args) => { logs.push(args); original(...args); };
window.__logs = logs;
```
