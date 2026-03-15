# F-BASIC IDE

A web-based IDE for F-BASIC (Family BASIC), the classic Nintendo programming language. Write, run, and debug F-BASIC programs directly in your browser.

## Live Site

GitHub Pages: https://cfvbaibai.github.io/fbasic-ide/

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
| `pnpm vite build` | Vite-only production build (used by GitHub Pages deploy) |
| `pnpm test:run` | Run tests |
| `pnpm lint` | Lint and auto-fix |
| `pnpm type-check` | TypeScript check |
| `pnpm build-web-worker` | Validate Web Worker entrypoint and wiring assumptions |
| `pnpm test-web-worker` | Assert worker import wiring in `WebWorkerManager` |
| `pnpm build-service-worker` | Deprecated alias for `pnpm build-web-worker` |
| `pnpm test-service-worker` | Deprecated alias for `pnpm test-web-worker` |
| `pnpm verify:build-size-budgets` | Enforce initial app-shell JS chunk budget (<= 1.5 MB raw) |

## CI

GitHub Actions CI runs on pushes/PRs to `master` and verifies:

- Parser smoke check
- Script entrypoint verification
- Build unresolved-asset verification
- ESLint + Stylelint + Type check
- Test suite
- Production build

## Deployment

GitHub Pages deployment is automated via `.github/workflows/deploy-pages.yml`:

- Trigger: push to `master` (or manual workflow dispatch)
- Build command: `pnpm vite build`
- Base path: `VITE_BASE_PATH=/fbasic-ide/`
- Publish directory: `dist`
- SPA fallback: `dist/404.html` mirrors `dist/index.html` for refresh-safe routing

## Contributing

1. Fork, branch, code
2. Write tests for new features
3. Run `pnpm exec eslint . && pnpm lint:style && pnpm type-check && pnpm test:run && pnpm build`
4. Submit PR

## License

MIT

## Acknowledgments

- F-BASIC (Family BASIC) language specification
- Vue.js, Vite, and Chevrotain teams
