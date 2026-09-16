import { describe, expect, it } from 'vitest'
import {
  defaultImportKind,
  defaultImportMethod,
  importMethodsFor,
  importSurfaceFor,
  importTypeFor,
  oauthFlavorFor,
  resolveImportMethod,
} from '@/lib/cred-type'

describe('setup-token import defaults', () => {
  it('defaults the panel to Setup Token + Cookie', () => {
    expect(defaultImportKind()).toBe('setup-token')
    expect(defaultImportMethod('setup-token')).toBe('session')
    expect(importTypeFor('setup-token')).toBe('setup-token')
    expect(oauthFlavorFor('setup-token', 'link')).toBe('setup_token')
  })

  it('offers Cookie and auth-link for setup-token, not Claude Code', () => {
    expect(importMethodsFor('setup-token').map((m) => m.id)).toEqual([
      'session',
      'link',
    ])
    expect(resolveImportMethod('setup-token', 'cc')).toBe('session')
    expect(resolveImportMethod('setup-token', 'link')).toBe('link')
  })

  it('keeps OAuth Cookie / link / Claude Code as a secondary kind', () => {
    expect(importMethodsFor('oauth').map((m) => m.id)).toEqual([
      'session',
      'link',
      'cc',
    ])
    expect(importTypeFor('oauth')).toBe('')
    expect(oauthFlavorFor('oauth', 'cc')).toBe('claude_code')
  })

  it('routes OpenAI slots to Codex import, not Setup Token / Console', () => {
    expect(
      importSurfaceFor({
        id: 'vm-codex-01',
        platform: 'openai',
        family: 'codex',
      })
    ).toBe('codex')
    expect(
      importSurfaceFor({ id: 'vm-01', platform: 'anthropic', family: 'claude' })
    ).toBe('claude')
  })
})
