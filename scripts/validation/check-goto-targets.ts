/**
 * Check for GOTO/GOSUB/THEN targeting issues in sample codes
 */

import { SAMPLE_CODES } from '../../src/core/samples/index.js'

interface Issue {
  sample: string
  from: number
  to: number
  type: string
  issue: string
  targetContent?: string
}

const issues: Issue[] = []

for (const [sampleName, sample] of Object.entries(SAMPLE_CODES)) {
  const lines = sample.code.split('\n')
  const lineNumbers = new Map<number, { type: string; content: string }>()

  // First pass: collect all line numbers and mark comments
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(.*)/)
    if (match) {
      const num = parseInt(match[1])
      const content = match[2].trim()
      const isComment = content.startsWith("'") || content.toUpperCase().startsWith('REM')
      lineNumbers.set(num, { type: isComment ? 'comment' : 'executable', content })
    }
  }

  // Second pass: find all GOTO, GOSUB, THEN targets
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(.*)/)
    if (match) {
      const from = parseInt(match[1])
      const content = match[2]

      // Find GOTO n
      const gotoMatch = content.match(/GOTO\s+(\d+)/i)
      if (gotoMatch) {
        const to = parseInt(gotoMatch[1])
        const targetLine = lineNumbers.get(to)
        if (!targetLine) {
          issues.push({ sample: sampleName, from, to, type: 'GOTO', issue: 'LINE_NOT_FOUND' })
        } else if (targetLine.type === 'comment') {
          issues.push({ sample: sampleName, from, to, type: 'GOTO', issue: 'TARGET_IS_COMMENT', targetContent: targetLine.content })
        }
      }

      // Find GOSUB n
      const gosubMatch = content.match(/GOSUB\s+(\d+)/i)
      if (gosubMatch) {
        const to = parseInt(gosubMatch[1])
        const targetLine = lineNumbers.get(to)
        if (!targetLine) {
          issues.push({ sample: sampleName, from, to, type: 'GOSUB', issue: 'LINE_NOT_FOUND' })
        } else if (targetLine.type === 'comment') {
          issues.push({ sample: sampleName, from, to, type: 'GOSUB', issue: 'TARGET_IS_COMMENT', targetContent: targetLine.content })
        }
      }

      // Find IF ... THEN n (when n is a number, not a statement)
      const thenMatch = content.match(/THEN\s+(\d+)(?:\s|$)/i)
      if (thenMatch) {
        const to = parseInt(thenMatch[1])
        const targetLine = lineNumbers.get(to)
        if (!targetLine) {
          issues.push({ sample: sampleName, from, to, type: 'THEN', issue: 'LINE_NOT_FOUND' })
        } else if (targetLine.type === 'comment') {
          issues.push({ sample: sampleName, from, to, type: 'THEN', issue: 'TARGET_IS_COMMENT', targetContent: targetLine.content })
        }
      }
    }
  }
}

// Print results
console.log('\n=== GOTO/GOSUB/THEN Target Check ===\n')

if (issues.length === 0) {
  console.log('✅ No issues found!')
} else {
  console.log(`❌ Found ${issues.length} issues:\n`)

  // Group by sample
  const bySample = new Map<string, Issue[]>()
  for (const issue of issues) {
    if (!bySample.has(issue.sample)) {
      bySample.set(issue.sample, [])
    }
    bySample.get(issue.sample)!.push(issue)
  }

  for (const [sample, sampleIssues] of bySample) {
    console.log(`${sample}:`)
    for (const issue of sampleIssues) {
      const targetInfo = issue.targetContent ? ` (${issue.targetContent.substring(0, 40)}...)` : ''
      console.log(`  Line ${issue.from}: ${issue.type} ${issue.to} -> ${issue.issue}${targetInfo}`)
    }
    console.log()
  }
}

process.exit(issues.length > 0 ? 1 : 0)
