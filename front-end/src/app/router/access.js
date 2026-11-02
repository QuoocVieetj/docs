const staff = ['MANAGER', 'EMPLOYEE']
export const routes = [
  { path: '/dashboard', label: 'Overview', roles: ['ADMIN', ...staff] },
  {
    path: '/documents/incoming',
    label: 'Incoming correspondence',
    roles: staff,
  },
  {
    path: '/documents/outgoing',
    label: 'Outgoing correspondence',
    roles: staff,
  },
  { path: '/records', label: 'Records', roles: staff },
  { path: '/tasks', label: 'My tasks', roles: staff },
  { path: '/approvals', label: 'Pending approvals', roles: ['MANAGER'] },
  { path: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { path: '/admin/departments', label: 'Departments', roles: ['ADMIN'] },
  { path: '/admin/categories', label: 'Categories', roles: ['ADMIN'] },
  {
    path: '/change-password',
    label: 'Change password',
    roles: ['ADMIN', ...staff],
  },
]
export const canAccess = (user, roles) =>
  Boolean(user?.roles?.some((role) => roles.includes(role)))
export function safeDestination(value, user) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return '/dashboard'
  const route = routes.find((route) => route.path === value.split(/[?#]/)[0])
  return route && canAccess(user, route.roles) ? value : '/dashboard'
}
