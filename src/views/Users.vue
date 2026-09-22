<template>
  <app-layout
    :title="$gettext('Storage by user')"
    :description="
      $gettext('Compare personal storage consumption and identify accounts near their quota.')
    "
    :loading="loading"
    @refresh="refresh"
  >
    <div class="ext:mb-4 ext:flex ext:justify-end">
      <oc-search-bar
        v-model="searchTerm"
        class="ext:w-full ext:sm:w-80"
        :label="$gettext('Search')"
        :placeholder="$gettext('Search for users')"
        :is-rounded="false"
        is-filter
        button-hidden
      />
    </div>

    <app-loading-spinner v-if="loading && !users.length" />
    <no-content-message
      v-else-if="usersError && !users.length"
      icon="error-warning"
      icon-fill-type="line"
    >
      <template #message><span v-text="$gettext('Unable to load data')" /></template>
    </no-content-message>
    <template v-else>
      <data-load-warning v-if="usersError" />
      <no-content-message v-if="!filteredUsers.length" icon="user" icon-fill-type="line">
        <template #message><span v-text="$gettext('No users found')" /></template>
        <template #callToAction>
          <span v-text="$gettext('Try refining the search term to get results')" />
        </template>
      </no-content-message>
      <oc-table
        v-else
        :fields="fields"
        :data="paginatedUsers"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        :hover="false"
        padding-x="medium"
        @sort="handleSort"
      >
        <template #avatarHeader><span class="ext:sr-only" v-text="$gettext('Avatar')" /></template>
        <template #avatar="{ item }">
          <user-avatar :user-id="item.id" :user-name="item.displayName" :width="32" />
        </template>
        <template #displayName="{ item }">
          <div class="ext:min-w-0">
            <p class="ext:m-0 ext:truncate ext:font-medium" v-text="item.displayName" />
            <p
              class="ext:m-0 ext:truncate ext:text-sm ext:text-role-on-surface-variant"
              v-text="item.mail || item.onPremisesSamAccountName"
            />
          </div>
        </template>
        <template #usage="{ item }">
          <quota-bar
            :quota="item.drive?.quota"
            :label="formatUsage(item.drive?.quota?.used, item.drive?.quota?.total)"
          />
        </template>
        <template #used="{ item }">{{ formatUsed(item.drive?.quota?.used) }}</template>
        <template #total="{ item }">{{ formatTotal(item.drive?.quota?.total) }}</template>
        <template #status="{ item }">
          <span class="ext:inline-flex ext:items-center ext:gap-2">
            <span class="ext:size-2 ext:rounded-full" :class="statusClass(item)" />
            {{ statusLabel(item) }}
          </span>
        </template>
        <template #footer>
          <pagination :pages="totalPages" :current-page="currentPage" />
          <p class="ext:my-2 ext:w-full ext:text-center ext:text-role-on-surface-variant">
            {{ usersTotalLabel }}
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
  usePagination,
  UserAvatar
} from '@opencloud-eu/web-pkg'
import { OcSearchBar, OcTable } from '@opencloud-eu/design-system/components'
import { FieldType, SortDir } from '@opencloud-eu/design-system/helpers'
import { User } from '@opencloud-eu/web-client/graph/generated'
import { computed, onMounted, ref, unref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import AppLayout from '../components/AppLayout.vue'
import DataLoadWarning from '../components/DataLoadWarning.vue'
import QuotaBar from '../components/QuotaBar.vue'
import { useAdminData } from '../composables/useAdminData'

defineOptions({ name: 'BetterAdminUsers' })

const { current: currentLanguage, $gettext, $ngettext } = useGettext()
const { users, usersLoading: loading, usersError, load } = useAdminData()
const route = useRoute()
const router = useRouter()
const searchTerm = ref('')
const sortBy = ref('used')
const sortDir = ref<SortDir>(SortDir.Desc)

const fields = computed<FieldType[]>(() => [
  { name: 'avatar', title: '', type: 'slot', headerType: 'slot', width: 'shrink' },
  {
    name: 'displayName',
    title: $gettext('User'),
    type: 'slot',
    width: 'expand',
    sortable: true
  },
  { name: 'usage', title: $gettext('Quota usage'), type: 'slot', width: 'expand' },
  { name: 'used', title: $gettext('Used'), type: 'slot', width: 'shrink', sortable: true },
  {
    name: 'total',
    title: $gettext('Total quota'),
    type: 'slot',
    width: 'shrink',
    sortable: true
  },
  { name: 'status', title: $gettext('Status'), type: 'slot', width: 'shrink', sortable: true }
])

const filteredUsers = computed(() => {
  const term = unref(searchTerm).trim().toLocaleLowerCase()
  if (!term) return unref(users)
  return unref(users).filter((user) =>
    [user.displayName, user.mail, user.onPremisesSamAccountName]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(term))
  )
})
const usersTotalLabel = computed(() =>
  $ngettext('%{count} user in total', '%{count} users in total', filteredUsers.value.length, {
    count: filteredUsers.value.length.toString()
  })
)

const formatBytes = (bytes: number) => formatFileSize(bytes, currentLanguage)
const formatTotal = (total?: number) =>
  total === 0 ? $gettext('Unrestricted') : total ? formatBytes(total) : '—'
const formatUsed = (used?: number) => (typeof used === 'number' ? formatBytes(used) : '—')
const formatUsage = (used?: number, total?: number) =>
  typeof used === 'number' ? `${formatBytes(used)} / ${formatTotal(total)}` : '—'

type QuotaStatus = 'missing' | 'normal' | 'nearing' | 'critical' | 'exceeded'

const statusKind = (user: User): QuotaStatus => {
  if (!user.drive?.quota) return 'missing'
  const state = user.drive.quota.state
  if (state === 'nearing' || state === 'critical' || state === 'exceeded') return state
  return 'normal'
}
const statusLabel = (user: User) => {
  const labels = {
    missing: $gettext('Not initialized'),
    nearing: $gettext('Warning'),
    critical: $gettext('Critical'),
    exceeded: $gettext('Exceeded'),
    normal: $gettext('Normal')
  }
  return labels[statusKind(user)]
}
const statusClass = (user: User) => {
  const classes = {
    missing: 'ext:bg-role-outline',
    nearing: 'ext:bg-role-error',
    critical: 'ext:bg-role-error',
    exceeded: 'ext:bg-role-error',
    normal: 'ext:bg-role-secondary'
  }
  return classes[statusKind(user)]
}

const statusOrder: Record<QuotaStatus, number> = {
  exceeded: 4,
  critical: 3,
  nearing: 2,
  normal: 1,
  missing: 0
}
const sortedUsers = computed(() =>
  [...filteredUsers.value].sort((left, right) => {
    let result = 0
    if (sortBy.value === 'displayName') {
      result = left.displayName.localeCompare(right.displayName, currentLanguage)
    } else if (sortBy.value === 'status') {
      result = statusOrder[statusKind(left)] - statusOrder[statusKind(right)]
    } else if (sortBy.value === 'total') {
      result = (left.drive?.quota?.total || 0) - (right.drive?.quota?.total || 0)
    } else {
      result = (left.drive?.quota?.used || 0) - (right.drive?.quota?.used || 0)
    }
    return sortDir.value === SortDir.Desc ? -result : result
  })
)
const {
  items: paginatedUsers,
  page: currentPage,
  total: totalPages
} = usePagination({
  items: sortedUsers,
  perPageDefault: '50',
  perPageStoragePrefix: 'betteradmin-users'
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
const refresh = () => load({ users: true, force: true })

watch(searchTerm, resetPagination)
onMounted(() => load({ users: true }))
</script>
