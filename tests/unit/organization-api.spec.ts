import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/services/http', () => ({
  requestValidated: vi.fn(),
}))

import { requestValidated } from '../../src/services/http'
import {
  changeOrganizationStatus,
  createOrganization,
  getOrganization,
  getOrganizationTree,
  listOrganizations,
  moveOrganization,
  ORGANIZATIONS_PATH,
  ORGANIZATIONS_TREE_PATH,
  OrganizationListResponseSchema,
  OrganizationSchema,
  OrganizationTreeResponseSchema,
  updateOrganization,
} from '../../src/api/organizations'

const organization = {
  tenant_id: 'tenant_01',
  id: 'org_platform',
  code: 'PLATFORM',
  name: 'Platform Engineering',
  type: 'department' as const,
  status: 'active' as const,
  parent_id: 'org_hq',
  sort_order: 20,
  leader_user_id: null,
  description: null,
  depth: 2,
  version: 3,
  created_at: '2026-11-01T08:00:00Z',
  updated_at: '2026-11-14T08:30:00Z',
  inactive_at: null,
}

describe('organization API transport contract', () => {
  beforeEach(() => {
    vi.mocked(requestValidated).mockReset().mockResolvedValue({ ok: true, data: organization })
  })

  it('loads the authorized tree with the documented query names', async () => {
    const controller = new AbortController()
    vi.mocked(requestValidated).mockResolvedValue({
      ok: true,
      data: {
        items: [{ ...organization, children: [] }],
        meta: { root_id: 'org_hq', include_inactive: false, max_depth: 3, truncated: false },
      },
    })

    await expect(getOrganizationTree({
      rootId: 'org_hq',
      includeInactive: false,
      maxDepth: 3,
      keyword: 'Platform',
    }, { signal: controller.signal })).resolves.toEqual(expect.objectContaining({ ok: true }))
    expect(requestValidated).toHaveBeenCalledWith(
      {
        method: 'GET',
        url: ORGANIZATIONS_TREE_PATH,
        params: {
          root_id: 'org_hq',
          include_inactive: false,
          max_depth: 3,
          keyword: 'Platform',
        },
        signal: controller.signal,
      },
      OrganizationTreeResponseSchema,
    )
  })

  it('loads a paginated list without sending tenant or scope parameters', async () => {
    vi.mocked(requestValidated).mockResolvedValue({
      ok: true,
      data: { items: [organization], pagination: { page: 1, per_page: 20, total: 1, total_pages: 1 } },
    })

    await listOrganizations({
      page: 2,
      perPage: 50,
      search: 'Platform',
      parentId: 'org_hq',
      status: 'active',
      type: 'department',
      sortBy: 'sort_order',
      sortOrder: 'desc',
    })

    expect(requestValidated).toHaveBeenCalledWith(
      {
        method: 'GET',
        url: ORGANIZATIONS_PATH,
        params: {
          page: 2,
          per_page: 50,
          search: 'Platform',
          parent_id: 'org_hq',
          status: 'active',
          type: 'department',
          sort_by: 'sort_order',
          sort_order: 'desc',
        },
      },
      OrganizationListResponseSchema,
    )
    const config = vi.mocked(requestValidated).mock.calls[0]?.[0]
    expect(config?.params).not.toHaveProperty('tenant_id')
    expect(config?.params).not.toHaveProperty('scope')
  })

  it('encodes an opaque organization ID in the detail path', async () => {
    await getOrganization('org/01')
    expect(requestValidated).toHaveBeenCalledWith(
      { method: 'GET', url: '/organizations/org%2F01' },
      OrganizationSchema,
    )
  })

  it('creates an organization with Idempotency-Key and a non-root payload', async () => {
    await createOrganization(
      {
        parentId: 'org_hq',
        code: 'PLATFORM',
        name: 'Platform Engineering',
        type: 'department',
        sortOrder: 20,
        leaderUserId: null,
      },
      { idempotencyKey: 'idem-create-01' },
    )

    expect(requestValidated).toHaveBeenCalledWith(
      {
        method: 'POST',
        url: ORGANIZATIONS_PATH,
        data: {
          parent_id: 'org_hq',
          code: 'PLATFORM',
          name: 'Platform Engineering',
          type: 'department',
          sort_order: 20,
          leader_user_id: null,
        },
        headers: { 'Idempotency-Key': 'idem-create-01' },
      },
      OrganizationSchema,
    )
    const data = vi.mocked(requestValidated).mock.calls[0]?.[0].data
    expect(data).not.toHaveProperty('tenant_id')
  })

  it('updates an organization with a quoted If-Match version', async () => {
    await updateOrganization('org_platform', { name: 'Platform and Infrastructure', sortOrder: 15 }, { version: 3 })

    expect(requestValidated).toHaveBeenCalledWith(
      {
        method: 'PATCH',
        url: '/organizations/org_platform',
        data: { name: 'Platform and Infrastructure', sort_order: 15 },
        headers: { 'If-Match': '"3"' },
      },
      OrganizationSchema,
    )
  })

  it('moves an organization with both idempotency and version preconditions', async () => {
    await moveOrganization(
      'org_platform',
      { targetParentId: 'org_operations', sortOrder: 10 },
      { version: 4, idempotencyKey: 'idem-move-0001' },
    )

    expect(requestValidated).toHaveBeenCalledWith(
      {
        method: 'POST',
        url: '/organizations/org_platform/move',
        data: { target_parent_id: 'org_operations', sort_order: 10 },
        headers: { 'Idempotency-Key': 'idem-move-0001', 'If-Match': '"4"' },
      },
      OrganizationSchema,
    )
  })

  it('changes status without inventing delete or cascade semantics', async () => {
    await changeOrganizationStatus(
      'org_platform',
      { status: 'inactive', reason: 'Organization restructuring' },
      { version: 5, idempotencyKey: 'idem-status-01' },
    )

    expect(requestValidated).toHaveBeenCalledWith(
      {
        method: 'POST',
        url: '/organizations/org_platform/status',
        data: { status: 'inactive', reason: 'Organization restructuring' },
        headers: { 'Idempotency-Key': 'idem-status-01', 'If-Match': '"5"' },
      },
      OrganizationSchema,
    )
  })

  it('fails closed on invalid IDs, versions, headers and query values before sending', async () => {
    await expect(getOrganization('')).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(getOrganizationTree({ maxDepth: 5 as 1 })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(listOrganizations({ perPage: 101 })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(updateOrganization('org_platform', { name: 'Platform' }, { version: 0 })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(createOrganization(
      { parentId: 'org_hq', code: 'PLATFORM', name: 'Platform', type: 'department', sortOrder: 1 },
      { idempotencyKey: 'short' },
    )).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    expect(requestValidated).not.toHaveBeenCalled()
  })

  it('rejects client tenant switching and immutable fields before transport', async () => {
    await expect(createOrganization(
      {
        parentId: 'org_hq',
        code: 'PLATFORM',
        name: 'Platform',
        type: 'department',
        sortOrder: 1,
        tenantId: 'tenant_02',
      } as never,
      { idempotencyKey: 'idem-create-02' },
    )).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    await expect(updateOrganization('org_platform', { status: 'inactive' } as never, { version: 1 })).resolves.toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION' }),
    }))
    expect(requestValidated).not.toHaveBeenCalled()
  })
})
