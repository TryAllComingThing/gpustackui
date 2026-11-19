import { describe, expect, it } from 'vitest'
import {
  OrganizationCreateInputSchema,
  OrganizationErrorCodeSchema,
  OrganizationErrorSchema,
  OrganizationListResponseSchema,
  OrganizationMoveInputSchema,
  OrganizationSchema,
  OrganizationStatusInputSchema,
  OrganizationTreeNodeSchema,
  OrganizationTreeResponseSchema,
  OrganizationUpdateInputSchema,
} from '../../src/api/organizations'

const organization = {
  tenant_id: 'tenant_01',
  id: 'org_platform',
  code: 'PLATFORM',
  name: 'Platform Engineering',
  type: 'department',
  status: 'active',
  parent_id: 'org_hq',
  sort_order: 20,
  leader_user_id: null,
  description: 'Platform engineering organization',
  depth: 2,
  version: 3,
  created_at: '2026-11-01T08:00:00Z',
  updated_at: '2026-11-14T08:30:00Z',
  inactive_at: null,
}

describe('organization response contracts', () => {
  it('accepts the documented organization resource', () => {
    expect(OrganizationSchema.safeParse(organization).success).toBe(true)
  })

  it('rejects missing, invalid and out-of-range required fields', () => {
    expect(OrganizationSchema.safeParse({ ...organization, tenant_id: undefined }).success).toBe(false)
    expect(OrganizationSchema.safeParse({ ...organization, status: 'disabled' }).success).toBe(false)
    expect(OrganizationSchema.safeParse({ ...organization, depth: 5 }).success).toBe(false)
    expect(OrganizationSchema.safeParse({ ...organization, version: 0 }).success).toBe(false)
    expect(OrganizationSchema.safeParse({ ...organization, created_at: 'yesterday' }).success).toBe(false)
    expect(OrganizationSchema.safeParse({ ...organization, code: 'X'.repeat(65) }).success).toBe(false)
  })

  it('parses recursive tree nodes without accepting list-shaped nodes', () => {
    const treeNode = {
      ...organization,
      parent_id: null,
      depth: 1,
      children: [
        {
          ...organization,
          id: 'org_child',
          parent_id: 'org_platform',
          depth: 3,
          children: [],
        },
      ],
    }

    expect(OrganizationTreeNodeSchema.safeParse(treeNode).success).toBe(true)
    expect(OrganizationTreeNodeSchema.safeParse(organization).success).toBe(false)
    expect(OrganizationTreeResponseSchema.safeParse({
      items: [treeNode],
      meta: { root_id: null, include_inactive: false, max_depth: 4, truncated: false },
    }).success).toBe(true)
  })

  it('keeps tree and list response envelopes strict', () => {
    const list = {
      items: [organization],
      pagination: { page: 1, per_page: 20, total: 1, total_pages: 1 },
    }

    expect(OrganizationListResponseSchema.safeParse(list).success).toBe(true)
    expect(OrganizationListResponseSchema.safeParse({ ...list, unexpected: true }).success).toBe(false)
    expect(OrganizationTreeResponseSchema.safeParse({ items: [], meta: {} }).success).toBe(false)
  })
})

describe('organization request contracts', () => {
  it('accepts only non-root create input without client tenant context', () => {
    const input = {
      parentId: 'org_hq',
      code: 'PLATFORM',
      name: 'Platform Engineering',
      type: 'department',
      sortOrder: 20,
      leaderUserId: null,
      description: null,
    }

    expect(OrganizationCreateInputSchema.safeParse(input).success).toBe(true)
    expect(OrganizationCreateInputSchema.safeParse({ ...input, tenantId: 'tenant_02' }).success).toBe(false)
    expect(OrganizationCreateInputSchema.safeParse({ ...input, parentId: undefined }).success).toBe(false)
    expect(OrganizationCreateInputSchema.safeParse({ ...input, type: 'division' }).success).toBe(false)
    expect(OrganizationCreateInputSchema.safeParse({ ...input, sortOrder: 1_000_001 }).success).toBe(false)
  })

  it('requires at least one update field and rejects immutable fields', () => {
    expect(OrganizationUpdateInputSchema.safeParse({}).success).toBe(false)
    expect(OrganizationUpdateInputSchema.safeParse({ description: null }).success).toBe(true)
    expect(OrganizationUpdateInputSchema.safeParse({ name: 'Platform' }).success).toBe(true)
    expect(OrganizationUpdateInputSchema.safeParse({ parentId: 'org_other' }).success).toBe(false)
    expect(OrganizationUpdateInputSchema.safeParse({ code: 'RENAMED' }).success).toBe(false)
    expect(OrganizationUpdateInputSchema.safeParse({ status: 'inactive' }).success).toBe(false)
  })

  it('validates move and status payloads independently', () => {
    expect(OrganizationMoveInputSchema.safeParse({ targetParentId: 'org_ops', sortOrder: 10 }).success).toBe(true)
    expect(OrganizationMoveInputSchema.safeParse({ targetParentId: '', sortOrder: 10 }).success).toBe(false)
    expect(OrganizationMoveInputSchema.safeParse({ targetParentId: 'org_ops', sortOrder: 10, tenantId: 'x' }).success).toBe(false)
    expect(OrganizationStatusInputSchema.safeParse({ status: 'inactive', reason: 'Reorganization' }).success).toBe(true)
    expect(OrganizationStatusInputSchema.safeParse({ status: 'deleted' }).success).toBe(false)
    expect(OrganizationStatusInputSchema.safeParse({ status: 'active', reason: 'x'.repeat(501) }).success).toBe(false)
  })
})

describe('organization error contracts', () => {
  it('accepts only known stable business error codes', () => {
    expect(OrganizationErrorCodeSchema.safeParse('ORG_VERSION_CONFLICT').success).toBe(true)
    expect(OrganizationErrorCodeSchema.safeParse('ORG_SOMETHING_NEW').success).toBe(false)
    expect(OrganizationErrorSchema.safeParse({
      code: 'ORG_VERSION_CONFLICT',
      message: 'Organization was modified',
      details: { current_version: 8 },
      request_id: 'req_01',
    }).success).toBe(true)
    expect(OrganizationErrorSchema.safeParse({ code: 'ORG_SOMETHING_NEW', message: '', request_id: 'req_01' }).success).toBe(false)
  })
})
