import { afterEach, describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { appRoutes } from '../../src/app/router/routes'
import { buildNavItems } from '../../src/app/navigation/nav'

const translate = (key: string) => key
const mutations: RouteRecordRaw[] = []

afterEach(() => {
  for (const route of mutations.splice(0)) {
    const index = appRoutes.indexOf(route)
    if (index >= 0) appRoutes.splice(index, 1)
  }
})

describe('navigation contract', () => {
  it('fails fast when a route references an unknown navigation parent', () => {
    const route: RouteRecordRaw = {
      path: '/invalid-nav-child',
      component: {},
      meta: { nav: { key: 'invalid-nav-child', labelKey: 'nav.dashboard', icon: 'i-lucide-box', parentKey: 'missing-group' } },
    }
    appRoutes.push(route)
    mutations.push(route)
    expect(() => buildNavItems(translate)).toThrow('unknown parentKey')
  })
})
