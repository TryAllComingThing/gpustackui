import { describe, expect, it } from 'vitest'
import { toApiError } from '../../src/services/http/errors'
import { GpuDeviceListSchema, GpuDeviceSchema, toGpuDeviceQuery } from '../../src/api/resources/gpu-device'

describe('http error normalization', () => {
  it('maps an unauthorized response to UNAUTHORIZED with the server message', () => {
    const error = { isAxiosError: true, code: 'ERR_BAD_REQUEST', message: 'Request failed', response: { status: 401, data: { message: 'Unauthorized' }, headers: {} } }
    expect(toApiError(error).code).toBe('UNAUTHORIZED')
    expect(toApiError(error).message).toBe('Unauthorized')
  })

  it('maps a network error to NETWORK', () => {
    expect(toApiError({ isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' }).code).toBe('NETWORK')
  })

  it('maps a timeout to TIMEOUT', () => {
    expect(toApiError({ isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' }).code).toBe('TIMEOUT')
    expect(toApiError({ isAxiosError: true, code: 'ERR_BAD_REQUEST', message: 'timeout', response: { status: 408, data: {}, headers: {} } }).code).toBe('TIMEOUT')
    expect(toApiError({ isAxiosError: true, code: 'ERR_BAD_RESPONSE', message: 'gateway timeout', response: { status: 504, data: {}, headers: {} } }).code).toBe('TIMEOUT')
  })

  it('only exposes a string server message and never copies the response body as details', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: { message: { secret: 'do-not-render' }, details: { token: 'sensitive' } },
        headers: {},
      },
    }
    const normalized = toApiError(error)
    expect(normalized.message).toBe('Request failed with status code 400')
    expect(normalized.details).toBeUndefined()
    expect(JSON.stringify(normalized)).not.toContain('sensitive')
  })

  it('maps a rate limit to RATE_LIMIT and preserves Retry-After seconds', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      message: 'Request failed',
      response: { status: 429, data: { message: 'Too many requests' }, headers: { 'retry-after': '120' } },
    }
    const normalized = toApiError(error)
    expect(normalized.code).toBe('RATE_LIMIT')
    expect(normalized.retryAfterSeconds).toBe(120)
  })

  it('keeps conflict responses mapped to CONFLICT', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      message: 'Request failed',
      response: { status: 409, data: { message: 'Conflict' }, headers: {} },
    }
    expect(toApiError(error).code).toBe('CONFLICT')
  })

  it('omits retryAfterSeconds when the rate limit header is absent or invalid', () => {
    const absent = { isAxiosError: true, code: 'ERR_BAD_REQUEST', message: 'Request failed', response: { status: 429, data: {}, headers: {} } }
    const invalid = { isAxiosError: true, code: 'ERR_BAD_REQUEST', message: 'Request failed', response: { status: 429, data: {}, headers: { 'retry-after': 'later' } } }
    expect(toApiError(absent).retryAfterSeconds).toBeUndefined()
    expect(toApiError(invalid).retryAfterSeconds).toBeUndefined()
  })
})

const gpuDevice = {
  id: 'gpu-1',
  worker_id: 1,
  worker_name: 'worker-a',
  worker_ip: '10.0.0.1',
  worker_ifname: 'eth0',
  cluster_id: 1,
  name: 'NVIDIA A100-SXM4-80GB',
  vendor: 'nvidia',
  index: 0,
  core: { total: 100, utilization_rate: 68 },
  memory: { total: 81920, utilization_rate: 42, is_unified_memory: false, used: 34406, allocated: 34406 },
  temperature: 51,
}

describe('gpu device response schema', () => {
  it('accepts the GPUStack gpu-devices payload', () => {
    const parsed = GpuDeviceSchema.safeParse(gpuDevice)
    expect(parsed.success).toBe(true)
  })

  it('rejects schema drift', () => {
    const parsed = GpuDeviceSchema.safeParse({ id: 'gpu-1', name: 'A100' })
    expect(parsed.success).toBe(false)
  })

  it('accepts the paginated list envelope', () => {
    const parsed = GpuDeviceListSchema.safeParse({
      items: [gpuDevice],
      pagination: { page: 1, perPage: 100, total: 1, totalPage: 1 },
    })
    expect(parsed.success).toBe(true)
  })

  it('maps public query names to the GPUStack API contract', () => {
    expect(toGpuDeviceQuery({ page: 2, perPage: 20, search: 'A100', clusterId: 3, sortBy: '-memory.utilization_rate' })).toEqual({
      page: 2,
      perPage: 20,
      search: 'A100',
      cluster_id: 3,
      sort_by: '-memory.utilization_rate',
    })
  })
})
