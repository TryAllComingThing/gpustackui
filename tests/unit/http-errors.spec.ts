import { describe, expect, it } from 'vitest'
import { toApiError } from '../../src/services/http/errors'
import { GpuResourceSchema } from '../../src/services/schemas/gpu-resource'

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
  })
})

describe('gpu resource response schema', () => {
  it('accepts a valid payload', () => {
    const parsed = GpuResourceSchema.safeParse({ id: 'g1', name: 'g1', model: 'A100', status: '运行中', utilization: '68%' })
    expect(parsed.success).toBe(true)
  })

  it('rejects schema drift', () => {
    const parsed = GpuResourceSchema.safeParse({ id: 'g1', name: 'g1' })
    expect(parsed.success).toBe(false)
  })
})
