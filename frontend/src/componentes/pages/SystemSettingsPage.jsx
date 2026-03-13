import { useEffect, useMemo, useState } from 'react'

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const emptySettings = () => ({
  companyName: '',
  companyLogoUrl: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  country: '',
  city: '',
  postalCode: '',
  taxIdentificationNumber: '',
  companyRegistrationNumber: '',
  website: '',
  defaultSalaryType: 'Monthly',
  payrollProcessingDay: '25',
  overtimeCalculationMethod: 'Standard',
  taxCalculationMethod: 'Progressive',
  allowNegativeLeaveBalance: false,
  salaryRoundingRules: 'Nearest 0.01',
  automaticPayrollGeneration: false,
  payslipFormat: 'Standard',
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  weekendDays: ['Sat', 'Sun'],
  dailyWorkingHours: '8',
  shiftStartTime: '09:00',
  shiftEndTime: '17:00',
  breakTimeMinutes: '60',
  overtimeStartAfterHours: '8',
  defaultCurrency: 'US Dollar',
  currencySymbol: '$',
  currencyCode: 'USD',
  decimalFormat: '1,234.56',
  currencyPosition: 'Before',
  exchangeRate: '',
  mailDriver: 'smtp',
  smtpHost: '',
  smtpPort: '587',
  smtpUsername: '',
  smtpPassword: '',
  smtpPasswordSet: false,
  encryptionType: 'tls',
  fromEmailAddress: '',
  fromName: '',
  enableEmailNotifications: true,
  enableSystemNotifications: true,
  leaveRequestAlerts: true,
  payrollGenerationAlerts: true,
  overtimeRequestAlerts: true,
  attendanceAlerts: true,
  backupAutoEnabled: false,
  backupFrequency: 'Weekly',
  backupType: 'Database',
  backupStorageDriver: 'Local',
  backupRetentionDays: '30',
})

const emptyYearForm = () => ({
  id: null,
  name: '',
  startDate: '',
  endDate: '',
  isActive: false,
})

const emptyBackupForm = () => ({
  backupType: 'Database',
  storageDriver: 'Local',
})

const normalizeDays = (value, fallback) => {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // ignored
    }
  }

  return fallback
}

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

function SystemSettingsPage({
  activeItem,
  authToken,
  settingsEndpoint,
  logoEndpoint,
  financialYearsEndpoint,
  backupsEndpoint,
}) {
  const [settings, setSettings] = useState(() => emptySettings())
  const [financialYears, setFinancialYears] = useState([])
  const [backups, setBackups] = useState([])
  const [logoFile, setLogoFile] = useState(null)
  const [yearForm, setYearForm] = useState(() => emptyYearForm())
  const [backupForm, setBackupForm] = useState(() => emptyBackupForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const authHeaders = useMemo(
    () => ({
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    }),
    [authToken],
  )

  const authJsonHeaders = useMemo(
    () => ({
      ...authHeaders,
      'Content-Type': 'application/json',
    }),
    [authHeaders],
  )

  useEffect(() => {
    if (!authToken) {
      return
    }

    if (
      ![
        'Company Information',
        'Payroll Settings',
        'Working Days Configuration',
        'Currency Settings',
        'Financial Year Setup',
        'Email Settings',
        'Notification Settings',
        'Backup & Restore',
      ].includes(activeItem)
    ) {
      return
    }

    setNotice('')
    setError('')

    let isMounted = true

    const loadSettings = async () => {
      setLoading(true)
      setError('')

      try {
        const requests = [fetch(settingsEndpoint, { headers: authHeaders })]

        if (activeItem === 'Financial Year Setup') {
          requests.push(fetch(financialYearsEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Backup & Restore') {
          requests.push(fetch(backupsEndpoint, { headers: authHeaders }))
        }

        const responses = await Promise.all(requests)
        const payloads = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              const errorMessage = await parseApiError(response, 'Failed to load system settings.')
              throw new Error(errorMessage)
            }
            return response.json()
          }),
        )

        const [settingsPayload, ...restPayloads] = payloads
        const base = emptySettings()
        const incoming = settingsPayload?.data ?? {}
        const hydrated = {
          ...base,
          ...incoming,
          workingDays: normalizeDays(incoming?.workingDays, base.workingDays),
          weekendDays: normalizeDays(incoming?.weekendDays, base.weekendDays),
        }

        if (isMounted) {
          setSettings(hydrated)
        }

        if (activeItem === 'Financial Year Setup') {
          if (isMounted) {
            setFinancialYears(restPayloads[0]?.data ?? [])
          }
        }

        if (activeItem === 'Backup & Restore') {
          if (isMounted) {
            setBackups(restPayloads[0]?.data ?? [])
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [activeItem, authHeaders, authToken, backupsEndpoint, financialYearsEndpoint, settingsEndpoint])

  if (!authToken) {
    return (
      <section className="focus-panel">
        <h2>{activeItem}</h2>
        <p>Authentication is required to configure system settings.</p>
      </section>
    )
  }
  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target
    setSettings((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleDay = (key, day) => {
    setSettings((current) => {
      const values = new Set(current[key] ?? [])
      if (values.has(day)) {
        values.delete(day)
      } else {
        values.add(day)
      }
      return {
        ...current,
        [key]: Array.from(values),
      }
    })
  }

  const handleSave = async (payload, successMessage) => {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(settingsEndpoint, {
        method: 'PATCH',
        headers: authJsonHeaders,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to update settings.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const base = emptySettings()
      const incoming = result?.data ?? {}
      setSettings({
        ...base,
        ...incoming,
        workingDays: normalizeDays(incoming?.workingDays, base.workingDays),
        weekendDays: normalizeDays(incoming?.weekendDays, base.weekendDays),
      })
      setNotice(successMessage)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setError('Please select a logo file to upload.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const formData = new FormData()
      formData.append('logo', logoFile)

      const response = await fetch(logoEndpoint, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to upload logo.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const logoUrl = result?.data?.companyLogoUrl ?? ''

      setSettings((current) => ({
        ...current,
        companyLogoUrl: logoUrl,
      }))
      setLogoFile(null)
      setNotice('Company logo updated.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleYearSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!yearForm.name || !yearForm.startDate || !yearForm.endDate) {
      setError('Please provide a name, start date, and end date.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        yearForm.id ? `${financialYearsEndpoint}/${yearForm.id}` : financialYearsEndpoint,
        {
          method: yearForm.id ? 'PUT' : 'POST',
          headers: authJsonHeaders,
          body: JSON.stringify({
            name: yearForm.name,
            startDate: yearForm.startDate,
            endDate: yearForm.endDate,
            isActive: yearForm.isActive,
          }),
        },
      )

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to save financial year.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data

      if (updated) {
        setFinancialYears((current) => {
          const exists = current.find((item) => item.id === updated.id)
          let next = exists
            ? current.map((item) => (item.id === updated.id ? updated : item))
            : [updated, ...current]

          if (updated.isActive) {
            next = next.map((item) =>
              item.id === updated.id ? updated : { ...item, isActive: false },
            )
          }

          return next
        })
      }

      setYearForm(emptyYearForm())
      setNotice('Financial year saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleYearEdit = (year) => {
    setYearForm({
      id: year.id,
      name: year.name ?? '',
      startDate: year.startDate ?? '',
      endDate: year.endDate ?? '',
      isActive: Boolean(year.isActive),
    })
  }

  const handleYearDelete = async (yearId) => {
    if (!window.confirm('Delete this financial year?')) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`${financialYearsEndpoint}/${yearId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete financial year.')
        throw new Error(errorMessage)
      }

      setFinancialYears((current) => current.filter((year) => year.id !== yearId))
      setNotice('Financial year deleted.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackupCreate = async () => {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(backupsEndpoint, {
        method: 'POST',
        headers: authJsonHeaders,
        body: JSON.stringify({
          backupType: backupForm.backupType,
          storageDriver: backupForm.storageDriver,
        }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to create backup.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      if (payload?.data) {
        setBackups((current) => [payload.data, ...current])
      }
      setNotice('Backup completed.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackupRestore = async (backupId) => {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`${backupsEndpoint}/${backupId}/restore`, {
        method: 'POST',
        headers: authHeaders,
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to restore backup.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data
      if (updated) {
        setBackups((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }
      setNotice('Backup restored.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackupDelete = async (backupId) => {
    if (!window.confirm('Delete this backup record?')) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`${backupsEndpoint}/${backupId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete backup.')
        throw new Error(errorMessage)
      }

      setBackups((current) => current.filter((backup) => backup.id !== backupId))
      setNotice('Backup deleted.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackupDownload = async (backupId) => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`${backupsEndpoint}/${backupId}/download`, {
        headers: authHeaders,
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to download backup.')
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-${backupId}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackupPrune = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`${backupsEndpoint}/prune`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to prune backups.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const deleted = payload?.data?.deleted ?? 0
      if (deleted > 0) {
        setBackups((current) => current.filter((backup) => !payload?.data?.deletedIds?.includes?.(backup.id)))
      }
      setNotice(`Pruned ${deleted} old backups.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const companyPayload = {
    companyName: settings.companyName,
    companyEmail: settings.companyEmail,
    companyPhone: settings.companyPhone,
    companyAddress: settings.companyAddress,
    country: settings.country,
    city: settings.city,
    postalCode: settings.postalCode,
    taxIdentificationNumber: settings.taxIdentificationNumber,
    companyRegistrationNumber: settings.companyRegistrationNumber,
    website: settings.website,
  }

  const payrollPayload = {
    defaultSalaryType: settings.defaultSalaryType,
    payrollProcessingDay: settings.payrollProcessingDay,
    overtimeCalculationMethod: settings.overtimeCalculationMethod,
    taxCalculationMethod: settings.taxCalculationMethod,
    allowNegativeLeaveBalance: settings.allowNegativeLeaveBalance,
    salaryRoundingRules: settings.salaryRoundingRules,
    automaticPayrollGeneration: settings.automaticPayrollGeneration,
    payslipFormat: settings.payslipFormat,
  }

  const workingPayload = {
    workingDays: settings.workingDays,
    weekendDays: settings.weekendDays,
    dailyWorkingHours: settings.dailyWorkingHours,
    shiftStartTime: settings.shiftStartTime,
    shiftEndTime: settings.shiftEndTime,
    breakTimeMinutes: settings.breakTimeMinutes,
    overtimeStartAfterHours: settings.overtimeStartAfterHours,
  }

  const currencyPayload = {
    defaultCurrency: settings.defaultCurrency,
    currencySymbol: settings.currencySymbol,
    currencyCode: settings.currencyCode,
    decimalFormat: settings.decimalFormat,
    currencyPosition: settings.currencyPosition,
    exchangeRate: settings.exchangeRate,
  }

  const emailPayload = {
    mailDriver: settings.mailDriver,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUsername: settings.smtpUsername,
    encryptionType: settings.encryptionType,
    fromEmailAddress: settings.fromEmailAddress,
    fromName: settings.fromName,
  }

  if (settings.smtpPassword) {
    emailPayload.smtpPassword = settings.smtpPassword
  }

  const notificationPayload = {
    enableEmailNotifications: settings.enableEmailNotifications,
    enableSystemNotifications: settings.enableSystemNotifications,
    leaveRequestAlerts: settings.leaveRequestAlerts,
    payrollGenerationAlerts: settings.payrollGenerationAlerts,
    overtimeRequestAlerts: settings.overtimeRequestAlerts,
    attendanceAlerts: settings.attendanceAlerts,
  }

  const backupPayload = {
    backupAutoEnabled: settings.backupAutoEnabled,
    backupFrequency: settings.backupFrequency,
    backupType: settings.backupType,
    backupStorageDriver: settings.backupStorageDriver,
    backupRetentionDays: settings.backupRetentionDays,
  }

  const renderDayChips = (key) => (
    <div className="day-chips">
      {dayOptions.map((day) => (
        <label key={`${key}-${day}`} className="day-chip">
          <input
            type="checkbox"
            checked={(settings[key] ?? []).includes(day)}
            onChange={() => toggleDay(key, day)}
          />
          {day}
        </label>
      ))}
    </div>
  )
  if (activeItem === 'Company Information') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Company Information</h2>
          <p>Update your organization profile and branding information.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading company information...</div> : null}

        <div className="settings-card">
          <div className="settings-grid">
            <label>
              Company Name
              <input name="companyName" value={settings.companyName} onChange={handleFieldChange} />
            </label>
            <label>
              Company Email
              <input name="companyEmail" value={settings.companyEmail} onChange={handleFieldChange} />
            </label>
            <label>
              Company Phone
              <input name="companyPhone" value={settings.companyPhone} onChange={handleFieldChange} />
            </label>
            <label>
              Company Address
              <input name="companyAddress" value={settings.companyAddress} onChange={handleFieldChange} />
            </label>
            <label>
              Country
              <input name="country" value={settings.country} onChange={handleFieldChange} />
            </label>
            <label>
              City
              <input name="city" value={settings.city} onChange={handleFieldChange} />
            </label>
            <label>
              Postal Code
              <input name="postalCode" value={settings.postalCode} onChange={handleFieldChange} />
            </label>
            <label>
              Tax Identification Number (TIN)
              <input
                name="taxIdentificationNumber"
                value={settings.taxIdentificationNumber}
                onChange={handleFieldChange}
              />
            </label>
            <label>
              Company Registration Number
              <input
                name="companyRegistrationNumber"
                value={settings.companyRegistrationNumber}
                onChange={handleFieldChange}
              />
            </label>
            <label>
              Website
              <input name="website" value={settings.website} onChange={handleFieldChange} />
            </label>
          </div>

          <div className="settings-logo">
            <div>
              <h3>Company Logo</h3>
              <p className="settings-subtitle">Used on reports, payslips, and system branding.</p>
            </div>
            <div className="logo-row">
              <div className="logo-preview">
                {settings.companyLogoUrl ? (
                  <img src={settings.companyLogoUrl} alt="Company Logo" />
                ) : (
                  <span>No logo uploaded</span>
                )}
              </div>
              <div className="logo-actions">
                <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                <button type="button" className="action-btn" onClick={handleLogoUpload} disabled={saving}>
                  Upload Logo
                </button>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(companyPayload, 'Company profile updated.')}
              disabled={saving}
            >
              Save Company Information
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (activeItem === 'Payroll Settings') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Payroll Settings</h2>
          <p>Define payroll calculation rules, overtime logic, and payslip preferences.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading payroll settings...</div> : null}

        <div className="settings-card">
          <div className="settings-grid">
            <label>
              Default Salary Type
              <select name="defaultSalaryType" value={settings.defaultSalaryType} onChange={handleFieldChange}>
                <option value="Monthly">Monthly</option>
                <option value="Hourly">Hourly</option>
              </select>
            </label>
            <label>
              Payroll Processing Day
              <input
                type="number"
                name="payrollProcessingDay"
                value={settings.payrollProcessingDay}
                onChange={handleFieldChange}
              />
            </label>
            <label>
              Overtime Calculation Method
              <input
                name="overtimeCalculationMethod"
                value={settings.overtimeCalculationMethod}
                onChange={handleFieldChange}
              />
            </label>
            <label>
              Tax Calculation Method
              <input
                name="taxCalculationMethod"
                value={settings.taxCalculationMethod}
                onChange={handleFieldChange}
              />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="allowNegativeLeaveBalance"
                checked={settings.allowNegativeLeaveBalance}
                onChange={handleFieldChange}
              />
              Allow Negative Leave Balance
            </label>
            <label>
              Salary Rounding Rules
              <input name="salaryRoundingRules" value={settings.salaryRoundingRules} onChange={handleFieldChange} />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="automaticPayrollGeneration"
                checked={settings.automaticPayrollGeneration}
                onChange={handleFieldChange}
              />
              Automatic Payroll Generation
            </label>
            <label>
              Payslip Format
              <input name="payslipFormat" value={settings.payslipFormat} onChange={handleFieldChange} />
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(payrollPayload, 'Payroll settings updated.')}
              disabled={saving}
            >
              Save Payroll Settings
            </button>
          </div>
        </div>
      </section>
    )
  }
  if (activeItem === 'Working Days Configuration') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Working Days Configuration</h2>
          <p>Define the official working calendar, shifts, and overtime thresholds.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading working day settings...</div> : null}

        <div className="settings-card">
          <div className="settings-group">
            <h3>Working Days</h3>
            {renderDayChips('workingDays')}
          </div>
          <div className="settings-group">
            <h3>Weekend Days</h3>
            {renderDayChips('weekendDays')}
          </div>
          <div className="settings-grid">
            <label>
              Daily Working Hours
              <input
                type="number"
                name="dailyWorkingHours"
                value={settings.dailyWorkingHours}
                onChange={handleFieldChange}
              />
            </label>
            <label>
              Shift Start Time
              <input type="time" name="shiftStartTime" value={settings.shiftStartTime} onChange={handleFieldChange} />
            </label>
            <label>
              Shift End Time
              <input type="time" name="shiftEndTime" value={settings.shiftEndTime} onChange={handleFieldChange} />
            </label>
            <label>
              Break Time (Minutes)
              <input
                type="number"
                name="breakTimeMinutes"
                value={settings.breakTimeMinutes}
                onChange={handleFieldChange}
              />
            </label>
            <label>
              Overtime Starts After (Hours)
              <input
                type="number"
                name="overtimeStartAfterHours"
                value={settings.overtimeStartAfterHours}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(workingPayload, 'Working day settings updated.')}
              disabled={saving}
            >
              Save Working Days
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (activeItem === 'Currency Settings') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Currency Settings</h2>
          <p>Define default currency formatting and exchange settings used in payroll.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading currency settings...</div> : null}

        <div className="settings-card">
          <div className="settings-grid">
            <label>
              Default Currency
              <input name="defaultCurrency" value={settings.defaultCurrency} onChange={handleFieldChange} />
            </label>
            <label>
              Currency Symbol
              <input name="currencySymbol" value={settings.currencySymbol} onChange={handleFieldChange} />
            </label>
            <label>
              Currency Code
              <input name="currencyCode" value={settings.currencyCode} onChange={handleFieldChange} />
            </label>
            <label>
              Decimal Format
              <input name="decimalFormat" value={settings.decimalFormat} onChange={handleFieldChange} />
            </label>
            <label>
              Currency Position
              <select name="currencyPosition" value={settings.currencyPosition} onChange={handleFieldChange}>
                <option value="Before">Before Amount</option>
                <option value="After">After Amount</option>
              </select>
            </label>
            <label>
              Exchange Rate (Optional)
              <input name="exchangeRate" value={settings.exchangeRate} onChange={handleFieldChange} />
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(currencyPayload, 'Currency settings updated.')}
              disabled={saving}
            >
              Save Currency Settings
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (activeItem === 'Financial Year Setup') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Financial Year Setup</h2>
          <p>Create fiscal years and mark the active period for payroll reporting.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading financial years...</div> : null}

        <div className="settings-card">
          <form className="settings-grid" onSubmit={handleYearSubmit}>
            <label>
              Fiscal Year Name
              <input
                value={yearForm.name}
                onChange={(event) => setYearForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Start Date
              <input
                type="date"
                value={yearForm.startDate}
                onChange={(event) => setYearForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label>
              End Date
              <input
                type="date"
                value={yearForm.endDate}
                onChange={(event) => setYearForm((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={yearForm.isActive}
                onChange={(event) => setYearForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active Financial Year
            </label>
            <div className="settings-actions">
              <button type="submit" className="action-btn primary" disabled={saving}>
                {yearForm.id ? 'Update Financial Year' : 'Create Financial Year'}
              </button>
              {yearForm.id ? (
                <button type="button" className="action-btn ghost" onClick={() => setYearForm(emptyYearForm())}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="table-wrap">
            <table className="summary-table employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {financialYears.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan={5}>
                      No financial years configured yet.
                    </td>
                  </tr>
                ) : (
                  financialYears.map((year) => (
                    <tr key={year.id}>
                      <td>{year.name}</td>
                      <td>{year.startDate}</td>
                      <td>{year.endDate}</td>
                      <td>
                        <span className={`pill status ${year.isActive ? 'active' : 'inactive'}`}>
                          {year.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => handleYearEdit(year)}>
                            Edit
                          </button>
                          <button type="button" className="danger" onClick={() => handleYearDelete(year.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    )
  }
  if (activeItem === 'Email Settings') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Email Settings</h2>
          <p>Configure the outgoing email service for payslips and alerts.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading email settings...</div> : null}

        <div className="settings-card">
          <div className="settings-grid">
            <label>
              Mail Driver
              <input name="mailDriver" value={settings.mailDriver} onChange={handleFieldChange} />
            </label>
            <label>
              SMTP Host
              <input name="smtpHost" value={settings.smtpHost} onChange={handleFieldChange} />
            </label>
            <label>
              SMTP Port
              <input name="smtpPort" value={settings.smtpPort} onChange={handleFieldChange} />
            </label>
            <label>
              SMTP Username
              <input name="smtpUsername" value={settings.smtpUsername} onChange={handleFieldChange} />
            </label>
            <label>
              SMTP Password
              <input
                type="password"
                name="smtpPassword"
                value={settings.smtpPassword}
                onChange={handleFieldChange}
                placeholder={settings.smtpPasswordSet ? 'Saved in system' : 'Enter password'}
              />
            </label>
            <label>
              Encryption Type
              <input name="encryptionType" value={settings.encryptionType} onChange={handleFieldChange} />
            </label>
            <label>
              From Email Address
              <input name="fromEmailAddress" value={settings.fromEmailAddress} onChange={handleFieldChange} />
            </label>
            <label>
              From Name
              <input name="fromName" value={settings.fromName} onChange={handleFieldChange} />
            </label>
          </div>
          <p className="settings-subtitle">Leave SMTP password empty to keep the stored value.</p>
          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(emailPayload, 'Email settings updated.')}
              disabled={saving}
            >
              Save Email Settings
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (activeItem === 'Notification Settings') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Notification Settings</h2>
          <p>Choose which system alerts are delivered by email or in-app notifications.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading notification settings...</div> : null}

        <div className="settings-card">
          <div className="settings-grid">
            <label className="toggle-row">
              <input
                type="checkbox"
                name="enableEmailNotifications"
                checked={settings.enableEmailNotifications}
                onChange={handleFieldChange}
              />
              Enable Email Notifications
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="enableSystemNotifications"
                checked={settings.enableSystemNotifications}
                onChange={handleFieldChange}
              />
              Enable System Notifications
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="leaveRequestAlerts"
                checked={settings.leaveRequestAlerts}
                onChange={handleFieldChange}
              />
              Leave Request Alerts
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="payrollGenerationAlerts"
                checked={settings.payrollGenerationAlerts}
                onChange={handleFieldChange}
              />
              Payroll Generation Alerts
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="overtimeRequestAlerts"
                checked={settings.overtimeRequestAlerts}
                onChange={handleFieldChange}
              />
              Overtime Request Alerts
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                name="attendanceAlerts"
                checked={settings.attendanceAlerts}
                onChange={handleFieldChange}
              />
              Attendance Alerts
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(notificationPayload, 'Notification settings updated.')}
              disabled={saving}
            >
              Save Notification Settings
            </button>
          </div>
        </div>
      </section>
    )
  }
  if (activeItem === 'Backup & Restore') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Backup & Restore</h2>
          <p>Protect system data with scheduled backups and on-demand recovery.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading backup settings...</div> : null}

        <div className="settings-card">
          <div className="settings-grid">
            <label className="toggle-row">
              <input
                type="checkbox"
                name="backupAutoEnabled"
                checked={settings.backupAutoEnabled}
                onChange={handleFieldChange}
              />
              Automatic Scheduled Backup
            </label>
            <label>
              Backup Frequency
              <select name="backupFrequency" value={settings.backupFrequency} onChange={handleFieldChange}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </label>
            <label>
              Default Backup Type
              <select name="backupType" value={settings.backupType} onChange={handleFieldChange}>
                <option value="Database">Database Backup</option>
                <option value="Full">Full System Backup</option>
                <option value="Cloud">Cloud Backup</option>
              </select>
            </label>
            <label>
              Storage Driver
              <select
                name="backupStorageDriver"
                value={settings.backupStorageDriver}
                onChange={handleFieldChange}
              >
                <option value="Local">Local</option>
                <option value="S3">Amazon S3</option>
                <option value="Azure">Azure</option>
                <option value="GCS">Google Cloud Storage</option>
              </select>
            </label>
            <label>
              Backup Retention (Days)
              <input
                type="number"
                name="backupRetentionDays"
                value={settings.backupRetentionDays}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => handleSave(backupPayload, 'Backup settings updated.')}
              disabled={saving}
            >
              Save Backup Settings
            </button>
          </div>

          <div className="settings-divider" />

          <div className="settings-grid">
            <label>
              Manual Backup Type
              <select
                value={backupForm.backupType}
                onChange={(event) =>
                  setBackupForm((current) => ({ ...current, backupType: event.target.value }))
                }
              >
                <option value="Database">Database Backup</option>
                <option value="Full">Full System Backup</option>
                <option value="Cloud">Cloud Backup</option>
              </select>
            </label>
            <label>
              Storage Driver
              <select
                value={backupForm.storageDriver}
                onChange={(event) =>
                  setBackupForm((current) => ({ ...current, storageDriver: event.target.value }))
                }
              >
                <option value="Local">Local</option>
                <option value="S3">Amazon S3</option>
                <option value="Azure">Azure</option>
                <option value="GCS">Google Cloud Storage</option>
              </select>
            </label>
            <div className="settings-actions">
              <button type="button" className="action-btn primary" onClick={handleBackupCreate} disabled={saving}>
                Run Manual Backup
              </button>
              <button type="button" className="action-btn ghost" onClick={handleBackupPrune} disabled={saving}>
                Delete Old Backups
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="summary-table employee-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Storage</th>
                  <th>File</th>
                  <th>Size (MB)</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan={7}>
                      No backup records yet.
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id}>
                      <td>{backup.backupType}</td>
                      <td>{backup.storageDriver || '-'}</td>
                      <td>{backup.fileName || '-'}</td>
                      <td>{backup.sizeMb ?? '-'}</td>
                      <td>{backup.status}</td>
                      <td>{backup.createdDate}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => handleBackupDownload(backup.id)}>
                            Download
                          </button>
                          <button type="button" onClick={() => handleBackupRestore(backup.id)}>
                            Restore
                          </button>
                          <button type="button" className="danger" onClick={() => handleBackupDelete(backup.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="focus-panel">
      <h2>{activeItem}</h2>
      <p>This system settings module is ready for dedicated API endpoints.</p>
    </section>
  )
}

export default SystemSettingsPage
