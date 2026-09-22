import { computed, ref } from 'vue'
import { SpaceResource } from '@opencloud-eu/web-client'
import { Quota, User } from '@opencloud-eu/web-client/graph/generated'
import { useAbility, useClientService } from '@opencloud-eu/web-pkg'
import type { ClientService } from '@opencloud-eu/web-pkg'

const users = ref<User[]>([])
const spaces = ref<SpaceResource[]>([])
const usersLoading = ref(false)
const spacesLoading = ref(false)
const usersLoaded = ref(false)
const spacesLoaded = ref(false)
const usersError = ref(false)
const spacesError = ref(false)

let usersRequest: Promise<void> | undefined
let spacesRequest: Promise<void> | undefined

export const quotaPercentage = (used?: number, total?: number) => {
  if (!total || total <= 0) return 0
  return Math.min(100, Math.round(((used || 0) / total) * 100))
}

export const quotaRatio = (used?: number, total?: number) => {
  if (!total || total <= 0) return 0
  return (used || 0) / total
}

export const isQuotaAtRisk = (state?: string) =>
  state === 'nearing' || state === 'critical' || state === 'exceeded'

export const aggregateQuotas = (quotas: Array<Quota | undefined>) =>
  quotas.reduce(
    (result, quota) => {
      result.totalUsed += quota?.used || 0
      if ((quota?.total || 0) > 0) {
        result.knownQuotaUsed += quota?.used || 0
        result.knownQuotaTotal += quota?.total || 0
      }
      return result
    },
    { totalUsed: 0, knownQuotaUsed: 0, knownQuotaTotal: 0 }
  )

export const loadPreservingPrevious = async <T>(previous: T, loader: () => Promise<T>) => {
  try {
    return { data: await loader(), failed: false }
  } catch {
    return { data: previous, failed: true }
  }
}

const loadUsers = async (clientService: ClientService, force: boolean) => {
  if (usersRequest) return await usersRequest
  if (usersLoaded.value && !usersError.value && !force) return

  usersLoading.value = true
  usersError.value = false
  usersRequest = (async () => {
    const result = await loadPreservingPrevious(users.value, () =>
      clientService.graphAuthenticated.users.listUsers({
        orderBy: ['displayName'],
        expand: ['drive']
      })
    )
    users.value = result.data
    usersError.value = result.failed
    usersLoaded.value ||= !result.failed
    usersLoading.value = false
    usersRequest = undefined
  })()
  return await usersRequest
}

const loadSpaces = async (clientService: ClientService, force: boolean) => {
  if (spacesRequest) return await spacesRequest
  if (spacesLoaded.value && !spacesError.value && !force) return

  spacesLoading.value = true
  spacesError.value = false
  spacesRequest = (async () => {
    const result = await loadPreservingPrevious(spaces.value, () =>
      clientService.graphAuthenticated.drives.listAllDrives({
        orderBy: 'name asc',
        filter: 'driveType eq project'
      })
    )
    spaces.value = result.data
    spacesError.value = result.failed
    spacesLoaded.value ||= !result.failed
    spacesLoading.value = false
    spacesRequest = undefined
  })()
  return await spacesRequest
}

type LoadOptions = {
  users?: boolean
  spaces?: boolean
  force?: boolean
}

export const useAdminData = () => {
  const clientService = useClientService()
  const { can } = useAbility()
  const canReadUsers = computed(() => can('read-all', 'Account'))
  const canReadSpaces = computed(() => can('read-all', 'Drive'))

  if (!canReadUsers.value) {
    users.value = []
    usersLoaded.value = false
  }
  if (!canReadSpaces.value) {
    spaces.value = []
    spacesLoaded.value = false
  }

  const load = async (options: LoadOptions = { users: true, spaces: true }) => {
    const { users: includeUsers = false, spaces: includeSpaces = false, force = false } = options
    const tasks: Promise<void>[] = []

    if (includeUsers && canReadUsers.value) tasks.push(loadUsers(clientService, force))
    if (includeSpaces && canReadSpaces.value) tasks.push(loadSpaces(clientService, force))

    await Promise.allSettled(tasks)
  }

  const quotaTotals = computed(() =>
    aggregateQuotas([
      ...(canReadUsers.value ? users.value.map((user) => user.drive?.quota) : []),
      ...(canReadSpaces.value ? spaces.value.map((space) => space.spaceQuota) : [])
    ])
  )
  const totalUsed = computed(() => quotaTotals.value.totalUsed)
  const knownQuotaUsed = computed(() => quotaTotals.value.knownQuotaUsed)
  const totalQuota = computed(() => quotaTotals.value.knownQuotaTotal)
  const accountsAtRisk = computed(() =>
    canReadUsers.value
      ? users.value.filter((user) => isQuotaAtRisk(user.drive?.quota?.state)).length
      : 0
  )
  const spacesAtRisk = computed(() =>
    canReadSpaces.value
      ? spaces.value.filter((space) => isQuotaAtRisk(space.spaceQuota?.state)).length
      : 0
  )

  return {
    users,
    spaces,
    usersLoading,
    spacesLoading,
    usersError,
    spacesError,
    canReadUsers,
    canReadSpaces,
    totalUsed,
    knownQuotaUsed,
    totalQuota,
    accountsAtRisk,
    spacesAtRisk,
    load
  }
}
