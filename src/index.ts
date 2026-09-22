import translations from '../l10n/translations.json'
import {
  ApplicationInformation,
  ClassicApplicationScript,
  defineWebApplication,
  Extension,
  SidebarNavExtension,
  useAbility
} from '@opencloud-eu/web-pkg'
import '@opencloud-eu/extension-sdk/tailwind.css'
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { RouteRecordRaw } from 'vue-router'

const APP_ID = 'betteradmin'

export default defineWebApplication({
  setup() {
    const { can } = useAbility()
    const { $gettext } = useGettext()

    const appInfo: ApplicationInformation = {
      id: APP_ID,
      name: $gettext('BetterAdmin'),
      icon: 'dashboard-3',
      color: '#887ef1'
    }

    const routes: NonNullable<ClassicApplicationScript['routes']> = ({ $ability }) => {
      const guard: RouteRecordRaw['beforeEnter'] = (_to, _from, next) => {
        if (!$ability.can('read-all', 'Account') && !$ability.can('read-all', 'Drive')) {
          return next({ path: '/' })
        }
        next()
      }

      const appRoutes: RouteRecordRaw[] = [
        { path: '/', redirect: `/${APP_ID}/overview` },
        {
          path: '/overview',
          name: 'betteradmin-overview',
          component: () => import('./views/Overview.vue'),
          beforeEnter: guard,
          meta: { authContext: 'user', title: $gettext('Overview') }
        },
        {
          path: '/users',
          name: 'betteradmin-users',
          component: () => import('./views/Users.vue'),
          beforeEnter: guard,
          meta: { authContext: 'user', title: $gettext('Storage by user') }
        },
        {
          path: '/spaces',
          name: 'betteradmin-spaces',
          component: () => import('./views/Spaces.vue'),
          beforeEnter: guard,
          meta: { authContext: 'user', title: $gettext('Storage by space') }
        }
      ]
      return appRoutes
    }

    const navItems: ClassicApplicationScript['navItems'] = [
      {
        name: $gettext('Overview'),
        icon: 'dashboard-3',
        route: { path: `/${APP_ID}/overview` },
        priority: 10
      },
      {
        name: $gettext('Users'),
        icon: 'user',
        route: { path: `/${APP_ID}/users` },
        isVisible: () => can('read-all', 'Account'),
        priority: 20
      },
      {
        name: $gettext('Spaces'),
        icon: 'layout-grid',
        route: { path: `/${APP_ID}/spaces` },
        isVisible: () => can('read-all', 'Drive'),
        priority: 30
      },
      {
        name: $gettext('Back to administration'),
        icon: 'arrow-left-s',
        fillType: 'line',
        route: { path: '/admin-settings' },
        priority: 90
      }
    ]

    const extensions = computed<Extension[]>(() => {
      if (!can('read-all', 'Account') && !can('read-all', 'Drive')) {
        return []
      }

      const adminNavigation: SidebarNavExtension = {
        id: 'com.github.opencloud-eu.web.betteradmin.admin-navigation',
        type: 'sidebarNav',
        extensionPointIds: ['app.admin-settings.navItems'],
        navItem: {
          name: () => $gettext('BetterAdmin'),
          icon: 'dashboard-3',
          route: { path: `/${APP_ID}/overview` },
          priority: 60
        }
      }

      return [adminNavigation]
    })

    return { appInfo, routes, navItems, translations, extensions }
  }
})
