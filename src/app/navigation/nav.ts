import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { appRoutes } from '../router/routes'

interface NavGroup {
  key: string
  labelKey: string
  icon: string
  order: number
  defaultOpen?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  { key: 'resources', labelKey: 'nav.resources', icon: 'i-lucide-server', order: 20, defaultOpen: true },
]

type Translate = (key: string) => string

function flattenRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.flatMap((route) => [route, ...(route.children ? flattenRoutes(route.children) : [])])
}

function navRoutes(): RouteRecordRaw[] {
  return flattenRoutes(appRoutes)
    .filter((route) => route.meta?.nav)
    .sort((left, right) => (left.meta?.nav?.order ?? 0) - (right.meta?.nav?.order ?? 0))
}

export function buildNavItems(t: Translate): NavigationMenuItem[] {
  const routes = navRoutes()
  const groupItems = new Map<string, NavigationMenuItem[]>()
  const standalone: NavigationMenuItem[] = []

  for (const route of routes) {
    const nav = route.meta?.nav
    if (!nav || !route.path || route.path.includes(':') || route.redirect) continue

    const item: NavigationMenuItem = {
      value: nav.key,
      label: t(nav.labelKey),
      icon: nav.icon,
      to: route.path,
    }

    if (nav.parentKey) {
      const children = groupItems.get(nav.parentKey) ?? []
      children.push(item)
      groupItems.set(nav.parentKey, children)
    } else {
      standalone.push(item)
    }
  }

  const grouped = NAV_GROUPS
    .map((group) => ({ group, children: groupItems.get(group.key) ?? [] }))
    .filter(({ children }) => children.length > 0)
    .map(({ group, children }) => ({
      value: group.key,
      label: t(group.labelKey),
      type: 'trigger' as const,
      icon: group.icon,
      defaultOpen: group.defaultOpen,
      children,
      order: group.order,
    }))

  return [...standalone, ...grouped]
    .sort((left, right) => {
      const leftOrder = left.value ? routeOrder(left.value) : 0
      const rightOrder = right.value ? routeOrder(right.value) : 0
      return leftOrder - rightOrder
    })
    .map(({ order: _order, ...item }) => item)
}

function routeOrder(key: string): number {
  const route = navRoutes().find((candidate) => candidate.meta?.nav?.key === key)
  if (route) return route.meta?.nav?.order ?? 0
  return NAV_GROUPS.find((group) => group.key === key)?.order ?? 0
}

export function activeNavKey(route: RouteLocationNormalizedLoaded): string {
  return route.meta.nav?.key ?? ''
}

export function openNavKeys(route: RouteLocationNormalizedLoaded): string[] {
  const parentKey = route.meta.nav?.parentKey
  return parentKey ? [parentKey] : []
}
