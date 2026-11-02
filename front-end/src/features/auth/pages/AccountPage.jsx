import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import Button from '../../../shared/components/Button.jsx'
import { authApi } from '../api/authApi.js'
import { useAuth } from '../context/useAuth.js'
import { safeDestination } from '../../../app/router/access.js'

export default function AccountPage({ mode }) {
  const auth = useAuth()
  const location = useLocation()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const busy = useRef(false)
  const formRef = useRef(null)
  const requestRef = useRef(null)
  useEffect(() => () => requestRef.current?.abort(), [])
  const title = {
    login: 'Log in',
    forgot: 'Forgot password',
    change: 'Change password',
  }[mode]
  if (mode === 'login' && auth.status === 'authenticated')
    return (
      <Navigate replace to={safeDestination(location.state?.from, auth.user)} />
    )
  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const next = {}
    for (const input of form.querySelectorAll('input')) {
      if (!input.validity.valid)
        next[input.name] = input.validity.valueMissing
          ? 'This field is required.'
          : 'Enter a valid value.'
    }
    if (mode === 'change' && values.newPassword !== values.confirmPassword)
      next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    setMessage('')
    if (Object.keys(next).length) {
      form.elements[Object.keys(next)[0]].focus()
      return
    }
    busy.current = true
    setPending(true)
    const controller = new AbortController()
    requestRef.current = controller
    try {
      if (mode === 'login') await auth.login(values, controller.signal)
      else if (mode === 'forgot') {
        await authApi.forgot({ email: values.email }, controller.signal)
        setMessage(
          'If an account exists for this email, recovery instructions will be sent. This demo does not send real emails.',
        )
      } else {
        await authApi.change(
          {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
          controller.signal,
        )
        await auth.logout()
      }
      form.reset()
    } catch (error) {
      if (controller.signal.aborted) return
      setErrors(error.response?.data?.fieldErrors || {})
      setMessage(
        error.response?.data?.message || 'Unable to connect. Please try again.',
      )
    } finally {
      busy.current = false
      if (!controller.signal.aborted) setPending(false)
    }
  }
  const fields =
    mode === 'forgot'
      ? [['email', 'Email', 'email']]
      : mode === 'login'
        ? [
            ['email', 'Email', 'email'],
            ['password', 'Password', 'password'],
          ]
        : [
            ['currentPassword', 'Current password', 'password'],
            ['newPassword', 'New password', 'password'],
            ['confirmPassword', 'Confirm password', 'password'],
          ]
  return (
    <section className="account-page" aria-labelledby="account-title">
      <h1 id="account-title" className="mt-3 text-2xl">
        {title}
      </h1>
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="mt-7 flex flex-col gap-5"
      >
        {fields.map(([name, label, type]) => (
          <div key={name}>
            <label className="field-label" htmlFor={name}>
              {label}
            </label>
            <input
              id={name}
              name={name}
              type={type}
              required
              minLength={name === 'newPassword' ? 8 : undefined}
              maxLength={type === 'password' ? 128 : 254}
              autoComplete={
                type === 'email'
                  ? 'email'
                  : name === 'newPassword' || name === 'confirmPassword'
                    ? 'new-password'
                    : 'current-password'
              }
              spellCheck={false}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] ? (
              <p className="field-error" id={`${name}-error`} role="alert">
                {errors[name]}
              </p>
            ) : null}
          </div>
        ))}
        <Button type="submit" disabled={pending}>
          {pending ? 'Processing…' : title}
        </Button>
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      </form>
      {mode === 'login' ? (
        <Link className="text-link" to="/forgot-password">
          Forgot password?
        </Link>
      ) : (
        <Link className="text-link" to="/login">
          Back to log in
        </Link>
      )}
    </section>
  )
}
