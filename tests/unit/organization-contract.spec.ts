import { describe, expect, it } from 'vitest'
import {
  ORGANIZATION_CONTRACT_STATUS,
  toOrganizationCreateRequest,
  toOrganizationListQuery,
  toOrganizationMoveRequest,
  toOrganizationStatusRequest,
  toOrganizationTreeQuery,
  toOrganizationUpdateRequest,
} from '../../src/api/organizations'
import { toApiError } from '../../src/services/http/errors'

describe('organization wire mapping', () => {
  it('exposes the draft provenance until the backend contract is reconciled', () => {
    expect(ORGANIZATION_CONTRACT_STATUS).toBe('DRAFT_FOR_BACKEND_RECONCILIATION')
  })

  it('maps camelCase inputs to the documented wire field names', () => {
    expect(toOrganizationCreateRequest({
      parentId: 'org_hq',
      code: 'PLATFORM',
      name: 'Platform',
      type: 'department',
      sortOrder: 20,
      leaderUserId: null,
      description: null,
    })).toEqual({
      parent_id: 'org_hq',
      code: 'PLATFORM',
      name: 'Platform',
      type: 'department',
      sort_order: 20,
      leader_user_id: null,
      description: null,
    })
    expect(toOrganizationUpdateRequest({ sortOrder: 15, leaderUserId: null })).toEqual({
      sort_order: 15,
      leader_user_id: null,
    })
    expect(toOrganizationMoveRequest({ targetParentId: 'org_ops', sortOrder: 10 })).toEqual({
      target_parent_id: 'org_ops',
      sort_order: 10,
    })
    expect(toOrganizationStatusRequest({ status: 'inactive', reason: 'Reorganization' })).toEqual({
      status: 'inactive',
      reason: 'Reorganization',
    })
    expect(toOrganizationTreeQuery({ rootId: 'org_root', includeInactive: true, maxDepth: 2, keyword: 'HQ' })).toEqual({
      root_id: 'org_root',
      include_inactive: true,
      max_depth: 2,
      keyword: 'HQ',
    })
    expect(toOrganizationListQuery({ page: 2, perPage: 50, parentId: 'org_hq', status: 'active', type: 'team' })).toEqual({
      page: 2,
      per_page: 50,
      parent_id: 'org_hq',
      status: 'active',
      type: 'team',
    })
  })

  it('omits optional values instead of sending undefined properties', () => {
    expect(toOrganizationCreateRequest({
      parentId: 'org_hq',
      code: 'PLATFORM',
      name: 'Platform',
      type: 'department',
      sortOrder: 20,
    })).toEqual({
      parent_id: 'org_hq',
      code: 'PLATFORM',
      name: 'Platform',
      type: 'department',
      sort_order: 20,
    })
    expect(toOrganizationTreeQuery({})).toEqual({})
    expect(toOrganizationListQuery({})).toEqual({})
  })
})

describe('organization HTTP error contract', () => {
  it('maps stale and missing preconditions to distinct stable categories', () => {
    const stale = { isAxiosError: true, code: 'ERR_BAD_REQUEST', message: 'Request failed', response: { status: 412, data: {}, headers: {} } }
    const missing = { isAxiosError: true, code: 'ERR_BAD_REQUEST', message: 'Request failed', response: { status: 428, data: {}, headers: {} } }

    expect(toApiError(stale).code).toBe('PRECONDITION_FAILED')
    expect(toApiError(missing).code).toBe('PRECONDITION_REQUIRED')
  })

  it('exposes a bounded server business code and trace ID without exposing details', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      message: 'Request failed',
      response: {
        status: 409,
        data: {
          code: 'ORG_CODE_CONFLICT',
          message: 'Organization code already exists',
          details: { internal_token: 'must-not-leak' },
          request_id: 'req_body_01',
        },
        headers: {},
      },
    }

    const normalized = toApiError(error)
    expect(normalized).toEqual(expect.objectContaining({
      code: 'CONFLICT',
      serverCode: 'ORG_CODE_CONFLICT',
      requestId: 'req_body_01',
    }))
    expect(JSON.stringify(normalized)).not.toContain('must-not-leak')
  })

  it('does not expose malformed or unbounded server codes', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      message: 'Request failed',
      response: {
        status: 409,
        data: { code: 'secret value with spaces', message: 'Conflict', request_id: 'req_01' },
        headers: {},
      },
    }

    expect(toApiError(error).serverCode).toBeUndefined()
  })
})
