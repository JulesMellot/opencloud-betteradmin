import { computed, ref } from 'vue'
import { SpaceResource } from '@opencloud-eu/web-client'
import { User } from '@opencloud-eu/web-client/graph/generated'
import { useClientService } from '@opencloud-eu/web-pkg'

export const quotaPercentage = (used?: number, total?: number) => {
  if (!total || total <= 0) return 0
  return Math.min(100, Math.round(((used || 0) / total) * 100))
}

export const isQuotaAtRisk = (state?: string) =>
  state === 'nearing' || state === 'critical' || state === 'exceeded'

export const useAdminData = () => {
  const clientService = useClientService()
  const users = ref<User[]>([])
  const spaces = ref<SpaceResource[]>([])
  const loading = ref(false)
  const error = ref('')

  const load = async () => {
    loading.value = true
    error.value = ''
    try {
      const [loadedUsers, loadedSpaces] = await Promise.all([
        clientService.graphAuthenticated.users.listUsers({
          orderBy: ['displayName'],
          expand: ['drive']
        }),
        clientService.graphAuthenticated.drives.listAllDrives({
          orderBy: 'name asc',
          filter: 'driveType eq project'
        })
      ])
      users.value = loadedUsers
      spaces.value = loadedSpaces
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
    } finally {
      loading.value = false
    }
  }

  const totalUsed = computed(
    () =>
      users.value.reduce((sum, user) => sum + (user.drive?.quota?.used || 0), 0) +
      spaces.value.reduce((sum, space) => sum + (space.spaceQuota?.used || 0), 0)
  )
  const totalQuota = computed(
    () =>
      users.value.reduce((sum, user) => sum + (user.drive?.quota?.total || 0), 0) +
      spaces.value.reduce((sum, space) => sum + (space.spaceQuota?.total || 0), 0)
  )
  const accountsAtRisk = computed(
    () => users.value.filter((user) => isQuotaAtRisk(user.drive?.quota?.state)).length
  )
  const spacesAtRisk = computed(
    () => spaces.value.filter((space) => isQuotaAtRisk(space.spaceQuota?.state)).length
  )

  return {
    users,
    spaces,
    loading,
    error,
    totalUsed,
    totalQuota,
    accountsAtRisk,
    spacesAtRisk,
    load
  }
}
