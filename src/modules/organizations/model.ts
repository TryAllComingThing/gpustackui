import type {
  Organization,
  OrganizationStatus,
  OrganizationTreeNode,
  OrganizationType,
} from '../../api/organizations'

export const ORGANIZATION_MAX_DEPTH = 4

export interface OrganizationTreeRow {
  organization: Organization
  children: OrganizationTreeRow[]
}

export interface VisibleOrganizationRow {
  organization: Organization
  level: number
  hasChildren: boolean
  expanded: boolean
}

export interface OrganizationViewOptions {
  expanded: ReadonlySet<string>
  search?: string
  status?: OrganizationStatus | 'all'
  type?: OrganizationType | 'all'
}

export function flattenOrganizationNodes(nodes: readonly OrganizationTreeNode[]): Organization[] {
  return nodes.flatMap((node) => {
    const { children, ...organization } = node
    return [organization, ...flattenOrganizationNodes(children)]
  })
}

export type OrganizationMoveBlockReason =
  | 'notFound'
  | 'rootProtected'
  | 'targetNotFound'
  | 'targetInactive'
  | 'cycle'
  | 'maxDepth'

export type OrganizationStatusBlockReason = 'notFound' | 'rootProtected' | 'activeChildren'

function compareOrganizations(left: Organization, right: Organization): number {
  return left.sort_order - right.sort_order
    || left.created_at.localeCompare(right.created_at)
    || left.id.localeCompare(right.id)
}

export function buildOrganizationTree(organizations: Organization[]): OrganizationTreeRow[] {
  const childrenByParent = new Map<string | null, Organization[]>()
  for (const organization of organizations) {
    const siblings = childrenByParent.get(organization.parent_id) ?? []
    siblings.push(organization)
    childrenByParent.set(organization.parent_id, siblings)
  }

  const build = (parentId: string | null): OrganizationTreeRow[] => (childrenByParent.get(parentId) ?? [])
    .sort(compareOrganizations)
    .map((organization) => ({
      organization,
      children: build(organization.id),
    }))

  return build(null)
}

export function flattenOrganizationTree(
  tree: OrganizationTreeRow[],
  options: OrganizationViewOptions,
): VisibleOrganizationRow[] {
  const search = options.search?.trim().toLowerCase() ?? ''
  const status = options.status ?? 'all'
  const type = options.type ?? 'all'
  const searching = search.length > 0

  function matches(organization: Organization): boolean {
    const matchesSearch = !searching
      || `${organization.name} ${organization.code}`.toLowerCase().includes(search)
    const matchesStatus = status === 'all' || organization.status === status
    const matchesType = type === 'all' || organization.type === type
    return matchesSearch && matchesStatus && matchesType
  }

  function filterRows(rows: OrganizationTreeRow[]): OrganizationTreeRow[] {
    return rows.flatMap((row) => {
      const children = filterRows(row.children)
      if (!matches(row.organization) && children.length === 0) return []
      return [{ organization: row.organization, children }]
    })
  }

  function flatten(rows: OrganizationTreeRow[], level: number): VisibleOrganizationRow[] {
    return rows.flatMap((row) => {
      const expanded = searching || options.expanded.has(row.organization.id)
      const current: VisibleOrganizationRow = {
        organization: row.organization,
        level,
        hasChildren: row.children.length > 0,
        expanded: row.children.length > 0 && expanded,
      }
      return expanded ? [current, ...flatten(row.children, level + 1)] : [current]
    })
  }

  return flatten(filterRows(tree), 1)
}

export function getOrganization(organizations: Organization[], organizationId: string): Organization | undefined {
  return organizations.find((organization) => organization.id === organizationId)
}

export function getOrganizationPath(organizations: Organization[], organizationId: string): Organization[] {
  const byId = new Map(organizations.map((organization) => [organization.id, organization]))
  const path: Organization[] = []
  let current = byId.get(organizationId)
  while (current) {
    path.unshift(current)
    current = current.parent_id ? byId.get(current.parent_id) : undefined
  }
  return path
}

export function getDescendantIds(organizations: Organization[], organizationId: string): Set<string> {
  const descendants = new Set<string>()
  const pending = [organizationId]
  while (pending.length > 0) {
    const parentId = pending.pop()
    for (const organization of organizations) {
      if (organization.parent_id !== parentId || descendants.has(organization.id)) continue
      descendants.add(organization.id)
      pending.push(organization.id)
    }
  }
  return descendants
}

export function getSubtreeLevels(organizations: Organization[], organizationId: string): number {
  const descendants = getDescendantIds(organizations, organizationId)
  const source = getOrganization(organizations, organizationId)
  if (!source) return 0
  return Math.max(
    source.depth,
    ...organizations
      .filter((organization) => organization.id === organizationId || descendants.has(organization.id))
      .map((organization) => organization.depth),
  ) - source.depth + 1
}

export function canMoveOrganization(
  organizations: Organization[],
  organizationId: string,
  targetParentId: string,
): { ok: true } | { ok: false; reason: OrganizationMoveBlockReason } {
  const source = getOrganization(organizations, organizationId)
  if (!source) return { ok: false, reason: 'notFound' }
  if (!source.parent_id) return { ok: false, reason: 'rootProtected' }

  const target = getOrganization(organizations, targetParentId)
  if (!target) return { ok: false, reason: 'targetNotFound' }
  if (target.status !== 'active') return { ok: false, reason: 'targetInactive' }
  if (target.id === source.id || getDescendantIds(organizations, source.id).has(target.id)) {
    return { ok: false, reason: 'cycle' }
  }

  const deepestDepth = target.depth + getSubtreeLevels(organizations, source.id)
  if (deepestDepth > ORGANIZATION_MAX_DEPTH) return { ok: false, reason: 'maxDepth' }
  return { ok: true }
}

export function canChangeOrganizationStatus(
  organizations: Organization[],
  organizationId: string,
  nextStatus: OrganizationStatus,
): { ok: true } | { ok: false; reason: OrganizationStatusBlockReason } {
  const source = getOrganization(organizations, organizationId)
  if (!source) return { ok: false, reason: 'notFound' }
  if (nextStatus === 'active') return { ok: true }
  if (!source.parent_id) return { ok: false, reason: 'rootProtected' }
  if (organizations.some((organization) => organization.parent_id === source.id && organization.status === 'active')) {
    return { ok: false, reason: 'activeChildren' }
  }
  return { ok: true }
}
