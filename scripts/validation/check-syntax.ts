import { FBasicParser } from '../../src/core/parser/FBasicParser'

async function main(): Promise<void> {
  const parser = new FBasicParser()
  const smokeProgram = ['10 A=1', '20 IF A=1 THEN PRINT "OK"', '30 END'].join('\n')
  const result = await parser.parse(smokeProgram)

  if (!result.success) {
    console.error('[check-syntax] Parser smoke check failed.')
    if (result.errors?.length) {
      for (const error of result.errors) {
        const line = error.location?.start?.line ?? '?'
        const column = error.location?.start?.column ?? '?'
        console.error(`- line ${line}, col ${column}: ${error.message}`)
      }
    }
    process.exit(1)
  }

  console.log('[check-syntax] Parser smoke check passed.')
}

main().catch((error) => {
  console.error('[check-syntax] Unexpected error:', error)
  process.exit(1)
})
