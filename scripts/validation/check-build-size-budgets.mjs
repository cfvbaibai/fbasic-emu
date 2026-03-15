import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_DIR = resolve(process.cwd(), 'dist')
const INDEX_HTML = resolve(DIST_DIR, 'index.html')
const INITIAL_JS_BUDGET_BYTES = Number(process.env.INITIAL_JS_BUDGET_BYTES ?? 1_500_000)

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

function getInitialJsAssetPaths(indexHtml) {
  const paths = new Set()
  const pattern = /<(script|link)\b[^>]*(src|href)=["']([^"']+\.js)["'][^>]*>/gi
  let match = pattern.exec(indexHtml)
  while (match) {
    const assetPath = match[3]
    if (assetPath.startsWith('/assets/')) {
      paths.add(assetPath.slice(1))
    }
    match = pattern.exec(indexHtml)
  }
  return [...paths]
}

function main() {
  const indexHtml = readFileSync(INDEX_HTML, 'utf8')
  const initialJsAssets = getInitialJsAssetPaths(indexHtml)

  if (initialJsAssets.length === 0) {
    throw new Error('No initial JS assets found in dist/index.html.')
  }

  let hasViolation = false
  for (const assetPath of initialJsAssets) {
    const fullPath = resolve(DIST_DIR, assetPath.replace(/^assets\//, 'assets/'))
    const size = statSync(fullPath).size
    const withinBudget = size <= INITIAL_JS_BUDGET_BYTES

    // Keep output concise for CI logs.
    console.log(
      `${withinBudget ? 'PASS' : 'FAIL'} ${assetPath} ${formatBytes(size)} (budget ${formatBytes(INITIAL_JS_BUDGET_BYTES)})`
    )

    if (!withinBudget) {
      hasViolation = true
    }
  }

  if (hasViolation) {
    process.exitCode = 1
    return
  }

  console.log('Initial app-shell JS chunk budgets satisfied.')
}

main()
