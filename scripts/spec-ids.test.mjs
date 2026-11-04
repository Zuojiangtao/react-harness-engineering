import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractRequirementIds } from './spec-ids.mjs'

describe('extractRequirementIds', () => {
  it('接受四字母前缀 AUTH', () => {
    expect([...extractRequirementIds('[AUTH-01] [AUTH-02] [AUTH-03]')]).toEqual([
      'AUTH-01',
      'AUTH-02',
      'AUTH-03',
    ])
  })

  it('保留三位前缀并去重', () => {
    expect([...extractRequirementIds('[CUS-01] [CUS-01] [ORD-02]')]).toEqual(['CUS-01', 'ORD-02'])
  })

  it('不把小写或非方括号文本当作需求 ID', () => {
    expect([...extractRequirementIds('[auth-01] AUTH-02 [AUTH-03]')]).toEqual(['AUTH-03'])
  })

  it('当前 auth 规格的三条需求都能被提取', () => {
    const spec = readFileSync(join(process.cwd(), 'openspec/specs/auth/spec.md'), 'utf8')
    expect([...extractRequirementIds(spec)]).toEqual(['AUTH-01', 'AUTH-02', 'AUTH-03'])
  })
})
