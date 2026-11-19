import { describe, expect, it } from 'vitest'
import { organizationFixtures } from '../../src/modules/organizations/fixtures/organizations'
import {
  buildOrganizationTree,
  canChangeOrganizationStatus,
  canMoveOrganization,
  flattenOrganizationNodes,
  flattenOrganizationTree,
  getDescendantIds,
  getOrganizationPath,
  getSubtreeLevels,
} from '../../src/modules/organizations/model'

describe('organization tree model', () => {
  const tree = buildOrganizationTree(organizationFixtures)

  it('builds a stable tree using sort order and created time', () => {
    expect(tree.map((row) => row.organization.id)).toEqual(['org_hq'])
    expect(tree[0]?.children.map((row) => row.organization.id)).toEqual(['org_platform', 'org_operations', 'org_finance'])
    expect(tree[0]?.children[0]?.children.map((row) => row.organization.id)).toEqual(['org_platform_frontend', 'org_platform_infra'])
  })

  it('flattens only expanded branches and exposes tree levels', () => {
    const collapsed = flattenOrganizationTree(tree, { expanded: new Set() })
    expect(collapsed.map((row) => row.organization.id)).toEqual(['org_hq'])
    expect(collapsed[0]).toMatchObject({ level: 1, hasChildren: true, expanded: false })

    const expanded = flattenOrganizationTree(tree, { expanded: new Set(['org_hq', 'org_platform']) })
    expect(expanded.map((row) => [row.organization.id, row.level])).toEqual([
      ['org_hq', 1],
      ['org_platform', 2],
      ['org_platform_frontend', 3],
      ['org_platform_infra', 3],
      ['org_operations', 2],
      ['org_finance', 2],
    ])
  })

  it('keeps matched ancestors for search and filter results', () => {
    const search = flattenOrganizationTree(tree, { expanded: new Set(), search: '前端' })
    expect(search.map((row) => row.organization.id)).toEqual([
      'org_hq',
      'org_platform',
      'org_platform_frontend',
    ])

    const inactive = flattenOrganizationTree(tree, { expanded: new Set(['org_hq']), status: 'inactive' })
    expect(inactive.map((row) => row.organization.id)).toEqual(['org_hq', 'org_finance'])

    const teams = flattenOrganizationTree(tree, { expanded: new Set(['org_hq', 'org_platform', 'org_operations']), type: 'team' })
    expect(teams.map((row) => row.organization.id)).toEqual([
      'org_hq',
      'org_platform',
      'org_platform_frontend',
      'org_platform_infra',
      'org_operations',
      'org_operations_content',
    ])
  })

  it('resolves ancestor paths and descendants', () => {
    expect(getOrganizationPath(organizationFixtures, 'org_platform_frontend').map((organization) => organization.id)).toEqual([
      'org_hq',
      'org_platform',
      'org_platform_frontend',
    ])
    expect([...getDescendantIds(organizationFixtures, 'org_platform')].sort()).toEqual([
      'org_platform_frontend',
      'org_platform_infra',
    ])
    expect(getSubtreeLevels(organizationFixtures, 'org_platform')).toBe(2)
  })

  it('flattens the recursive API tree without losing node fields', () => {
    const [root, platform, frontend] = organizationFixtures
    const nodes = [{
      ...root!,
      children: [{
        ...platform!,
        children: [{ ...frontend!, children: [] }],
      }],
    }]

    expect(flattenOrganizationNodes(nodes).map((organization) => organization.id)).toEqual([
      'org_hq',
      'org_platform',
      'org_platform_frontend',
    ])
    expect(flattenOrganizationNodes(nodes)[2]).not.toHaveProperty('children')
  })
})

describe('organization mutation guards', () => {
  it('blocks root and cyclic moves', () => {
    expect(canMoveOrganization(organizationFixtures, 'org_hq', 'org_platform')).toEqual({ ok: false, reason: 'rootProtected' })
    expect(canMoveOrganization(organizationFixtures, 'org_platform', 'org_platform_frontend')).toEqual({ ok: false, reason: 'cycle' })
    expect(canMoveOrganization(organizationFixtures, 'org_platform', 'org_operations')).toEqual({ ok: true })
  })

  it('blocks inactive targets and moves beyond four levels', () => {
    expect(canMoveOrganization(organizationFixtures, 'org_operations', 'org_finance')).toEqual({ ok: false, reason: 'targetInactive' })

    const deep = [
      ...organizationFixtures,
      {
        ...organizationFixtures[0]!,
        id: 'org_level_2',
        code: 'L2',
        parent_id: 'org_platform_frontend',
        depth: 4,
        sort_order: 10,
      },
    ]
    expect(canMoveOrganization(deep, 'org_platform', 'org_level_2').ok).toBe(false)
  })

  it('protects the root and organizations with active direct children from deactivation', () => {
    expect(canChangeOrganizationStatus(organizationFixtures, 'org_hq', 'inactive')).toEqual({ ok: false, reason: 'rootProtected' })
    expect(canChangeOrganizationStatus(organizationFixtures, 'org_platform', 'inactive')).toEqual({ ok: false, reason: 'activeChildren' })
    expect(canChangeOrganizationStatus(organizationFixtures, 'org_platform_infra', 'inactive')).toEqual({ ok: true })
    expect(canChangeOrganizationStatus(organizationFixtures, 'org_finance', 'active')).toEqual({ ok: true })
  })
})
