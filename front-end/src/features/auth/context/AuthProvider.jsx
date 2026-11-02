import { useEffect, useRef, useState } from 'react'
import { session, refreshSession } from '../../../shared/api/http.js'
import { authApi } from '../api/authApi.js'
import { AuthContext } from './useAuth.js'

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null })
  const bootstrap = useRef(null)
  const revision = useRef(0)
  async function restore() {
    const current = revision.current
    try {
      await refreshSession()
      const user = await authApi.me()
      if (current === revision.current)
        setState({ status: 'authenticated', user })
    } catch (error) {
      if (current === revision.current)
        setState({
          status: error.response?.status === 401 ? 'unauthenticated' : 'error',
          user: null,
        })
    }
  }
  useEffect(() => {
    const unsubscribe = session.subscribe(() => {
      setState({ status: 'unauthenticated', user: null })
    })
    // Share bootstrap across StrictMode's effect replay.
    bootstrap.current ??= restore()
    return unsubscribe
  }, [])
  async function login(values, signal) {
    revision.current++
    session.clear()
    const current = revision.current
    const data = await authApi.login(values, signal)
    if (signal?.aborted || current !== revision.current)
      throw new Error('Session changed')
    session.set(data.accessToken)
    setState({ status: 'authenticated', user: data.user })
  }
  async function logout() {
    revision.current++
    session.clear()
    try {
      await authApi.logout()
    } catch {
      /* Local logout must also work offline. */
    }
  }
  return (
    <AuthContext
      value={{
        ...state,
        login,
        logout,
        retryBootstrap: () => {
          setState({ status: 'loading', user: null })
          return restore()
        },
      }}
    >
      {children}
    </AuthContext>
  )
}
