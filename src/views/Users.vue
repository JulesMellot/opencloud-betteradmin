<template>
  <app-layout
    :title="$gettext('Storage by user')"
    :description="
      $gettext('Compare personal storage consumption and identify accounts near their quota.')
    "
    :loading="loading"
    @refresh="load"
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
    <no-content-message v-else-if="error" icon="error-warning" icon-fill-type="line">
      <template #message><span v-text="$gettext('Unable to load data')" /></template>
      <template #callToAction><span v-text="error" /></template>
    </no-content-message>
    <no-content-message
      v-else-if="!filteredUsers.length"
      img-src="images/empty-states/empty-users.svg"
    >
      <template #message><span v-text="$gettext('No users found')" /></template>
      <template #callToAction>
        <span v-text="$gettext('Try refining the search term to get results')" />
      </template>
    </no-content-message>
    <oc-table v-else :fields="fields" :data="filteredUsers" :hover="true" padding-x="medium">
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
      <template #used="{ item }">{{ formatBytes(item.drive?.quota?.used || 0) }}</template>
      <template #total="{ item }">{{ formatTotal(item.drive?.quota?.total) }}</template>
      <template #status="{ item }">
        <span class="ext:inline-flex ext:items-center ext:gap-2">
          <span class="ext:size-2 ext:rounded-full" :class="statusClass(item)" />
          {{ statusLabel(item) }}
        </span>
      </template>
    </oc-table>
  </app-layout>
</template>

<script setup lang="ts">
import {
  AppLoadingSpinner,
  formatFileSize,
  NoContentMessage,
  UserAvatar
} from '@opencloud-eu/web-pkg'
import { OcSearchBar, OcTable } from '@opencloud-eu/design-system/components'
import { FieldType } from '@opencloud-eu/design-system/helpers'
import { User } from '@opencloud-eu/web-client/graph/generated'
import { computed, onMounted, ref, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import AppLayout from '../components/AppLayout.vue'
import QuotaBar from '../components/QuotaBar.vue'
import { useAdminData } from '../composables/useAdminData'

defineOptions({ name: 'BetterAdminUsers' })

const { current: currentLanguage, $gettext } = useGettext()
const { users, loading, error, load } = useAdminData()
const searchTerm = ref('')

const fields = computed<FieldType[]>(() => [
  { name: 'avatar', title: '', headerType: 'slot', width: 'shrink' },
  { name: 'displayName', title: $gettext('User'), width: 'expand' },
  { name: 'usage', title: $gettext('Quota usage'), width: 'expand' },
  { name: 'used', title: $gettext('Used'), width: 'shrink' },
  { name: 'total', title: $gettext('Total quota'), width: 'shrink' },
  { name: 'status', title: $gettext('Status'), width: 'shrink' }
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

const formatBytes = (bytes: number) => formatFileSize(bytes, currentLanguage)
const formatTotal = (total?: number) =>
  total === 0 ? $gettext('Unrestricted') : total ? formatBytes(total) : '—'
const formatUsage = (used?: number, total?: number) =>
  `${formatBytes(used || 0)} / ${formatTotal(total)}`

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

onMounted(load)
</script>
