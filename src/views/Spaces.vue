<template>
  <app-layout
    :title="$gettext('Storage by space')"
    :description="$gettext('Monitor project spaces and spot capacity problems early.')"
    :loading="loading"
    @refresh="refresh"
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
    <no-content-message
      v-else-if="spacesError && !spaces.length"
      icon="error-warning"
      icon-fill-type="line"
    >
      <template #message><span v-text="$gettext('Unable to load data')" /></template>
    </no-content-message>
    <template v-else>
      <data-load-warning v-if="spacesError" />
      <no-content-message v-if="!filteredSpaces.length" icon="layout-grid" icon-fill-type="line">
        <template #message><span v-text="$gettext('No spaces found')" /></template>
        <template #callToAction>
          <span v-text="$gettext('Try refining the search term to get results')" />
        </template>
      </no-content-message>
      <oc-table
        v-else
        :fields="fields"
        :data="paginatedSpaces"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        :hover="false"
        padding-x="medium"
        @sort="handleSort"
      >
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
        <template #remaining="{ item }">{{ formatRemaining(item.spaceQuota) }}</template>
        <template #total="{ item }">{{ formatTotal(item.spaceQuota?.total) }}</template>
        <template #footer>
          <pagination :pages="totalPages" :current-page="currentPage" />
          <p class="ext:my-2 ext:w-full ext:text-center ext:text-role-on-surface-variant">
            {{ spacesTotalLabel }}
          </p>
        </template>
      </oc-table>
    </template>
  </app-layout>
</template>

<script setup lang="ts">
import {
  AppLoadingSpinner,
  formatFileSize,
  NoContentMessage,
  Pagination,
  useRoute,
  useRouter,
  usePagination
} from '@opencloud-eu/web-pkg'
import { OcIcon, OcSearchBar, OcTable } from '@opencloud-eu/design-system/components'
import { FieldType, SortDir } from '@opencloud-eu/design-system/helpers'
import { Quota } from '@opencloud-eu/web-client/graph/generated'
import { computed, onMounted, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import AppLayout from '../components/AppLayout.vue'
import DataLoadWarning from '../components/DataLoadWarning.vue'
import QuotaBar from '../components/QuotaBar.vue'
import { useAdminData } from '../composables/useAdminData'

defineOptions({ name: 'BetterAdminSpaces' })

const { current: currentLanguage, $gettext, $ngettext } = useGettext()
const { spaces, spacesLoading: loading, spacesError, load } = useAdminData()
const route = useRoute()
const router = useRouter()
const searchTerm = ref('')
const sortBy = ref('used')
const sortDir = ref<SortDir>(SortDir.Desc)

const fields = computed<FieldType[]>(() => [
  { name: 'icon', title: '', type: 'slot', headerType: 'slot', width: 'shrink' },
  { name: 'name', title: $gettext('Space'), type: 'slot', width: 'expand', sortable: true },
  { name: 'usage', title: $gettext('Quota usage'), type: 'slot', width: 'expand' },
  { name: 'used', title: $gettext('Used'), type: 'slot', width: 'shrink', sortable: true },
  {
    name: 'remaining',
    title: $gettext('Remaining'),
    type: 'slot',
    width: 'shrink',
    sortable: true
  },
  {
    name: 'total',
    title: $gettext('Total quota'),
    type: 'slot',
    width: 'shrink',
    sortable: true
  }
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
const spacesTotalLabel = computed(() =>
  $ngettext('%{count} space in total', '%{count} spaces in total', filteredSpaces.value.length, {
    count: filteredSpaces.value.length.toString()
  })
)

const formatBytes = (bytes: number) => formatFileSize(bytes, currentLanguage)
const formatTotal = (total?: number) =>
  total === 0 ? $gettext('Unrestricted') : total ? formatBytes(total) : '—'
const formatRemaining = (quota?: Quota) => {
  if (quota?.total === 0) return $gettext('Unrestricted')
  return typeof quota?.remaining === 'number' ? formatBytes(quota.remaining) : '—'
}
const formatUsage = (used?: number, total?: number) =>
  `${formatBytes(used || 0)} / ${formatTotal(total)}`

const sortedSpaces = computed(() =>
  [...filteredSpaces.value].sort((left, right) => {
    let result = 0
    if (sortBy.value === 'name') {
      result = (left.name || '').localeCompare(right.name || '', currentLanguage)
    } else if (sortBy.value === 'remaining') {
      result = (left.spaceQuota?.remaining || 0) - (right.spaceQuota?.remaining || 0)
    } else if (sortBy.value === 'total') {
      result = (left.spaceQuota?.total || 0) - (right.spaceQuota?.total || 0)
    } else {
      result = (left.spaceQuota?.used || 0) - (right.spaceQuota?.used || 0)
    }
    return sortDir.value === SortDir.Desc ? -result : result
  })
)
const {
  items: paginatedSpaces,
  page: currentPage,
  total: totalPages
} = usePagination({
  items: sortedSpaces,
  perPageDefault: '50',
  perPageStoragePrefix: 'betteradmin-spaces'
})
const handleSort = (sort: { sortBy: string; sortDir: SortDir }) => {
  sortBy.value = sort.sortBy
  sortDir.value = sort.sortDir
  resetPagination()
}
const resetPagination = () => {
  if (route.value.query.page === '1') return
  router.replace({ ...route.value, query: { ...route.value.query, page: '1' } })
}
const refresh = () => load({ spaces: true, force: true })

watch(searchTerm, resetPagination)
onMounted(() => load({ spaces: true }))
</script>
