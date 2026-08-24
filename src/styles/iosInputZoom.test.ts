import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const stylesDir = path.dirname(fileURLToPath(import.meta.url))

describe('iOS Safari input zoom guards', () => {
  it('keeps Lumen input text at least 16px via theme tokens', () => {
    const tokens = readFileSync(path.join(stylesDir, 'tokens.css'), 'utf8')
    expect(tokens).toMatch(/--lumen-input-font-size:\s*var\(--text-base\)/)
  })

  it('forces native inputs to stay at least 16px', () => {
    const globalStyles = readFileSync(path.join(stylesDir, 'global.css'), 'utf8')
    expect(globalStyles).toMatch(/font-size:\s*max\(16px,\s*1em\)/)
  })
})
