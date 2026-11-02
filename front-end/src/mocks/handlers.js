import { http, HttpResponse, delay } from 'msw'

const base = 'http://localhost/api/v1'
const key = 'dms-mock-session-v1'
const accounts = [
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
// Synthetic demo server state only. This is not a real HttpOnly cookie or token store.
function load() {
  try {
    return JSON.parse(sessionStorage.getItem(key))
  } catch {
    return null
  }
}
let state = load()
let passwords = {}
function save() {
  if (state) sessionStorage.setItem(key, JSON.stringify(state))
  else sessionStorage.removeItem(key)
}
export function resetMock() {
  state = null
  passwords = {}
  save()
}
const fail = (status, code, message, fieldErrors) =>
  HttpResponse.json(
    { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
    { status },
  )
function token() {
  return `mock-${state.userId}-${state.version}`
}
function userFor(request) {
  return state &&
    state.accessUntil > Date.now() &&
    request.headers.get('Authorization') === `Bearer ${token()}`
    ? accounts.find((user) => user.id === state.userId)
    : null
}
function issue() {
  state.version++
  state.accessUntil = Date.now() + 300000
  save()
  return { accessToken: token(), expiresIn: 300 }
}
const unauthorized = () =>
  fail(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.')
export const handlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    await delay(150)
    const { email, password } = await request.json()
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
    const { email } = await request.json()
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
    const { currentPassword, newPassword } = await request.json()
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
    const documents = {
      a: { id: 'a', departmentId: 'office-a', assigneeIds: ['employee'] },
      b: { id: 'b', departmentId: 'office-b', assigneeIds: ['other'] },
    }
    const document = documents[params.id]
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
    const { scenario } = await request.json()
    if (!state) return unauthorized()
    if (scenario === 'access-expired') state.accessUntil = 0
    else if (scenario === 'refresh-expired') {
      state.accessUntil = 0
      state.refreshUntil = 0
    } else return fail(422, 'VALIDATION', 'Invalid demo scenario.')
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]
