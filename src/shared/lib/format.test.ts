import { describe, expect, it } from 'vitest'
import { formatCents, formatDateTime, maskPhone, yuanToCents } from './format'

describe('金额', () => {
  it('分转元并保留两位小数', () => {
    expect(formatCents(123456)).toContain('1,234.56')
    expect(formatCents(0)).toContain('0.00')
  })

  it('无效值回落为破折号', () => {
    expect(formatCents(undefined)).toBe('—')
    expect(formatCents(Number.NaN)).toBe('—')
  })

  it('元转分四舍五入到整数', () => {
    expect(yuanToCents(1234.56)).toBe(123456)
    expect(yuanToCents('0.1')).toBe(10)
    expect(yuanToCents('')).toBeUndefined()
    expect(yuanToCents('abc')).toBeUndefined()
  })
})

describe('日期与手机号', () => {
  it('无效日期回落为破折号', () => {
    expect(formatDateTime('not-a-date')).toBe('—')
    expect(formatDateTime(null)).toBe('—')
  })

  it('手机号脱敏', () => {
    expect(maskPhone('13800000001')).toBe('138****0001')
    expect(maskPhone('')).toBe('—')
  })
})
