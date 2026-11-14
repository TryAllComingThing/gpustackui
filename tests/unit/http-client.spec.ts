import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/services/auth/session-events', () => ({
  notifyUnauthorized: vi.fn(),
  notifyForbidden: vi.fn(),
}))
vi.mock('../../src/services/auth/request-epoch', () => ({
  currentAuthEpoch: vi.fn(() => 7),
}))

import { notifyForbidden, notifyUnauthorized } from '../../src/services/auth/session-events'
import { createHttpClient } from '../../src/services/http/client'

function response(config: InternalAxiosRequestConfig, status: number): AxiosResponse {
  return { data: { message: 'fixture' }, status, statusText: String(status), headers: {}, config }
}

describe('HTTP session event handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('notifies unauthorized for business 401 with the request epoch', async () => {
    const client = createHttpClient({ baseURL: '' })
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response(config, 401))
    }

    await expect(client.get('/protected-api')).rejects.toBeInstanceOf(AxiosError)
    expect(notifyUnauthorized).toHaveBeenCalledWith(7)
  })

  it('does not globally redirect for credential login, session probe, or logout 401 responses', async () => {
    const client = createHttpClient({ baseURL: '' })
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response(config, 401))
    }

    await expect(client.post('/auth/login')).rejects.toBeInstanceOf(AxiosError)
    await expect(client.get('/users/me')).rejects.toBeInstanceOf(AxiosError)
    await expect(client.post('/auth/logout')).rejects.toBeInstanceOf(AxiosError)
    expect(notifyUnauthorized).not.toHaveBeenCalled()
  })

  it('matches auth endpoints by pathname rather than query-string text', async () => {
    const client = createHttpClient({ baseURL: '' })
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response(config, 401))
    }

    await expect(client.get('/protected-api?next=/auth/login')).rejects.toBeInstanceOf(AxiosError)
    await expect(client.get('/protected-api?return=/users/me')).rejects.toBeInstanceOf(AxiosError)
    expect(notifyUnauthorized).toHaveBeenCalledTimes(2)
  })

  it('recognizes auth endpoints with trailing slashes', async () => {
    const client = createHttpClient({ baseURL: '' })
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response(config, 401))
    }

    await expect(client.post('/auth/login/')).rejects.toBeInstanceOf(AxiosError)
    await expect(client.get('/v2/users/me/')).rejects.toBeInstanceOf(AxiosError)
    await expect(client.post('/auth/logout/')).rejects.toBeInstanceOf(AxiosError)
    expect(notifyUnauthorized).not.toHaveBeenCalled()
  })

  it('leaves logout 403 handling to the auth store and logout UI', async () => {
    const client = createHttpClient({ baseURL: '' })
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, response(config, 403))
    }

    await expect(client.post('/auth/logout')).rejects.toBeInstanceOf(AxiosError)
    expect(notifyForbidden).not.toHaveBeenCalled()
  })

  it('notifies forbidden for business 403 with the request epoch', async () => {
    const client = createHttpClient({ baseURL: '' })
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, response(config, 403))
    }

    await expect(client.get('/protected-api')).rejects.toBeInstanceOf(AxiosError)
    expect(notifyForbidden).toHaveBeenCalledWith(7)
  })
})
