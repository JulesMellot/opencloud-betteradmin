import { shallowMount } from '@vue/test-utils'
import { OcProgress } from '@opencloud-eu/design-system/components'
import QuotaBar from '../../src/components/QuotaBar.vue'

describe('QuotaBar', () => {
  it('does not render an error-colored progress bar for a missing quota', () => {
    const wrapper = shallowMount(QuotaBar, { props: { label: 'Not initialized' } })

    expect(wrapper.findComponent(OcProgress).exists()).toBe(false)
    expect(wrapper.text()).toContain('—')
  })

  it('uses the OpenCloud quota state for the progress color', () => {
    const wrapper = shallowMount(QuotaBar, {
      props: { label: '10 GB / 20 GB', quota: { used: 10, total: 20, state: 'normal' } }
    })

    expect(wrapper.findComponent(OcProgress).props('color')).toBe('var(--oc-role-secondary)')
  })
})
