# F-BASIC IDE

A web-based IDE for F-BASIC (Family BASIC), the classic Nintendo programming language. Write, run, and debug F-BASIC programs directly in your browser.

## Quick Start

```bash
pnpm install   # Install dependencies
pnpm dev       # Start development server
```

Open http://localhost:5173 and start coding!

## Features

- Authentic F-BASIC syntax with real-time execution
- Monaco code editor with syntax highlighting
- Sprite and character viewers
- Multi-language support (EN, JA, zh-CN, zh-TW)

## Tech Stack

Vue 3 + TypeScript + Vite + Chevrotain parser

## Documentation

- [CLAUDE.md](CLAUDE.md) - AI coding guidelines and architecture
- [docs/reference/](docs/reference/) - F-BASIC language manual
- [docs/teams/](docs/teams/) - Team-specific documentation

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test:run` | Run tests |
| `pnpm lint` | Lint and format |
| `pnpm type-check` | TypeScript check |
| `pnpm verify:build-size-budgets` | Enforce initial app-shell JS chunk budget (<= 1.5 MB raw) |

## Contributing

1. Fork, branch, code
2. Write tests for new features
3. Run `pnpm lint && pnpm test:run`
4. Submit PR

## License

MIT

## Acknowledgments

- F-BASIC (Family BASIC) language specification
- Vue.js, Vite, and Chevrotain teams
