import { api, authHttp } from '../../../shared/api/http.js'

export const authApi = {
  login: (values, signal) =>
    authHttp.post('/auth/login', values, { signal }).then((r) => r.data),
  me: () => api.get('/auth/me', { skipRefresh: true }).then((r) => r.data),
  logout: () => authHttp.post('/auth/logout'),
  forgot: (values, signal) =>
    authHttp.post('/auth/forgot-password', values, { signal }),
  change: (values, signal) =>
    api.post('/auth/change-password', values, { signal }),
}
