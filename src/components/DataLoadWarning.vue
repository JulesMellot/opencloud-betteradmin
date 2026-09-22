<template>
  <div
    role="alert"
    class="ext:mb-4 ext:flex ext:items-center ext:gap-2 ext:rounded-lg ext:bg-role-error-container ext:p-3 ext:text-role-on-error-container"
  >
    <oc-icon name="error-warning" fill-type="line" />
    <span v-text="$gettext('Some data could not be refreshed. Previously loaded data is shown.')" />
  </div>
</template>

<script setup lang="ts">
import { OcIcon } from '@opencloud-eu/design-system/components'
</script>
