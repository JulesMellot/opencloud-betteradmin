<template>
  <app-layout
    :title="$gettext('Storage by space')"
    :description="$gettext('Monitor project spaces and spot capacity problems early.')"
    :loading="loading"
    @refresh="load"
  >
    <div class="ext:mb-4 ext:flex ext:justify-end">
      <oc-search-bar
        v-model="searchTerm"
        class="ext:w-full ext:sm:w-80"
        :label="$gettext('Search')"
        :placeholder="$gettext('Search for spaces')"
        :is-rounded="false"
        is-filter
        button-hidden
      />
    </div>

    <app-loading-spinner v-if="loading && !spaces.length" />
    <no-content-message v-else-if="error" icon="error-warning" icon-fill-type="line">
      <template #message><span v-text="$gettext('Unable to load data')" /></template>
      <template #callToAction><span v-text="error" /></template>
    </no-content-message>
    <no-content-message
      v-else-if="!filteredSpaces.length"
      img-src="images/empty-states/empty-spaces.svg"
    >
      <template #message><span v-text="$gettext('No spaces found')" /></template>
      <template #callToAction>
        <span v-text="$gettext('Try refining the search term to get results')" />
      </template>
    </no-content-message>
    <oc-table v-else :fields="fields" :data="filteredSpaces" :hover="true" padding-x="medium">
      <template #iconHeader><span class="ext:sr-only" v-text="$gettext('Icon')" /></template>
      <template #icon><oc-icon name="layout-grid" fill-type="line" /></template>
      <template #name="{ item }">
        <div class="ext:min-w-0">
          <p class="ext:m-0 ext:truncate ext:font-medium" v-text="item.name" />
          <p
            class="ext:m-0 ext:truncate ext:text-sm ext:text-role-on-surface-variant"
            v-text="item.description"
          />
        </div>
      </template>
      <template #usage="{ item }">
        <quota-bar
          :quota="item.spaceQuota"
          :label="formatUsage(item.spaceQuota?.used, item.spaceQuota?.total)"
        />
      </template>
      <template #used="{ item }">{{ formatBytes(item.spaceQuota?.used || 0) }}</template>
      <template #remaining="{ item }">{{ formatRemaining(item.spaceQuota?.remaining) }}</template>
      <template #total="{ item }">{{ formatTotal(item.spaceQuota?.total) }}</template>
    </oc-table>
  </app-layout>
</template>

<script setup lang="ts">
import { AppLoadingSpinner, formatFileSize, NoContentMessage } from '@opencloud-eu/web-pkg'
import { OcIcon, OcSearchBar, OcTable } from '@opencloud-eu/design-system/components'
import { FieldType } from '@opencloud-eu/design-system/helpers'
import { computed, onMounted, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import AppLayout from '../components/AppLayout.vue'
import QuotaBar from '../components/QuotaBar.vue'
import { useAdminData } from '../composables/useAdminData'

defineOptions({ name: 'BetterAdminSpaces' })

const { current: currentLanguage, $gettext } = useGettext()
const { spaces, loading, error, load } = useAdminData()
const searchTerm = ref('')

const fields = computed<FieldType[]>(() => [
  { name: 'icon', title: '', headerType: 'slot', width: 'shrink' },
  { name: 'name', title: $gettext('Space'), width: 'expand' },
  { name: 'usage', title: $gettext('Quota usage'), width: 'expand' },
  { name: 'used', title: $gettext('Used'), width: 'shrink' },
  { name: 'remaining', title: $gettext('Remaining'), width: 'shrink' },
  { name: 'total', title: $gettext('Total quota'), width: 'shrink' }
])

const filteredSpaces = computed(() => {
  const term = unref(searchTerm).trim().toLocaleLowerCase()
  if (!term) return unref(spaces)
  return unref(spaces).filter((space) =>
    [space.name, space.description]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(term))
  )
})

const formatBytes = (bytes: number) => formatFileSize(bytes, currentLanguage)
const formatTotal = (total?: number) =>
  total === 0 ? $gettext('Unrestricted') : total ? formatBytes(total) : '—'
const formatRemaining = (remaining?: number) =>
  typeof remaining === 'number' ? formatBytes(remaining) : '—'
const formatUsage = (used?: number, total?: number) =>
  `${formatBytes(used || 0)} / ${formatTotal(total)}`

onMounted(load)
</script>
