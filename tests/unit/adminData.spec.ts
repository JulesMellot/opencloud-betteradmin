import {
  aggregateQuotas,
  attachPersonalDrives,
  isQuotaAtRisk,
  loadPreservingPrevious,
  quotaPercentage,
  quotaRatio
} from '../../src/composables/useAdminData'
import type { SpaceResource } from '@opencloud-eu/web-client'

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

  it('keeps unlimited usage out of the known quota percentage', () => {
    expect(
      aggregateQuotas([
        { used: 10_000, total: 0 },
        { used: 250, total: 1_000 }
      ])
    ).toEqual({ totalUsed: 10_250, knownQuotaUsed: 250, knownQuotaTotal: 1_000 })
  })

  it('keeps over-quota ratios distinguishable for pressure sorting', () => {
    expect(quotaRatio(2_500, 1_000)).toBe(2.5)
    expect(quotaRatio(2_500, 1_000)).toBeGreaterThan(quotaRatio(1_000, 1_000))
  })

  it('preserves previously loaded data when a refresh fails', async () => {
    const previous = [{ id: 'existing' }]
    const result = await loadPreservingPrevious(previous, async () => {
      throw new Error('temporary failure')
    })

    expect(result).toEqual({ data: previous, failed: true })
  })

  it('attaches explicitly listed personal drives to their users', () => {
    const result = attachPersonalDrives(
      [{ id: 'user-1', displayName: 'Ada Lovelace', onPremisesSamAccountName: 'ada' }],
      [
        {
          id: 'drive-1',
          name: 'Ada Lovelace',
          driveType: 'personal',
          owner: { id: 'user-1', displayName: 'Ada Lovelace' },
          spaceQuota: { used: 512, total: 1024, state: 'normal' }
        } as SpaceResource
      ]
    )

    expect(result[0].drive).toMatchObject({
      id: 'drive-1',
      driveType: 'personal',
      quota: { used: 512, total: 1024, state: 'normal' }
    })
  })
})
