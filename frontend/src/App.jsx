import { useEffect, useMemo, useState } from 'react'
import './App.css'
import AuthPage from './componentes/pages/AuthPage'
import DashboardPanel from './componentes/pages/DashboardPanel'
import HeaderBar from './componentes/pages/HeaderBar'
import ModulePage from './componentes/pages/ModulePage'
import ProfilePage from './componentes/pages/ProfilePage'
import SidebarMenu from './componentes/pages/SidebarMenu'
import { fallbackOverview, menuSections } from './componentes/pages/menuSections'

const AUTH_STORAGE_KEY = 'payroll_auth_token'

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

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
  const [searchTerm, setSearchTerm] = useState('')
  const [currentView, setCurrentView] = useState('dashboard')
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

  useEffect(() => {
    const applyHashView = () => {
      if (window.location.hash === '#/profile') {
        setCurrentView('profile')
      } else {
        setCurrentView('dashboard')
      }
    }

    applyHashView()
    window.addEventListener('hashchange', applyHashView)

    return () => window.removeEventListener('hashchange', applyHashView)
  }, [])

  const handleSectionToggle = (sectionTitle) => {
    setExpanded((current) => ({
      ...current,
      [sectionTitle]: !current[sectionTitle],
    }))
  }

  const handleItemSelect = (sectionTitle, itemLabel) => {
    setActiveSection(sectionTitle)
    setActiveItem(itemLabel)
    setCurrentView('dashboard')
    window.location.hash = '#/'
    setMobileOpen(false)
  }

  const handleOpenProfile = (event) => {
    event.preventDefault()
    setCurrentView('profile')
    window.location.hash = '#/profile'
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

  const handleToggleAuthMode = () => {
    setAuthMode((current) => (current === 'login' ? 'register' : 'login'))
    setAuthError('')
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

  const filteredMenuSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return menuSections
    }

    return menuSections
      .map((section) => {
        const titleMatch = section.title.toLowerCase().includes(normalizedSearch)
        const filteredItems = section.items.filter((item) =>
          item.toLowerCase().includes(normalizedSearch),
        )

        if (titleMatch) {
          return section
        }

        if (filteredItems.length > 0) {
          return {
            ...section,
            items: filteredItems,
          }
        }

        return null
      })
      .filter(Boolean)
  }, [searchTerm])

  const dashboardOverview = dashboardData?.overview ?? []
  const topStats = dashboardOverview.length > 0 ? dashboardOverview : fallbackOverview
  const displaySection = currentView === 'profile' ? 'Profile' : activeSection
  const displayItem = currentView === 'profile' ? 'Logged In Profile' : activeItem

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
    return (
      <AuthPage
        authMode={authMode}
        authForm={authForm}
        authError={authError}
        authLoading={authLoading}
        apiStatus={apiStatus}
        apiOnline={apiOnline}
        onSubmit={handleAuthSubmit}
        onInput={handleAuthInput}
        onToggleMode={handleToggleAuthMode}
      />
    )
  }

  return (
    <div className="layout">
      <SidebarMenu
        mobileOpen={mobileOpen}
        filteredMenuSections={filteredMenuSections}
        expanded={expanded}
        activeSection={activeSection}
        activeItem={activeItem}
        onToggleSection={handleSectionToggle}
        onSelectItem={handleItemSelect}
        onLogout={handleLogout}
      />

      <button
        type="button"
        className={`overlay ${mobileOpen ? 'show' : ''}`}
        aria-label="Close menu"
        onClick={() => setMobileOpen(false)}
      />

      <main className="content">
        <HeaderBar
          apiOnline={apiOnline}
          apiStatus={apiStatus}
          currentUser={currentUser}
          searchTerm={searchTerm}
          onOpenMenu={() => setMobileOpen(true)}
          onLogoRefresh={() => window.location.reload()}
          onOpenProfile={handleOpenProfile}
          onSearchChange={setSearchTerm}
        />

        <header className="topbar">
          <div>
            <p className="eyebrow">{displaySection}</p>
            <h1>{displayItem}</h1>
          </div>
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

        {currentView === 'profile' ? (
          <ProfilePage currentUser={currentUser} />
        ) : activeSection === 'Dashboard' ? (
          <DashboardPanel
            activeItem={activeItem}
            dashboardData={dashboardData}
            dashboardError={dashboardError}
            dashboardLoading={dashboardLoading}
            dashboardEndpoint={dashboardEndpoint}
            moneyFormatter={moneyFormatter}
          />
        ) : (
          <ModulePage activeItem={activeItem} />
        )}
      </main>
    </div>
  )
}

export default App
