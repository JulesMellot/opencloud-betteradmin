<template>
  <div class="ext:min-w-36">
    <div class="ext:mb-1 ext:flex ext:items-center ext:justify-between ext:gap-3 ext:text-xs">
      <span class="ext:font-medium" v-text="label" />
      <span class="ext:text-role-on-surface-variant" v-text="percentageLabel" />
    </div>
    <oc-progress
      :value="percentage"
      :max="100"
      size="small"
      :color="progressColor"
      background-color="var(--oc-role-surface)"
      :aria-label="label"
    />
  </div>
</template>

<script setup lang="ts">
import { OcProgress } from '@opencloud-eu/design-system/components'
import { Quota } from '@opencloud-eu/web-client/graph/generated'
import { computed } from 'vue'

const props = defineProps<{ quota?: Quota; label: string }>()

const percentage = computed(() => {
  if (!props.quota?.total || props.quota.total <= 0) return 0
  return Math.min(100, Math.round(((props.quota.used || 0) / props.quota.total) * 100))
})
const percentageLabel = computed(() => (props.quota?.total === 0 ? '∞' : `${percentage.value}%`))
const progressColor = computed(() =>
  props.quota?.state === 'normal' ? 'var(--oc-role-secondary)' : 'var(--oc-role-error)'
)
</script>
