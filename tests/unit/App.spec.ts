import { isQuotaAtRisk, quotaPercentage } from '../../src/composables/useAdminData'

describe('BetterAdmin quota helpers', () => {
  it('calculates a quota percentage', () => {
    expect(quotaPercentage(75, 100)).toBe(75)
  })

  it('caps quota usage at 100 percent', () => {
    expect(quotaPercentage(150, 100)).toBe(100)
  })

  it('treats unlimited and missing quotas as zero percent', () => {
    expect(quotaPercentage(10, 0)).toBe(0)
    expect(quotaPercentage()).toBe(0)
  })

  it('uses OpenCloud quota states to identify storage pressure', () => {
    expect(isQuotaAtRisk('normal')).toBe(false)
    expect(isQuotaAtRisk('nearing')).toBe(true)
    expect(isQuotaAtRisk('critical')).toBe(true)
    expect(isQuotaAtRisk('exceeded')).toBe(true)
  })
})
