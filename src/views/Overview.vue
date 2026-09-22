<template>
  <app-layout
    :title="$gettext('BetterAdmin overview')"
    :description="$gettext('A clear view of storage usage across your OpenCloud instance.')"
    :loading="loading"
    @refresh="load"
  >
    <app-loading-spinner v-if="loading && !users.length && !spaces.length" />
    <no-content-message v-else-if="error" icon="error-warning" icon-fill-type="line">
      <template #message><span v-text="$gettext('Unable to load data')" /></template>
      <template #callToAction><span v-text="error" /></template>
    </no-content-message>

    <template v-else>
      <div class="ext:grid ext:grid-cols-1 ext:gap-4 ext:sm:grid-cols-2 ext:xl:grid-cols-4">
        <metric-card
          :label="$gettext('Storage used')"
          :value="formatBytes(totalUsed)"
          icon="database-2"
          :hint="
            totalQuota
              ? $gettext('%{percent}% of known quotas', { percent: globalPercentage })
              : $gettext('No finite quota configured')
          "
        />
        <metric-card
          :label="$gettext('Users')"
          :value="users.length.toString()"
          icon="user"
          :hint="$gettext('%{count} near their quota', { count: accountsAtRisk })"
        />
        <metric-card
          :label="$gettext('Spaces')"
          :value="spaces.length.toString()"
          icon="layout-grid"
          :hint="$gettext('%{count} near their quota', { count: spacesAtRisk })"
        />
        <metric-card
          :label="$gettext('Attention required')"
          :value="(accountsAtRisk + spacesAtRisk).toString()"
          icon="alarm-warning"
          :hint="$gettext('Resources reported near or above quota')"
        />
      </div>

      <section class="ext:mt-6 ext:rounded-xl ext:border ext:border-role-surface-container ext:p-4">
        <div class="ext:mb-4 ext:flex ext:items-center ext:justify-between ext:gap-4">
          <div>
            <h2
              class="ext:m-0 ext:text-lg ext:font-semibold"
              v-text="$gettext('Storage pressure')"
            />
            <p
              class="ext:m-0 ext:mt-1 ext:text-sm ext:text-role-on-surface-variant"
              v-text="$gettext('Users and spaces closest to their configured limit.')"
            />
          </div>
          <oc-icon name="bar-chart-box" fill-type="line" />
        </div>

        <div
          v-if="!atRiskResources.length"
          class="ext:rounded-lg ext:bg-role-surface-container ext:p-4"
        >
          <p
            class="ext:m-0"
            v-text="$gettext('No resource is currently reported near its quota.')"
          />
        </div>

        <div v-else class="ext:grid ext:grid-cols-1 ext:gap-3 ext:lg:grid-cols-2">
          <div
            v-for="resource in atRiskResources"
            :key="resource.id"
            class="ext:rounded-lg ext:bg-role-surface-container ext:p-3"
          >
            <div class="ext:mb-2 ext:flex ext:items-center ext:justify-between ext:gap-3">
              <div class="ext:flex ext:min-w-0 ext:items-center ext:gap-2">
                <oc-icon
                  :name="resource.type === 'user' ? 'user' : 'layout-grid'"
                  fill-type="line"
                />
                <span class="ext:truncate ext:font-medium" v-text="resource.name" />
              </div>
              <span
                class="ext:text-sm ext:text-role-on-surface-variant"
                v-text="formatUsage(resource.used, resource.total)"
              />
            </div>
            <quota-bar :quota="resource.quota" :label="resource.name" />
          </div>
        </div>
      </section>
    </template>
  </app-layout>
</template>

<script setup lang="ts">
import { AppLoadingSpinner, formatFileSize, NoContentMessage } from '@opencloud-eu/web-pkg'
import { OcIcon } from '@opencloud-eu/design-system/components'
import { computed, onMounted, unref } from 'vue'
import { useGettext } from 'vue3-gettext'
import AppLayout from '../components/AppLayout.vue'
import MetricCard from '../components/MetricCard.vue'
import QuotaBar from '../components/QuotaBar.vue'
import { isQuotaAtRisk, quotaPercentage, useAdminData } from '../composables/useAdminData'

defineOptions({ name: 'BetterAdminOverview' })

const { current: currentLanguage, $gettext } = useGettext()
const { users, spaces, loading, error, totalUsed, totalQuota, accountsAtRisk, spacesAtRisk, load } =
  useAdminData()

const formatBytes = (bytes: number) => formatFileSize(bytes, currentLanguage)
const formatUsage = (used: number, total: number) =>
  total > 0
    ? `${formatBytes(used)} / ${formatBytes(total)}`
    : `${formatBytes(used)} / ${$gettext('Unrestricted')}`

const globalPercentage = computed(() => quotaPercentage(unref(totalUsed), unref(totalQuota)))
const atRiskResources = computed(() =>
  [
    ...unref(users)
      .filter((user) => isQuotaAtRisk(user.drive?.quota?.state))
      .map((user) => ({
        id: `user-${user.id}`,
        type: 'user',
        name: user.displayName,
        used: user.drive?.quota?.used || 0,
        total: user.drive?.quota?.total || 0,
        quota: user.drive?.quota
      })),
    ...unref(spaces)
      .filter((space) => isQuotaAtRisk(space.spaceQuota?.state))
      .map((space) => ({
        id: `space-${space.id}`,
        type: 'space',
        name: space.name || $gettext('Unnamed space'),
        used: space.spaceQuota?.used || 0,
        total: space.spaceQuota?.total || 0,
        quota: space.spaceQuota
      }))
  ].sort((a, b) => quotaPercentage(b.used, b.total) - quotaPercentage(a.used, a.total))
)

onMounted(load)
</script>
