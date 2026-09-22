<template>
  <section class="ext:rounded-xl ext:bg-role-surface-container ext:p-4" :aria-label="label">
    <div class="ext:flex ext:items-start ext:justify-between ext:gap-3">
      <div class="ext:min-w-0">
        <p class="ext:m-0 ext:text-sm ext:text-role-on-surface-variant" v-text="label" />
        <p class="ext:m-0 ext:mt-2 ext:truncate ext:text-2xl ext:font-semibold" v-text="value" />
        <p
          v-if="hint"
          class="ext:m-0 ext:mt-1 ext:text-sm ext:text-role-on-surface-variant"
          v-text="hint"
        />
      </div>
      <span
        class="ext:flex ext:size-10 ext:shrink-0 ext:items-center ext:justify-center ext:rounded-lg ext:bg-role-primary-container"
      >
        <oc-icon :name="icon" fill-type="line" class="ext:text-role-on-primary-container" />
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { OcIcon } from '@opencloud-eu/design-system/components'

defineProps<{ label: string; value: string; icon: string; hint?: string }>()
</script>
