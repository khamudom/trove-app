import { describe, expect, it } from 'vitest'
import { extractTroveBinPath } from './qrScan'

describe('extractTroveBinPath', () => {
  it('extracts the bin path from a full Trove QR URL', () => {
    expect(extractTroveBinPath('https://trove.app/b/abc123def')).toBe('/b/abc123def')
  })

  it('extracts the bin path from a path-only payload', () => {
    expect(extractTroveBinPath('/b/deadbeef01')).toBe('/b/deadbeef01')
  })

  it('returns null for unrelated QR payloads', () => {
    expect(extractTroveBinPath('https://example.com/other')).toBeNull()
    expect(extractTroveBinPath('not a url')).toBeNull()
    expect(extractTroveBinPath('')).toBeNull()
  })
})
