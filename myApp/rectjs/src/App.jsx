import { useEffect, useMemo, useState } from 'react'
import './App.css'

const AUTH_STORAGE_KEY = 'payroll_auth_token'

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const menuSections = [
  {
    icon: 'DB',
    title: 'Dashboard',
    items: ['Overview', 'Payroll Analytics', 'Monthly Summary', 'System Notification'],
  },
  {
    icon: 'EM',
    title: 'Employee Management',
    items: [
      'All Employees',
      'Add Employee',
      'Departments',
      'Job Positions',
      'Employment Types',
      'Bank Account Details',
      'Employee Status (Active/Inactive)',
    ],
  },
  {
    icon: 'SS',
    title: 'Salary Structure',
    items: [
      'Salary Grades',
      'Salary Templates',
      'Assign Salary to Employee',
      'Salary History',
      'Bulk Salary Update',
    ],
  },
  {
    icon: 'AL',
    title: 'Allowances Management',
    items: [
      'Allowance Types (Transport, Housing, Bonus)',
      'Fixed Allowances',
      'Variable Allowances',
      'Performance Bonus',
      'Overtime Configuration',
    ],
  },
  {
    icon: 'DE',
    title: 'Deductions Management',
    items: [
      'Deduction Types (Loan, Penalty, Insurance)',
      'Loan Management',
      'Recurring Deductions',
      'One-time Deductions',
      'Late/Absent Penalty Rules',
    ],
  },
  {
    icon: 'TX',
    title: 'Tax Management',
    items: [
      'Tax Rules Setup',
      'Tax Brackets',
      'Government Contributions',
      'Pension Settings',
      'Tax Reports',
    ],
  },
  {
    icon: 'PR',
    title: 'Payroll Processing',
    items: [
      'Generate Payroll',
      'View Generated Payroll',
      'Edit Payroll',
      'Approve Payroll',
      'Lock Payroll',
      'Reopen Payroll',
      'Payroll History',
    ],
  },
  {
    icon: 'PS',
    title: 'Payslips',
    items: ['Generate Payslips', 'Bulk Download (PDF)', 'Email Payslips', 'Payslip Templates'],
  },
  {
    icon: 'BK',
    title: 'Bank Integration',
    items: ['Bank File Export', 'Payment Batch List', 'Payment Status', 'Bank Format Settings'],
  },
  {
    icon: 'RP',
    title: 'Reports & Analytics',
    items: [
      'Monthly Payroll Summary',
      'Net vs Gross Report',
      'Department Salary Cost',
      'Tax Deduction Report',
      'Overtime Cost Report',
      'Allowance Breakdown',
      'Deduction Breakdown',
      'Employee Salary History',
    ],
  },
  {
    icon: 'AP',
    title: 'Approvals & Workflow',
    items: [
      'Pending Approvals',
      'Approval History',
      'Multi-Level Approval Setup',
      'Workflow Settings',
    ],
  },
  {
    icon: 'ST',
    title: 'System Settings',
    items: [
      'Company Information',
      'Payroll Settings',
      'Working Days Configuration',
      'Currency Settings',
      'Financial Year Setup',
      'Email Settings',
      'Notification Settings',
      'Backup & Restore',
    ],
  },
  {
    icon: 'RL',
    title: 'Role & Permission Management',
    items: ['Manage Roles', 'Assign Permissions', 'User Accounts', 'Activity Logs'],
  },
  {
    icon: 'LG',
    title: 'Audit & Logs',
    items: ['Payroll Audit Trail', 'User Activity Logs', 'System Logs', 'Error Logs'],
  },
]

const fallbackOverview = [
  { label: 'Active Employees', value: 0, hint: 'Waiting for API' },
  { label: 'Pending Payroll Runs', value: 0, hint: 'Waiting for API' },
  { label: 'Approvals Waiting', value: 0, hint: 'Waiting for API' },
  { label: 'Monthly Net Payout', value: 0, hint: 'Waiting for API' },
]

const parseApiError = async (response, fallbackMessage) => {
  try {
    const payload = await response.json()

    if (payload?.message) {
      return payload.message
    }

    if (payload?.errors) {
      const firstField = Object.keys(payload.errors)[0]

      if (firstField && payload.errors[firstField]?.[0]) {
        return payload.errors[firstField][0]
      }
    }
  } catch {
    // ignored
  }

  return fallbackMessage
}

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  const healthEndpoint = useMemo(
    () => (apiBaseUrl ? `${apiBaseUrl}/api/health` : '/api/health'),
    [apiBaseUrl],
  )
  const dashboardEndpoint = useMemo(
    () => (apiBaseUrl ? `${apiBaseUrl}/api/dashboard` : '/api/dashboard'),
    [apiBaseUrl],
  )
  const registerEndpoint = useMemo(
    () => (apiBaseUrl ? `${apiBaseUrl}/api/auth/register` : '/api/auth/register'),
    [apiBaseUrl],
  )
  const loginEndpoint = useMemo(
    () => (apiBaseUrl ? `${apiBaseUrl}/api/auth/login` : '/api/auth/login'),
    [apiBaseUrl],
  )
  const meEndpoint = useMemo(() => (apiBaseUrl ? `${apiBaseUrl}/api/auth/me` : '/api/auth/me'), [apiBaseUrl])
  const logoutEndpoint = useMemo(
    () => (apiBaseUrl ? `${apiBaseUrl}/api/auth/logout` : '/api/auth/logout'),
    [apiBaseUrl],
  )

  const [apiStatus, setApiStatus] = useState('Checking connection...')
  const [apiOnline, setApiOnline] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardLoading, setDashboardLoading] = useState(true)

  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    role: 'hr',
    password: '',
    passwordConfirmation: '',
  })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) ?? '')
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem(AUTH_STORAGE_KEY))
  const [currentUser, setCurrentUser] = useState(null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(menuSections[0].title)
  const [activeItem, setActiveItem] = useState(menuSections[0].items[0])
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(menuSections.map(({ title }, index) => [title, index === 0])),
  )

  const setAuthToken = (nextToken) => {
    setToken(nextToken)

    if (nextToken) {
      localStorage.setItem(AUTH_STORAGE_KEY, nextToken)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  const authHeaders = (authToken) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${authToken}`,
  })

  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const response = await fetch(healthEndpoint, {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setApiOnline(true)
        setApiStatus(`${payload.message} (${payload.timestamp})`)
      } catch (requestError) {
        setApiOnline(false)
        setApiStatus(`Backend unavailable: ${requestError.message}`)
      }
    }

    fetchApiStatus()
  }, [healthEndpoint])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setCurrentUser(null)
        setAuthReady(true)
        return
      }

      try {
        const response = await fetch(meEndpoint, {
          headers: authHeaders(token),
        })

        if (!response.ok) {
          const errorMessage = await parseApiError(response, 'Session expired. Please log in again.')
          throw new Error(errorMessage)
        }

        const payload = await response.json()
        setCurrentUser(payload.user)
      } catch {
        setCurrentUser(null)
        setAuthToken('')
      } finally {
        setAuthReady(true)
      }
    }

    fetchCurrentUser()
  }, [meEndpoint, token])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token || !currentUser) {
        setDashboardData(null)
        setDashboardLoading(false)
        return
      }

      setDashboardLoading(true)
      setDashboardError('')

      try {
        const response = await fetch(dashboardEndpoint, {
          headers: authHeaders(token),
        })

        if (!response.ok) {
          const errorMessage = await parseApiError(response, 'Failed to load dashboard data.')
          throw new Error(errorMessage)
        }

        const payload = await response.json()
        setDashboardData(payload)
      } catch (requestError) {
        setDashboardError(requestError.message)
      } finally {
        setDashboardLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser, dashboardEndpoint, token])

  const handleSectionToggle = (sectionTitle) => {
    setExpanded((current) => ({
      ...current,
      [sectionTitle]: !current[sectionTitle],
    }))
  }

  const handleItemSelect = (sectionTitle, itemLabel) => {
    setActiveSection(sectionTitle)
    setActiveItem(itemLabel)
    setMobileOpen(false)
  }

  const handleAuthInput = (event) => {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  const resetAuthForm = () => {
    setAuthForm({
      name: '',
      email: '',
      role: 'hr',
      password: '',
      passwordConfirmation: '',
    })
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const isRegister = authMode === 'register'
    const endpoint = isRegister ? registerEndpoint : loginEndpoint
    const payload = isRegister
      ? {
          name: authForm.name,
          email: authForm.email,
          role: authForm.role,
          password: authForm.password,
          password_confirmation: authForm.passwordConfirmation,
        }
      : {
          email: authForm.email,
          password: authForm.password,
        }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Authentication failed.')
        throw new Error(errorMessage)
      }

      const authPayload = await response.json()
      setAuthToken(authPayload.token)
      setCurrentUser(authPayload.user)
      resetAuthForm()
    } catch (requestError) {
      setAuthError(requestError.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(logoutEndpoint, {
          method: 'POST',
          headers: authHeaders(token),
        })
      }
    } finally {
      setCurrentUser(null)
      setDashboardData(null)
      setDashboardError('')
      setAuthToken('')
    }
  }

  const dashboardOverview = dashboardData?.overview ?? []
  const topStats = dashboardOverview.length > 0 ? dashboardOverview : fallbackOverview

  const renderDashboardPanel = () => {
    if (dashboardLoading) {
      return (
        <section className="focus-panel">
          <h2>Loading dashboard data</h2>
          <p>Fetching payroll overview, analytics, and notifications from Laravel API.</p>
          <code>{dashboardEndpoint}</code>
        </section>
      )
    }

    if (dashboardError) {
      return (
        <section className="focus-panel">
          <h2>Dashboard data unavailable</h2>
          <p>Could not load dashboard metrics: {dashboardError}</p>
          <code>{dashboardEndpoint}</code>
        </section>
      )
    }

    if (activeItem === 'Overview') {
      return (
        <section className="focus-panel">
          <h2>Overview</h2>
          <div className="panel-grid">
            {dashboardOverview.map((metric) => (
              <article key={metric.label} className="metric-card">
                <p>{metric.label}</p>
                <strong>
                  {metric.label.toLowerCase().includes('payout')
                    ? moneyFormatter.format(metric.value)
                    : metric.value}
                </strong>
                <small>{metric.hint}</small>
              </article>
            ))}
          </div>
        </section>
      )
    }

    if (activeItem === 'Payroll Analytics') {
      const trend = dashboardData?.payroll_analytics?.gross_trend ?? []
      const costSplit = dashboardData?.payroll_analytics?.cost_split ?? []
      const maxTrendAmount = Math.max(...trend.map((item) => item.amount), 1)

      return (
        <section className="focus-panel">
          <h2>Payroll Analytics</h2>
          <div className="panel-grid two-columns">
            <article className="metric-card wide">
              <h3>Gross Payroll Trend</h3>
              <ul className="trend-list">
                {trend.map((item) => (
                  <li key={item.month} className="trend-row">
                    <span>{item.month}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.round((item.amount / maxTrendAmount) * 100)}%` }}
                      />
                    </div>
                    <strong>{moneyFormatter.format(item.amount)}</strong>
                  </li>
                ))}
              </ul>
            </article>
            <article className="metric-card">
              <h3>Cost Distribution</h3>
              <ul className="trend-list split-list">
                {costSplit.map((item) => (
                  <li key={item.name} className="trend-row split-row">
                    <span>{item.name}</span>
                    <strong>{item.percentage}%</strong>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      )
    }

    if (activeItem === 'Monthly Summary') {
      const summary = dashboardData?.monthly_summary
      const departments = summary?.departments ?? []

      return (
        <section className="focus-panel">
          <h2>Monthly Summary</h2>
          <p>{summary?.period}</p>
          <div className="panel-grid">
            <article className="metric-card">
              <p>Gross Pay</p>
              <strong>{moneyFormatter.format(summary?.gross_pay ?? 0)}</strong>
            </article>
            <article className="metric-card">
              <p>Allowances</p>
              <strong>{moneyFormatter.format(summary?.allowances ?? 0)}</strong>
            </article>
            <article className="metric-card">
              <p>Deductions</p>
              <strong>{moneyFormatter.format(summary?.deductions ?? 0)}</strong>
            </article>
            <article className="metric-card">
              <p>Taxes</p>
              <strong>{moneyFormatter.format(summary?.taxes ?? 0)}</strong>
            </article>
            <article className="metric-card">
              <p>Net Pay</p>
              <strong>{moneyFormatter.format(summary?.net_pay ?? 0)}</strong>
            </article>
          </div>
          <div className="table-wrap">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.name}>
                    <td>{department.name}</td>
                    <td>{department.employees}</td>
                    <td>{moneyFormatter.format(department.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )
    }

    if (activeItem === 'System Notification') {
      const notifications = dashboardData?.system_notifications ?? []

      return (
        <section className="focus-panel">
          <h2>System Notification</h2>
          <ul className="notification-list">
            {notifications.map((note) => (
              <li key={`${note.title}-${note.time}`} className={`note-card ${note.level}`}>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.message}</p>
                </div>
                <time>{note.time}</time>
              </li>
            ))}
          </ul>
        </section>
      )
    }

    return (
      <section className="focus-panel">
        <h2>{activeItem}</h2>
        <p>Select one of the Dashboard submenu items to view payroll dashboard details.</p>
      </section>
    )
  }

  if (!authReady) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Restoring session...</h1>
        </section>
      </main>
    )
  }

  if (!currentUser) {
    const isRegister = authMode === 'register'

    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Payroll Access</h1>
          <p className="auth-subtitle">Sign in or register as Superadmin/HR to continue.</p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {isRegister ? (
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={authForm.name}
                  onChange={handleAuthInput}
                  required
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthInput}
                required
              />
            </label>

            {isRegister ? (
              <label>
                Role
                <select name="role" value={authForm.role} onChange={handleAuthInput}>
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
                onChange={handleAuthInput}
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
                  onChange={handleAuthInput}
                  required
                />
              </label>
            ) : null}

            {authError ? <p className="auth-error">{authError}</p> : null}

            <button type="submit" disabled={authLoading}>
              {authLoading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setAuthMode((current) => (current === 'login' ? 'register' : 'login'))
              setAuthError('')
            }}
          >
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>

          <p className={`status ${apiOnline ? 'ok' : 'offline'}`}>{apiStatus}</p>
        </section>
      </main>
    )
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <h2>Payroll Admin</h2>
          <p>{currentUser.name} ({currentUser.role})</p>
        </div>

        <nav className="menu">
          {menuSections.map((section) => (
            <section key={section.title} className="menu-group">
              <button
                className="menu-group-trigger"
                onClick={() => handleSectionToggle(section.title)}
                type="button"
                aria-expanded={expanded[section.title]}
              >
                <span className="menu-title">
                  <span className="menu-icon">{section.icon}</span>
                  {section.title}
                </span>
                <span className="caret">{expanded[section.title] ? '-' : '+'}</span>
              </button>

              {expanded[section.title] ? (
                <ul className="submenu">
                  {section.items.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`submenu-item ${
                          activeSection === section.title && activeItem === item ? 'active' : ''
                        }`}
                        onClick={() => handleItemSelect(section.title, item)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </nav>

        <button type="button" className="logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <button
        type="button"
        className={`overlay ${mobileOpen ? 'show' : ''}`}
        aria-label="Close menu"
        onClick={() => setMobileOpen(false)}
      />

      <main className="content">
        <header className="topbar">
          <button type="button" className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            Menu
          </button>
          <div>
            <p className="eyebrow">{activeSection}</p>
            <h1>{activeItem}</h1>
          </div>
          <span className={`status ${apiOnline ? 'ok' : 'offline'}`}>{apiStatus}</span>
        </header>

        <section className="stats">
          {topStats.map((metric) => (
            <article key={`top-${metric.label}`}>
              <p>{metric.label}</p>
              <strong>
                {metric.label.toLowerCase().includes('payout')
                  ? moneyFormatter.format(metric.value)
                  : metric.value}
              </strong>
            </article>
          ))}
        </section>

        {activeSection === 'Dashboard' ? (
          renderDashboardPanel()
        ) : (
          <section className="focus-panel">
            <h2>{activeItem}</h2>
            <p>
              This module can now be connected to dedicated Laravel API endpoints. The Dashboard
              module already includes working Overview, Analytics, Summary, and Notifications data.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
