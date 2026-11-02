import { useEffect, useRef } from 'react'
import SignupDemoForm from './SignupDemoForm.jsx'
import Button from '../../../shared/components/Button.jsx'
import { CloseIcon } from '../../../shared/components/Icons.jsx'

export default function SignupDemoModal({ open, mode, onClose, onSwitch }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (open) {
      // Keep focus in the new form without opening the mobile keyboard automatically.
      const target = window.matchMedia('(max-width: 767px)').matches
        ? '#auth-title'
        : 'input'
      dialog.querySelector(target)?.focus()
    }
  }, [mode, open])

  const isSignup = mode === 'signup'

  function closeDialog() {
    dialogRef.current.close()
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeDialog()
  }

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-title"
      aria-describedby="auth-description"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="auth-panel">
        <Button
          variant="icon"
          className="modal-close"
          aria-label="Close form"
          onClick={closeDialog}
        >
          <CloseIcon />
        </Button>
        <div className="text-center">
          <span className="modal-eyebrow" translate="no">
            APP
          </span>
          <h1 id="auth-title" className="modal-title" tabIndex={-1}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p
            id="auth-description"
            className="mt-2 text-sm leading-6 text-muted"
          >
            {isSignup
              ? 'A fresh start. Make it yours.'
              : 'Log in to pick up where you left off.'}
          </p>
        </div>
        <SignupDemoForm
          key={`${mode}-${open}`}
          mode={mode}
          onSwitch={onSwitch}
        />
        <p className="mt-7 text-center text-xs leading-5 text-muted">
          Interface preview · No account connection yet
        </p>
      </div>
    </dialog>
  )
}
