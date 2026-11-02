import { http, HttpResponse, delay } from 'msw'
import type { Role, User } from '../shared/types/domain.ts'
import type {
  CategoryItem,
  CategoryTypeCode,
} from '../features/categories/api/categoryApi.ts'

const base = 'http://localhost/api/v1'
const key = 'dms-mock-session-v1'

interface MockSessionState {
  userId: string
  refreshUntil: number
  version: number
  accessUntil?: number
}

const accounts: User[] = [
  {
    id: 'admin',
    email: 'admin@demo.test',
    displayName: 'Administrator',
    roles: ['ADMIN'],
    departmentId: null,
  },
  {
    id: 'manager',
    email: 'manager@demo.test',
    displayName: 'Department manager',
    roles: ['MANAGER'],
    departmentId: 'office-a',
  },
  {
    id: 'employee',
    email: 'employee@demo.test',
    displayName: 'Employee A',
    roles: ['EMPLOYEE'],
    departmentId: 'office-a',
  },
  {
    id: 'other',
    email: 'other@demo.test',
    displayName: 'Employee B',
    roles: ['EMPLOYEE'],
    departmentId: 'office-b',
  },
]

const initialCategories: CategoryItem[] = [
  {
    id: 1,
    type: 'DOC_TYPE',
    code: 'QD',
    name: 'Quyết định',
    symbol: 'QĐ',
    isActive: true,
  },
  {
    id: 2,
    type: 'DOC_TYPE',
    code: 'CV',
    name: 'Công văn',
    symbol: 'CV',
    isActive: true,
  },
  {
    id: 3,
    type: 'DOC_TYPE',
    code: 'TB',
    name: 'Thông báo',
    symbol: 'TB',
    isActive: true,
  },
  {
    id: 4,
    type: 'URGENCY',
    code: 'THUONG',
    name: 'Thường',
    symbol: null,
    isActive: true,
  },
  {
    id: 5,
    type: 'URGENCY',
    code: 'KHAN',
    name: 'Khẩn',
    symbol: 'K',
    isActive: true,
  },
  {
    id: 6,
    type: 'URGENCY',
    code: 'HOA_TOC',
    name: 'Hỏa tốc',
    symbol: 'HT',
    isActive: true,
  },
  {
    id: 7,
    type: 'CONFIDENTIALITY',
    code: 'THUONG',
    name: 'Thường',
    symbol: null,
    isActive: true,
  },
  {
    id: 8,
    type: 'CONFIDENTIALITY',
    code: 'MAT',
    name: 'Mật',
    symbol: 'M',
    isActive: true,
  },
  {
    id: 9,
    type: 'POSITION',
    code: 'GIAM_DOC',
    name: 'Giám đốc',
    symbol: 'GĐ',
    isActive: true,
  },
  {
    id: 10,
    type: 'POSITION',
    code: 'TRUONG_PHONG',
    name: 'Trưởng phòng',
    symbol: 'TP',
    isActive: true,
  },
  {
    id: 11,
    type: 'SEND_METHOD',
    code: 'BUU_DIEN',
    name: 'Bưu điện',
    symbol: null,
    isActive: true,
  },
  {
    id: 12,
    type: 'SEND_METHOD',
    code: 'TRUC_TIEP',
    name: 'Trực tiếp',
    symbol: null,
    isActive: true,
  },
]

// Synthetic demo server state only. This is not a real HttpOnly cookie or token store.
function load(): MockSessionState | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as MockSessionState) : null
  } catch {
    return null
  }
}

let state: MockSessionState | null = load()
let passwords: Record<string, string> = {}
let categories: CategoryItem[] = initialCategories.map((c) => ({ ...c }))

function save() {
  if (state) sessionStorage.setItem(key, JSON.stringify(state))
  else sessionStorage.removeItem(key)
}

export function resetMock() {
  state = null
  passwords = {}
  categories = initialCategories.map((c) => ({ ...c }))
  save()
}

const fail = (
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
) =>
  HttpResponse.json(
    { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
    { status },
  )

function token() {
  return state ? `mock-${state.userId}-${state.version}` : ''
}

function userFor(request: Request): User | null {
  return state &&
    (state.accessUntil ?? 0) > Date.now() &&
    request.headers.get('Authorization') === `Bearer ${token()}`
    ? (accounts.find((user) => user.id === state?.userId) ?? null)
    : null
}

function issue() {
  if (!state) return { accessToken: '', expiresIn: 0 }
  state.version++
  state.accessUntil = Date.now() + 300000
  save()
  return { accessToken: token(), expiresIn: 300 }
}

const unauthorized = () =>
  fail(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.')

const forbidden = () =>
  fail(403, 'FORBIDDEN', 'You do not have permission to perform this action.')

function requireRole(request: Request, role: Role): User | Response {
  const user = userFor(request)
  if (!user) return unauthorized()
  if (!user.roles.includes(role)) return forbidden()
  return user
}

export const handlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    await delay(150)
    const { email, password } = (await request.json()) as {
      email?: string
      password?: string
    }
    const user = accounts.find((user) => user.email === email?.trim())
    if (!user || password !== (passwords[user.id] || 'Demo12345!'))
      return fail(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
    state = { userId: user.id, refreshUntil: Date.now() + 28800000, version: 0 }
    return HttpResponse.json({ ...issue(), user })
  }),
  http.get(`${base}/auth/me`, ({ request }) => {
    const user = userFor(request)
    return user ? HttpResponse.json(user) : unauthorized()
  }),
  http.post(`${base}/auth/refresh`, async () => {
    await delay(100)
    if (!state || state.refreshUntil <= Date.now()) return unauthorized()
    return HttpResponse.json(issue())
  }),
  http.post(`${base}/auth/logout`, () => {
    state = null
    save()
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${base}/auth/forgot-password`, async ({ request }) => {
    const { email } = (await request.json()) as { email?: unknown }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return fail(422, 'VALIDATION', 'Enter a valid email address.')
    return HttpResponse.json(
      {
        message:
          'If an account exists for this email, your recovery request will be processed.',
      },
      { status: 202 },
    )
  }),
  http.post(`${base}/auth/change-password`, async ({ request }) => {
    const user = userFor(request)
    if (!user) return unauthorized()
    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword?: unknown
      newPassword?: unknown
    }
    if (currentPassword !== (passwords[user.id] || 'Demo12345!'))
      return fail(
        422,
        'WRONG_PASSWORD',
        'Your current password is incorrect.',
        {
          currentPassword: 'Your current password is incorrect.',
        },
      )
    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      newPassword.length > 128
    )
      return fail(
        422,
        'VALIDATION',
        'Your new password must contain 8–128 characters.',
      )
    passwords[user.id] = newPassword
    state = null
    save()
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(`${base}/demo/documents/:id`, ({ request, params }) => {
    const user = userFor(request)
    if (!user) return unauthorized()
    const documents: Record<
      string,
      { id: string; departmentId: string; assigneeIds: string[] }
    > = {
      a: { id: 'a', departmentId: 'office-a', assigneeIds: ['employee'] },
      b: { id: 'b', departmentId: 'office-b', assigneeIds: ['other'] },
    }
    const docId = String(params.id)
    const document = documents[docId]
    if (!document) return fail(404, 'NOT_FOUND', 'Document not found.')
    const allowed = user.roles.includes('MANAGER')
      ? user.departmentId === document.departmentId
      : user.roles.includes('EMPLOYEE') &&
        document.assigneeIds.includes(user.id)
    return allowed
      ? HttpResponse.json(document)
      : fail(
          403,
          'FORBIDDEN',
          'You do not have permission to view this document.',
        )
  }),
  http.post(`${base}/demo/session`, async ({ request }) => {
    const { scenario } = (await request.json()) as { scenario?: string }
    if (!state) return unauthorized()
    if (scenario === 'access-expired') state.accessUntil = 0
    else if (scenario === 'refresh-expired') {
      state.accessUntil = 0
      state.refreshUntil = 0
    } else return fail(422, 'VALIDATION', 'Invalid demo scenario.')
    save()
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(`${base}/categories/active`, ({ request }) => {
    const user = userFor(request)
    if (!user) return unauthorized()
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const list = categories.filter(
      (c) => c.isActive && (!type || c.type === type),
    )
    return HttpResponse.json(list)
  }),
  http.get(`${base}/categories`, ({ request }) => {
    const check = requireRole(request, 'ADMIN')
    if (check instanceof Response) return check
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const activeOnly = url.searchParams.get('activeOnly') === 'true'
    const list = categories.filter(
      (c) => (!type || c.type === type) && (!activeOnly || c.isActive),
    )
    return HttpResponse.json(list)
  }),
  http.post(`${base}/categories`, async ({ request }) => {
    const check = requireRole(request, 'ADMIN')
    if (check instanceof Response) return check
    const body = (await request.json()) as {
      type?: CategoryTypeCode
      code?: string
      name?: string
      symbol?: string
    }
    const normalizedCode = (body.code || '').trim().toUpperCase()
    const type = body.type || 'DOC_TYPE'
    if (categories.some((c) => c.type === type && c.code === normalizedCode)) {
      return fail(409, 'CONFLICT', 'Mã danh mục đã tồn tại.', {
        code: 'Mã danh mục đã tồn tại trong nhóm này.',
      })
    }
    const nextId =
      categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1
    const created: CategoryItem = {
      id: nextId,
      type,
      code: normalizedCode,
      name: (body.name || '').trim(),
      symbol: body.symbol ? body.symbol.trim() : null,
      isActive: true,
    }
    categories.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put(`${base}/categories/:id`, async ({ request, params }) => {
    const check = requireRole(request, 'ADMIN')
    if (check instanceof Response) return check
    const id = Number(params.id)
    const target = categories.find((c) => c.id === id)
    if (!target) return fail(404, 'NOT_FOUND', 'Category not found.')
    const body = (await request.json()) as {
      type?: CategoryTypeCode
      code?: string
      name?: string
      symbol?: string
    }
    const normalizedCode = (body.code || target.code).trim().toUpperCase()
    const nextType = body.type || target.type
    if (
      categories.some(
        (c) => c.id !== id && c.type === nextType && c.code === normalizedCode,
      )
    ) {
      return fail(409, 'CONFLICT', 'Mã danh mục đã tồn tại.', {
        code: 'Mã danh mục đã tồn tại trong nhóm này.',
      })
    }
    target.type = nextType
    target.code = normalizedCode
    target.name = (body.name ?? target.name).trim()
    target.symbol =
      body.symbol !== undefined ? body.symbol || null : target.symbol
    return HttpResponse.json(target)
  }),
  http.patch(`${base}/categories/:id/deactivate`, ({ request, params }) => {
    const check = requireRole(request, 'ADMIN')
    if (check instanceof Response) return check
    const id = Number(params.id)
    const target = categories.find((c) => c.id === id)
    if (!target) return fail(404, 'NOT_FOUND', 'Category not found.')
    target.isActive = false
    return HttpResponse.json(target)
  }),
]
