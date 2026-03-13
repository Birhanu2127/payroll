
import { useEffect, useMemo, useState } from 'react'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const emptyGradeForm = () => ({
  name: '',
  level: '',
  minSalary: '',
  maxSalary: '',
  description: '',
  status: 'Active',
  createdDate: new Date().toISOString().slice(0, 10),
})

const earningDefaults = [
  'Housing Allowance',
  'Transport Allowance',
  'Meal Allowance',
  'Overtime Pay',
  'Bonus',
]

const deductionDefaults = ['Tax', 'Pension', 'Insurance', 'Loan Deduction', 'Penalty', 'Other Deduction']

const emptyTemplateForm = () => ({
  name: '',
  basicSalary: '',
  description: '',
  status: 'Active',
  createdDate: new Date().toISOString().slice(0, 10),
  earnings: earningDefaults.map((name) => ({ name, amount: '' })),
  deductions: deductionDefaults.map((name) => ({ name, amount: '' })),
})

const emptyAssignForm = () => ({
  employeeId: '',
  salaryGradeId: '',
  salaryTemplateId: '',
  basicSalary: '',
  allowancesTotal: '',
  deductionsTotal: '',
  paymentFrequency: 'Monthly',
  effectiveDate: new Date().toISOString().slice(0, 10),
  changeReason: '',
})

const emptyBulkForm = () => ({
  department: '',
  salaryGradeId: '',
  increaseType: 'percentage',
  increaseValue: '',
  effectiveDate: new Date().toISOString().slice(0, 10),
})

const parseNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
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

function SalaryStructurePage({
  activeItem,
  authToken,
  salaryGradesEndpoint,
  salaryTemplatesEndpoint,
  employeeSalariesEndpoint,
  salaryHistoriesEndpoint,
  salaryBulkUpdatesEndpoint,
  employeesEndpoint,
}) {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [panel, setPanel] = useState({ mode: null, record: null })

  const [salaryGrades, setSalaryGrades] = useState([])
  const [salaryTemplates, setSalaryTemplates] = useState([])
  const [employeeSalaries, setEmployeeSalaries] = useState([])
  const [salaryHistories, setSalaryHistories] = useState([])
  const [bulkUpdates, setBulkUpdates] = useState([])
  const [employees, setEmployees] = useState([])

  const [gradeForm, setGradeForm] = useState(() => emptyGradeForm())
  const [templateForm, setTemplateForm] = useState(() => emptyTemplateForm())
  const [assignForm, setAssignForm] = useState(() => emptyAssignForm())
  const [assignMode, setAssignMode] = useState('create')
  const [bulkForm, setBulkForm] = useState(() => emptyBulkForm())
  const [historyFilters, setHistoryFilters] = useState({
    employeeId: '',
    from: '',
    to: '',
  })

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

  const departmentOptions = useMemo(
    () =>
      Array.from(new Set(employees.map((employee) => employee.department))).filter(Boolean).sort(),
    [employees],
  )

  const gradeOptions = useMemo(() => salaryGrades, [salaryGrades])
  const templateOptions = useMemo(() => salaryTemplates, [salaryTemplates])

  const templateTotals = useMemo(() => {
    const basic = parseNumber(templateForm.basicSalary)
    const earnings = templateForm.earnings.reduce((sum, item) => sum + parseNumber(item.amount), 0)
    const deductions = templateForm.deductions.reduce((sum, item) => sum + parseNumber(item.amount), 0)

    return {
      earnings,
      deductions,
      net: basic + earnings - deductions,
    }
  }, [templateForm])

  const assignTotals = useMemo(() => {
    const basic = parseNumber(assignForm.basicSalary)
    const allowances = parseNumber(assignForm.allowancesTotal)
    const deductions = parseNumber(assignForm.deductionsTotal)
    return basic + allowances - deductions
  }, [assignForm])
  useEffect(() => {
    if (!authToken) {
      setError('Authentication required.')
      return
    }

    const loadBase = async () => {
      if (!['Salary Grades', 'Salary Templates', 'Assign Salary to Employee', 'Salary History', 'Bulk Salary Update'].includes(activeItem)) {
        return
      }

      setError('')
      setLoading(true)

      try {
        const requests = [fetch(employeesEndpoint, { headers: authHeaders })]

        if (activeItem === 'Salary Grades') {
          requests.push(fetch(salaryGradesEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Salary Templates') {
          requests.push(fetch(salaryTemplatesEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Assign Salary to Employee') {
          requests.push(fetch(salaryGradesEndpoint, { headers: authHeaders }))
          requests.push(fetch(salaryTemplatesEndpoint, { headers: authHeaders }))
          requests.push(fetch(employeeSalariesEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Salary History') {
          requests.push(fetch(salaryHistoriesEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Bulk Salary Update') {
          requests.push(fetch(salaryGradesEndpoint, { headers: authHeaders }))
          requests.push(fetch(salaryBulkUpdatesEndpoint, { headers: authHeaders }))
        }

        const responses = await Promise.all(requests)
        const payloads = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              const errorMessage = await parseApiError(response, 'Failed to load data.')
              throw new Error(errorMessage)
            }
            return response.json()
          }),
        )

        const [employeesPayload, ...restPayloads] = payloads
        setEmployees(employeesPayload?.data ?? [])

        if (activeItem === 'Salary Grades') {
          setSalaryGrades(restPayloads[0]?.data ?? [])
        }

        if (activeItem === 'Salary Templates') {
          setSalaryTemplates(restPayloads[0]?.data ?? [])
        }

        if (activeItem === 'Assign Salary to Employee') {
          setSalaryGrades(restPayloads[0]?.data ?? [])
          setSalaryTemplates(restPayloads[1]?.data ?? [])
          setEmployeeSalaries(restPayloads[2]?.data ?? [])
        }

        if (activeItem === 'Salary History') {
          setSalaryHistories(restPayloads[0]?.data ?? [])
        }

        if (activeItem === 'Bulk Salary Update') {
          setSalaryGrades(restPayloads[0]?.data ?? [])
          setBulkUpdates(restPayloads[1]?.data ?? [])
        }
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadBase()
  }, [
    activeItem,
    authHeaders,
    authToken,
    employeeSalariesEndpoint,
    employeesEndpoint,
    salaryBulkUpdatesEndpoint,
    salaryGradesEndpoint,
    salaryHistoriesEndpoint,
    salaryTemplatesEndpoint,
  ])
  const openPanel = (mode, record = null) => {
    setNotice('')
    setError('')
    setPanel({ mode, record })

    if (mode === 'grade') {
      setGradeForm(record ? { ...record } : emptyGradeForm())
    }

    if (mode === 'template') {
      if (record) {
        const mapItems = (defaults, items) =>
          defaults.map((name) => {
            const match = items.find((item) => item.name === name)
            return { name, amount: match ? String(match.amount) : '' }
          })
        setTemplateForm({
          name: record.name ?? '',
          basicSalary: record.basicSalary ?? '',
          description: record.description ?? '',
          status: record.status ?? 'Active',
          createdDate: record.createdDate ?? new Date().toISOString().slice(0, 10),
          earnings: mapItems(earningDefaults, record.earnings ?? []),
          deductions: mapItems(deductionDefaults, record.deductions ?? []),
        })
      } else {
        setTemplateForm(emptyTemplateForm())
      }
    }
  }

  const closePanel = () => setPanel({ mode: null, record: null })

  const handleGradeSave = async (event) => {
    event.preventDefault()
    setError('')

    const payload = {
      name: gradeForm.name,
      level: gradeForm.level,
      minSalary: parseNumber(gradeForm.minSalary),
      maxSalary: parseNumber(gradeForm.maxSalary),
      description: gradeForm.description || null,
      status: gradeForm.status,
      createdDate: gradeForm.createdDate,
    }

    try {
      const response = await fetch(
        panel.record ? `${salaryGradesEndpoint}/${panel.record.id}` : salaryGradesEndpoint,
        {
          method: panel.record ? 'PUT' : 'POST',
          headers: authJsonHeaders,
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to save grade.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const data = result?.data

      if (data) {
        setSalaryGrades((current) =>
          panel.record ? current.map((grade) => (grade.id === data.id ? data : grade)) : [data, ...current],
        )
      }

      setNotice(panel.record ? 'Salary grade updated.' : 'Salary grade created.')
      closePanel()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleGradeDelete = async (gradeId) => {
    if (!window.confirm('Delete this salary grade?')) {
      return
    }

    try {
      const response = await fetch(`${salaryGradesEndpoint}/${gradeId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete grade.')
        throw new Error(errorMessage)
      }

      setSalaryGrades((current) => current.filter((grade) => grade.id !== gradeId))
      setNotice('Salary grade deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  const handleTemplateSave = async (event) => {
    event.preventDefault()
    setError('')

    const payload = {
      name: templateForm.name,
      basicSalary: parseNumber(templateForm.basicSalary),
      description: templateForm.description || null,
      status: templateForm.status,
      createdDate: templateForm.createdDate,
      earnings: templateForm.earnings.map((item) => ({
        name: item.name,
        amount: parseNumber(item.amount),
      })),
      deductions: templateForm.deductions.map((item) => ({
        name: item.name,
        amount: parseNumber(item.amount),
      })),
    }

    try {
      const response = await fetch(
        panel.record ? `${salaryTemplatesEndpoint}/${panel.record.id}` : salaryTemplatesEndpoint,
        {
          method: panel.record ? 'PUT' : 'POST',
          headers: authJsonHeaders,
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to save template.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const data = result?.data

      if (data) {
        setSalaryTemplates((current) =>
          panel.record
            ? current.map((template) => (template.id === data.id ? data : template))
            : [data, ...current],
        )
      }

      setNotice(panel.record ? 'Salary template updated.' : 'Salary template created.')
      closePanel()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleTemplateDelete = async (templateId) => {
    if (!window.confirm('Delete this salary template?')) {
      return
    }

    try {
      const response = await fetch(`${salaryTemplatesEndpoint}/${templateId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete template.')
        throw new Error(errorMessage)
      }

      setSalaryTemplates((current) => current.filter((template) => template.id !== templateId))
      setNotice('Salary template deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  const handleAssignSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!assignForm.employeeId) {
      setError('Please select an employee.')
      return
    }

    const payload = {
      employeeId: Number(assignForm.employeeId),
      salaryGradeId: assignForm.salaryGradeId ? Number(assignForm.salaryGradeId) : null,
      salaryTemplateId: assignForm.salaryTemplateId ? Number(assignForm.salaryTemplateId) : null,
      basicSalary: parseNumber(assignForm.basicSalary),
      allowancesTotal: parseNumber(assignForm.allowancesTotal),
      deductionsTotal: parseNumber(assignForm.deductionsTotal),
      netSalary: assignTotals,
      paymentFrequency: assignForm.paymentFrequency,
      effectiveDate: assignForm.effectiveDate,
      changeReason: assignForm.changeReason || null,
    }

    try {
      const response = await fetch(
        assignMode === 'edit' ? `${employeeSalariesEndpoint}/${assignForm.id}` : employeeSalariesEndpoint,
        {
          method: assignMode === 'edit' ? 'PUT' : 'POST',
          headers: authJsonHeaders,
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to save employee salary.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const data = result?.data

      if (data) {
        setEmployeeSalaries((current) =>
          assignMode === 'edit'
            ? current.map((salary) => (salary.id === data.id ? data : salary))
            : [data, ...current],
        )
      }

      setAssignForm(emptyAssignForm())
      setAssignMode('create')
      setNotice(assignMode === 'edit' ? 'Salary assignment updated.' : 'Salary assigned to employee.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleAssignEdit = (record) => {
    setAssignMode('edit')
    setAssignForm({
      id: record.id,
      employeeId: record.employeeId,
      salaryGradeId: record.salaryGradeId ?? '',
      salaryTemplateId: record.salaryTemplateId ?? '',
      basicSalary: record.basicSalary ?? '',
      allowancesTotal: record.allowancesTotal ?? '',
      deductionsTotal: record.deductionsTotal ?? '',
      paymentFrequency: record.paymentFrequency ?? 'Monthly',
      effectiveDate: record.effectiveDate ?? new Date().toISOString().slice(0, 10),
      changeReason: '',
    })
  }

  const handleAssignDelete = async (recordId) => {
    if (!window.confirm('Delete this salary assignment?')) {
      return
    }

    try {
      const response = await fetch(`${employeeSalariesEndpoint}/${recordId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete assignment.')
        throw new Error(errorMessage)
      }

      setEmployeeSalaries((current) => current.filter((salary) => salary.id !== recordId))
      setNotice('Salary assignment deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleTemplateSelection = (templateId) => {
    const template = salaryTemplates.find((item) => item.id === Number(templateId))
    if (!template) {
      return
    }

    setAssignForm((current) => ({
      ...current,
      salaryTemplateId: templateId,
      basicSalary: template.basicSalary ?? '',
      allowancesTotal: template.totalEarnings ?? '',
      deductionsTotal: template.totalDeductions ?? '',
    }))
  }
  const handleHistoryFilter = async () => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (historyFilters.employeeId) params.set('employeeId', historyFilters.employeeId)
    if (historyFilters.from) params.set('from', historyFilters.from)
    if (historyFilters.to) params.set('to', historyFilters.to)

    try {
      const response = await fetch(`${salaryHistoriesEndpoint}?${params.toString()}`, {
        headers: authHeaders,
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to load salary history.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      setSalaryHistories(payload?.data ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryExport = () => {
    const headers = [
      'Employee Name',
      'Employee ID',
      'Old Salary',
      'New Salary',
      'Change Reason',
      'Effective Date',
      'Updated By',
      'Created Date',
    ]

    const rows = salaryHistories.map((history) => [
      history.employeeName,
      history.employeeCode,
      history.oldSalary,
      history.newSalary,
      history.changeReason,
      history.effectiveDate,
      history.updatedBy,
      history.createdDate,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'salary-history.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleBulkSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const payload = {
      department: bulkForm.department || null,
      salaryGradeId: bulkForm.salaryGradeId ? Number(bulkForm.salaryGradeId) : null,
      increaseType: bulkForm.increaseType,
      increaseValue: parseNumber(bulkForm.increaseValue),
      effectiveDate: bulkForm.effectiveDate,
    }

    try {
      const response = await fetch(salaryBulkUpdatesEndpoint, {
        method: 'POST',
        headers: authJsonHeaders,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to apply bulk update.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const affected = result?.data?.affectedEmployees ?? 0

      setNotice(`Bulk update applied to ${affected} employees.`)

      const updatesResponse = await fetch(salaryBulkUpdatesEndpoint, { headers: authHeaders })
      if (updatesResponse.ok) {
        const updatesPayload = await updatesResponse.json()
        setBulkUpdates(updatesPayload?.data ?? [])
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  if (!['Salary Grades', 'Salary Templates', 'Assign Salary to Employee', 'Salary History', 'Bulk Salary Update'].includes(activeItem)) {
    return (
      <section className="focus-panel">
        <h2>{activeItem}</h2>
        <p>
          This module is ready for salary structure configuration. Choose one of the Salary Structure
          sub-modules to begin.
        </p>
      </section>
    )
  }

  return (
    <section className="focus-panel salary-structure">
      <header className="employee-header">
        <div>
          <h2>{activeItem}</h2>
          <p className="employee-subtitle">
            Manage salary grades, templates, employee assignments, and salary change history.
          </p>
        </div>
        <div className="employee-actions">
          {activeItem === 'Salary Grades' ? (
            <button type="button" className="action-btn primary" onClick={() => openPanel('grade')}>
              Add Salary Grade
            </button>
          ) : null}
          {activeItem === 'Salary Templates' ? (
            <button type="button" className="action-btn primary" onClick={() => openPanel('template')}>
              Create Template
            </button>
          ) : null}
        </div>
      </header>

      {notice ? <div className="employee-notice">{notice}</div> : null}
      {error ? <div className="employee-error">{error}</div> : null}
      {loading ? <div className="employee-loading">Loading salary data...</div> : null}

      {activeItem === 'Salary Grades' ? (
        <div className="table-wrap">
          <table className="summary-table employee-table">
            <thead>
              <tr>
                <th>Grade Name</th>
                <th>Grade Level</th>
                <th>Minimum Salary</th>
                <th>Maximum Salary</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salaryGrades.length === 0 ? (
                <tr>
                  <td className="empty-state" colSpan={7}>
                    No salary grades created yet.
                  </td>
                </tr>
              ) : (
                salaryGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.name}</td>
                    <td>{grade.level || '-'}</td>
                    <td>{currencyFormatter.format(grade.minSalary)}</td>
                    <td>{currencyFormatter.format(grade.maxSalary)}</td>
                    <td>
                      <span className={`pill status ${grade.status.toLowerCase()}`}>{grade.status}</span>
                    </td>
                    <td>{grade.createdDate}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => openPanel('grade', grade)}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => handleGradeDelete(grade.id)}>
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
      ) : null}

      {activeItem === 'Salary Templates' ? (
        <div className="table-wrap">
          <table className="summary-table employee-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Basic Salary</th>
                <th>Total Earnings</th>
                <th>Total Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salaryTemplates.length === 0 ? (
                <tr>
                  <td className="empty-state" colSpan={7}>
                    No salary templates created yet.
                  </td>
                </tr>
              ) : (
                salaryTemplates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{currencyFormatter.format(template.basicSalary)}</td>
                    <td>{currencyFormatter.format(template.totalEarnings)}</td>
                    <td>{currencyFormatter.format(template.totalDeductions)}</td>
                    <td>{currencyFormatter.format(template.netSalary)}</td>
                    <td>
                      <span className={`pill status ${template.status.toLowerCase()}`}>{template.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => openPanel('template', template)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleTemplateDelete(template.id)}
                        >
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
      ) : null}

      {activeItem === 'Assign Salary to Employee' ? (
        <section className="salary-form-section">
          <form className="modal-form grid-form" onSubmit={handleAssignSubmit}>
            <label>
              Employee Name
              <select
                value={assignForm.employeeId}
                onChange={(event) => setAssignForm((current) => ({ ...current, employeeId: event.target.value }))}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Salary Grade
              <select
                value={assignForm.salaryGradeId}
                onChange={(event) => setAssignForm((current) => ({ ...current, salaryGradeId: event.target.value }))}
              >
                <option value="">Select grade</option>
                {gradeOptions.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Salary Template
              <select
                value={assignForm.salaryTemplateId}
                onChange={(event) => handleTemplateSelection(event.target.value)}
              >
                <option value="">Select template</option>
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Basic Salary
              <input
                value={assignForm.basicSalary}
                onChange={(event) => setAssignForm((current) => ({ ...current, basicSalary: event.target.value }))}
              />
            </label>
            <label>
              Allowances
              <input
                value={assignForm.allowancesTotal}
                onChange={(event) =>
                  setAssignForm((current) => ({ ...current, allowancesTotal: event.target.value }))
                }
              />
            </label>
            <label>
              Deductions
              <input
                value={assignForm.deductionsTotal}
                onChange={(event) =>
                  setAssignForm((current) => ({ ...current, deductionsTotal: event.target.value }))
                }
              />
            </label>
            <label>
              Net Salary
              <input value={assignTotals} readOnly />
            </label>
            <label>
              Effective Date
              <input
                type="date"
                value={assignForm.effectiveDate}
                onChange={(event) => setAssignForm((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </label>
            <label>
              Payment Frequency
              <select
                value={assignForm.paymentFrequency}
                onChange={(event) => setAssignForm((current) => ({ ...current, paymentFrequency: event.target.value }))}
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </label>
            <label>
              Change Reason
              <input
                value={assignForm.changeReason}
                onChange={(event) => setAssignForm((current) => ({ ...current, changeReason: event.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="submit" className="action-btn primary">
                {assignMode === 'edit' ? 'Update Salary' : 'Assign Salary'}
              </button>
              {assignMode === 'edit' ? (
                <button
                  type="button"
                  className="action-btn ghost"
                  onClick={() => {
                    setAssignMode('create')
                    setAssignForm(emptyAssignForm())
                  }}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="table-wrap">
            <table className="summary-table employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Grade</th>
                  <th>Template</th>
                  <th>Net Salary</th>
                  <th>Effective Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employeeSalaries.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan={6}>
                      No salary assignments yet.
                    </td>
                  </tr>
                ) : (
                  employeeSalaries.map((salary) => (
                    <tr key={salary.id}>
                      <td>{salary.employeeName}</td>
                      <td>{salary.salaryGradeName || '-'}</td>
                      <td>{salary.salaryTemplateName || '-'}</td>
                      <td>{currencyFormatter.format(salary.netSalary)}</td>
                      <td>{salary.effectiveDate}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => handleAssignEdit(salary)}>
                            Edit
                          </button>
                          <button type="button" className="danger" onClick={() => handleAssignDelete(salary.id)}>
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
        </section>
      ) : null}
      {activeItem === 'Salary History' ? (
        <section className="salary-form-section">
          <div className="employee-filters">
            <label>
              Employee
              <select
                value={historyFilters.employeeId}
                onChange={(event) =>
                  setHistoryFilters((current) => ({ ...current, employeeId: event.target.value }))
                }
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From
              <input
                type="date"
                value={historyFilters.from}
                onChange={(event) => setHistoryFilters((current) => ({ ...current, from: event.target.value }))}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={historyFilters.to}
                onChange={(event) => setHistoryFilters((current) => ({ ...current, to: event.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="action-btn primary" onClick={handleHistoryFilter}>
                Apply Filters
              </button>
              <button type="button" className="action-btn ghost" onClick={handleHistoryExport}>
                Export History
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="summary-table employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Old Salary</th>
                  <th>New Salary</th>
                  <th>Change Reason</th>
                  <th>Effective Date</th>
                  <th>Updated By</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistories.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan={7}>
                      No salary history available yet.
                    </td>
                  </tr>
                ) : (
                  salaryHistories.map((history) => (
                    <tr key={history.id}>
                      <td>{history.employeeName}</td>
                      <td>{history.oldSalary ? currencyFormatter.format(history.oldSalary) : '-'}</td>
                      <td>{currencyFormatter.format(history.newSalary)}</td>
                      <td>{history.changeReason || '-'}</td>
                      <td>{history.effectiveDate || '-'}</td>
                      <td>{history.updatedBy || '-'}</td>
                      <td>{history.createdDate || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeItem === 'Bulk Salary Update' ? (
        <section className="salary-form-section">
          <form className="modal-form grid-form" onSubmit={handleBulkSubmit}>
            <label>
              Department
              <select
                value={bulkForm.department}
                onChange={(event) => setBulkForm((current) => ({ ...current, department: event.target.value }))}
              >
                <option value="">All Departments</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Salary Grade
              <select
                value={bulkForm.salaryGradeId}
                onChange={(event) => setBulkForm((current) => ({ ...current, salaryGradeId: event.target.value }))}
              >
                <option value="">All Grades</option>
                {gradeOptions.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Increase Type
              <select
                value={bulkForm.increaseType}
                onChange={(event) => setBulkForm((current) => ({ ...current, increaseType: event.target.value }))}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            <label>
              Increase Value
              <input
                value={bulkForm.increaseValue}
                onChange={(event) => setBulkForm((current) => ({ ...current, increaseValue: event.target.value }))}
              />
            </label>
            <label>
              Effective Date
              <input
                type="date"
                value={bulkForm.effectiveDate}
                onChange={(event) => setBulkForm((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="submit" className="action-btn primary">
                Apply Bulk Update
              </button>
            </div>
          </form>

          <div className="table-wrap">
            <table className="summary-table employee-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Salary Grade</th>
                  <th>Increase Type</th>
                  <th>Increase Value</th>
                  <th>Effective Date</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {bulkUpdates.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan={6}>
                      No bulk updates applied yet.
                    </td>
                  </tr>
                ) : (
                  bulkUpdates.map((update) => (
                    <tr key={update.id}>
                      <td>{update.department || 'All Departments'}</td>
                      <td>{update.salaryGradeName || 'All Grades'}</td>
                      <td>{update.increaseType}</td>
                      <td>
                        {update.increaseType === 'percentage'
                          ? `${update.increaseValue}%`
                          : currencyFormatter.format(update.increaseValue)}
                      </td>
                      <td>{update.effectiveDate}</td>
                      <td>{update.createdDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {panel.mode === 'grade' ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{panel.record ? 'Edit Salary Grade' : 'Add Salary Grade'}</h3>
              <button type="button" className="modal-close" onClick={closePanel}>
                Close
              </button>
            </div>
            <form className="modal-form grid-form" onSubmit={handleGradeSave}>
              <label>
                Grade Name
                <input
                  value={gradeForm.name}
                  onChange={(event) => setGradeForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Grade Level
                <input
                  value={gradeForm.level}
                  onChange={(event) => setGradeForm((current) => ({ ...current, level: event.target.value }))}
                />
              </label>
              <label>
                Minimum Salary
                <input
                  value={gradeForm.minSalary}
                  onChange={(event) => setGradeForm((current) => ({ ...current, minSalary: event.target.value }))}
                />
              </label>
              <label>
                Maximum Salary
                <input
                  value={gradeForm.maxSalary}
                  onChange={(event) => setGradeForm((current) => ({ ...current, maxSalary: event.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={gradeForm.status}
                  onChange={(event) => setGradeForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label>
                Created Date
                <input
                  type="date"
                  value={gradeForm.createdDate}
                  onChange={(event) => setGradeForm((current) => ({ ...current, createdDate: event.target.value }))}
                />
              </label>
              <label>
                Description
                <input
                  value={gradeForm.description}
                  onChange={(event) => setGradeForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="action-btn primary">
                  {panel.record ? 'Save Grade' : 'Create Grade'}
                </button>
                <button type="button" className="action-btn ghost" onClick={closePanel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {panel.mode === 'template' ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{panel.record ? 'Edit Salary Template' : 'Create Salary Template'}</h3>
              <button type="button" className="modal-close" onClick={closePanel}>
                Close
              </button>
            </div>
            <form className="modal-form" onSubmit={handleTemplateSave}>
              <div className="modal-form grid-form">
                <label>
                  Template Name
                  <input
                    value={templateForm.name}
                    onChange={(event) =>
                      setTemplateForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Basic Salary
                  <input
                    value={templateForm.basicSalary}
                    onChange={(event) =>
                      setTemplateForm((current) => ({ ...current, basicSalary: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Status
                  <select
                    value={templateForm.status}
                    onChange={(event) =>
                      setTemplateForm((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  Created Date
                  <input
                    type="date"
                    value={templateForm.createdDate}
                    onChange={(event) =>
                      setTemplateForm((current) => ({ ...current, createdDate: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="salary-template-grid">
                <article>
                  <h4>Earnings</h4>
                  {templateForm.earnings.map((item, index) => (
                    <label key={item.name}>
                      {item.name}
                      <input
                        value={item.amount}
                        onChange={(event) => {
                          const value = event.target.value
                          setTemplateForm((current) => ({
                            ...current,
                            earnings: current.earnings.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, amount: value } : entry,
                            ),
                          }))
                        }}
                      />
                    </label>
                  ))}
                </article>
                <article>
                  <h4>Deductions</h4>
                  {templateForm.deductions.map((item, index) => (
                    <label key={item.name}>
                      {item.name}
                      <input
                        value={item.amount}
                        onChange={(event) => {
                          const value = event.target.value
                          setTemplateForm((current) => ({
                            ...current,
                            deductions: current.deductions.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, amount: value } : entry,
                            ),
                          }))
                        }}
                      />
                    </label>
                  ))}
                </article>
              </div>

              <div className="salary-template-summary">
                <span>Total Earnings: {currencyFormatter.format(templateTotals.earnings)}</span>
                <span>Total Deductions: {currencyFormatter.format(templateTotals.deductions)}</span>
                <span>Net Salary: {currencyFormatter.format(templateTotals.net)}</span>
              </div>

              <label>
                Description
                <input
                  value={templateForm.description}
                  onChange={(event) =>
                    setTemplateForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>

              <div className="modal-actions">
                <button type="submit" className="action-btn primary">
                  {panel.record ? 'Save Template' : 'Create Template'}
                </button>
                <button type="button" className="action-btn ghost" onClick={closePanel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default SalaryStructurePage
