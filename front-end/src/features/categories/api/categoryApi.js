import axios from 'axios'
import { session } from '../../../shared/api/http'

// Gọi thẳng vào backend category-service (cổng 8080)
const categoryHttp = axios.create({
  baseURL: import.meta.env.VITE_CATEGORY_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
})

// Đính kèm token ADMIN để Backend xác thực quyền theo MockJwtAuthenticationFilter
categoryHttp.interceptors.request.use((config) => {
  if (session.token?.startsWith('mock-admin')) {
    config.headers.Authorization = 'Bearer ADMIN'
  } else if (session.token?.startsWith('mock-manager')) {
    config.headers.Authorization = 'Bearer MANAGER'
  } else if (session.token?.startsWith('mock-employee')) {
    config.headers.Authorization = 'Bearer EMPLOYEE'
  }
  return config
})

export const CATEGORY_TYPES = {
  DOC_TYPE: 'Loại văn bản',
  URGENCY: 'Độ khẩn',
  CONFIDENTIALITY: 'Độ mật',
  POSITION: 'Chức vụ',
  SEND_METHOD: 'Phương thức gửi',
  FIELD: 'Lĩnh vực',
}

export const categoryApi = {
  // 1. GET /api/categories?type=...&activeOnly=...
  list: (params, signal) =>
    categoryHttp.get('/categories', { params, signal }).then((r) => r.data),

  // 2. GET /api/categories/active?type=...
  listActive: (type, signal) =>
    categoryHttp
      .get('/categories/active', {
        params: type ? { type } : undefined,
        signal,
      })
      .then((r) => r.data),

  // 3. POST /api/categories
  create: (values, signal) =>
    categoryHttp.post('/categories', values, { signal }).then((r) => r.data),

  // 4. PUT /api/categories/:id
  update: (id, values, signal) =>
    categoryHttp.put(`/categories/${id}`, values, { signal }).then((r) => r.data),

  // 5. PATCH /api/categories/:id/deactivate
  deactivate: (id, signal) =>
    categoryHttp
      .patch(`/categories/${id}/deactivate`, null, { signal })
      .then((r) => r.data),
}