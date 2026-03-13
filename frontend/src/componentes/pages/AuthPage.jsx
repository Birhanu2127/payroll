function AuthPage({
  authMode,
  authForm,
  authError,
  authLoading,
  onSubmit,
  onInput,
  onToggleMode,
}) {
  const isRegister = authMode === 'register'

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Payroll Access</h1>
        <p className="auth-subtitle">Sign in or register as Superadmin/HR to continue.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          {isRegister ? (
            <label>
              Full Name
              <input type="text" name="name" value={authForm.name} onChange={onInput} required />
            </label>
          ) : null}

          <label>
            Email
            <input type="email" name="email" value={authForm.email} onChange={onInput} required />
          </label>

          {isRegister ? (
            <label>
              Role
              <select name="role" value={authForm.role} onChange={onInput}>
                <option value="hr">HR</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </label>
          ) : null}

          <label>
            Password
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={onInput}
              required
            />
          </label>

          {isRegister ? (
            <label>
              Confirm Password
              <input
                type="password"
                name="passwordConfirmation"
                value={authForm.passwordConfirmation}
                onChange={onInput}
                required
              />
            </label>
          ) : null}

          {authError ? <p className="auth-error">{authError}</p> : null}

          <button type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <button type="button" className="auth-toggle" onClick={onToggleMode}>
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </section>
    </main>
  )
}

export default AuthPage
