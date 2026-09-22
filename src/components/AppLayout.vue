<template>
  <main class="app-content ext:flex ext:size-full ext:rounded-l-xl ext:overflow-hidden">
    <div
      class="ext:relative ext:flex ext:min-w-0 ext:flex-1 ext:flex-col ext:overflow-y-auto ext:bg-role-surface"
    >
      <header
        class="ext:sticky ext:top-0 ext:z-20 ext:flex ext:min-h-16 ext:items-center ext:justify-between ext:gap-4 ext:rounded-t-xl ext:bg-role-surface ext:px-4 ext:py-3"
      >
        <div class="ext:min-w-0">
          <h1 class="ext:m-0 ext:truncate ext:text-xl ext:font-semibold" v-text="title" />
          <p
            v-if="description"
            class="ext:m-0 ext:mt-1 ext:text-sm ext:text-role-on-surface-variant"
            v-text="description"
          />
        </div>
        <oc-button
          v-if="refreshable"
          :aria-label="$gettext('Refresh data')"
          appearance="raw"
          class="ext:shrink-0 ext:p-2"
          :disabled="loading"
          @click="$emit('refresh')"
        >
          <oc-icon name="refresh" fill-type="line" />
          <span class="ext:hidden ext:sm:inline" v-text="$gettext('Refresh')" />
        </oc-button>
      </header>

      <div class="ext:flex-1 ext:p-4">
        <slot />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { OcButton, OcIcon } from '@opencloud-eu/design-system/components'
import { useGettext } from 'vue3-gettext'

withDefaults(
  defineProps<{
    title: string
    description?: string
    loading?: boolean
    refreshable?: boolean
  }>(),
  { description: '', loading: false, refreshable: true }
)

defineEmits<{ refresh: [] }>()
useGettext()
</script>
