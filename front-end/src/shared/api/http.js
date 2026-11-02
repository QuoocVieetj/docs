import axios from 'axios'
import { env } from '../../config/env.js'

const listeners = new Set()
let generation = 0
let refreshPromise = null
export const session = {
  token: null,
  set(token) {
    this.token = token
  },
  clear() {
    this.token = null
    generation++
    refreshPromise = null
    listeners.forEach((fn) => fn())
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
export const authHttp = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 10000,
})
export const api = axios.create({ baseURL: env.apiBaseUrl, timeout: 10000 })

export function refreshSession() {
  if (!refreshPromise) {
    const current = generation
    const pending = authHttp
      .post('/auth/refresh')
      .then(({ data }) => {
        if (current !== generation) throw new Error('Session changed')
        session.set(data.accessToken)
        return data.accessToken
      })
      .catch((error) => {
        if (current === generation) session.clear()
        throw error
      })
      .finally(() => {
        if (refreshPromise === pending) refreshPromise = null
      })
    refreshPromise = pending
  }
  return refreshPromise
}
api.interceptors.request.use((config) => {
  config.sessionGeneration ??= generation
  if (session.token) config.headers.Authorization = `Bearer ${session.token}`
  return config
})
api.interceptors.response.use(
  (response) => {
    if (response.config.sessionGeneration !== generation)
      return Promise.reject(new Error('Session changed'))
    return response
  },
  async (error) => {
    const config = error.config
    if (!config || error.response?.status !== 401 || config.skipRefresh)
      throw error
    if (config.sessionGeneration !== generation) throw error
    if (config.retried) {
      session.clear()
      throw error
    }
    config.retried = true
    const sentToken = config.headers.Authorization
    if (!session.token || sentToken === `Bearer ${session.token}`)
      await refreshSession()
    if (config.sessionGeneration !== generation) throw error
    config.headers.Authorization = `Bearer ${session.token}`
    return api(config)
  },
)
