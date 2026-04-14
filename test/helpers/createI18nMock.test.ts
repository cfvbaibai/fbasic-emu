import { describe, expect, it } from 'vitest'

import { createI18nMock } from './createI18nMock'

describe('createI18nMock', () => {
  it('returns the key when message is not found', () => {
    const t = createI18nMock({})
    expect(t('missing.key')).toEqual('missing.key')
  })

  it('returns the message without params when no params given', () => {
    const t = createI18nMock({ greeting: 'Hello world' })
    expect(t('greeting')).toEqual('Hello world')
  })

  it('replaces a single placeholder', () => {
    const t = createI18nMock({ greeting: 'Hello {name}' })
    expect(t('greeting', { name: 'Alice' })).toEqual('Hello Alice')
  })

  it('replaces all occurrences of a repeated placeholder', () => {
    const t = createI18nMock({
      echo: 'Hello {name} and {name}',
    })
    expect(t('echo', { name: 'Alice' })).toEqual('Hello Alice and Alice')
  })

  it('replaces multiple distinct placeholders', () => {
    const t = createI18nMock({
      intro: 'Hello {name}, you are {age} years old',
    })
    expect(t('intro', { name: 'Bob', age: 30 })).toEqual(
      'Hello Bob, you are 30 years old',
    )
  })

  it('replaces repeated placeholder among multiple distinct ones', () => {
    const t = createI18nMock({
      msg: '{a} and {b} and {a}',
    })
    expect(t('msg', { a: 'X', b: 'Y' })).toEqual('X and Y and X')
  })
})
