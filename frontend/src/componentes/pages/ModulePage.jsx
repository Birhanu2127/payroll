import { useEffect, useMemo, useState } from 'react'

const buildOptionList = (employees, key) =>
  Array.from(new Set(employees.map((employee) => employee[key]))).sort((a, b) =>
    a.localeCompare(b),
  )

const emptyEmployeeForm = () => {
  const today = new Date().toISOString().slice(0, 10)

  return {
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employmentType: 'Full-time',
    joinDate: today,
    status: 'Active',
    attendance: 'On Track',
    gender: '',
    dateOfBirth: '',
    address: '',
    manager: '',
    role: 'Employee',
    createdDate: today,
  }
}

const normalizeHeader = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const headerMap = {
  name: 'name',
  employeename: 'name',
  employeeid: 'employeeId',
  empid: 'employeeId',
  email: 'email',
  phone: 'phone',
  phonenumber: 'phone',
  department: 'department',
  position: 'position',
  jobposition: 'position',
  employmenttype: 'employmentType',
  joindate: 'joinDate',
  joiningdate: 'joinDate',
  status: 'status',
  employmentstatus: 'status',
  attendance: 'attendance',
  attendancestatus: 'attendance',
  gender: 'gender',
  dateofbirth: 'dateOfBirth',
  dob: 'dateOfBirth',
  address: 'address',
  manager: 'manager',
  supervisor: 'manager',
  role: 'role',
  createddate: 'createdDate',
}

const parseCsvLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      const nextChar = line[i + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
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

const buildEmployeePayload = (state) => {
  const payload = {
    name: state.name,
    employeeId: state.employeeId,
    email: state.email,
    phone: state.phone,
    department: state.department,
    position: state.position,
    employmentType: state.employmentType,
    joinDate: state.joinDate,
    status: state.status,
    attendance: state.attendance,
    gender: state.gender,
    dateOfBirth: state.dateOfBirth,
    address: state.address,
    manager: state.manager,
    role: state.role,
    createdDate: state.createdDate,
    avatarHue: state.avatarHue,
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === '') {
      payload[key] = null
    }

    if (payload[key] === undefined) {
      delete payload[key]
    }
  })

  return payload
}

const EmployeeAvatar = ({ name, hue }) => {
  const safeName = name?.trim() || 'New Employee'
  const initials = safeName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const hueNumber = Number(hue)
  const resolvedHue = Number.isFinite(hueNumber) ? hueNumber : 160

  return (
    <div className="employee-avatar" style={{ '--avatar-hue': resolvedHue }}>
      {initials}
    </div>
  )
}

function ModulePage({ activeItem, employeesEndpoint, authToken }) {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [panel, setPanel] = useState({ mode: null, employee: null })
  const [formState, setFormState] = useState(() => emptyEmployeeForm())
  const [transferState, setTransferState] = useState({
    department: '',
    position: '',
    manager: '',
  })
  const [importFile, setImportFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    status: '',
    employmentType: '',
    joinFrom: '',
    joinTo: '',
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

  const departments = useMemo(() => buildOptionList(employees, 'department'), [employees])
  const positions = useMemo(() => buildOptionList(employees, 'position'), [employees])
  const statuses = useMemo(() => buildOptionList(employees, 'status'), [employees])
  const employmentTypes = useMemo(() => buildOptionList(employees, 'employmentType'), [employees])

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const joinFrom = filters.joinFrom ? new Date(filters.joinFrom) : null
    const joinTo = filters.joinTo ? new Date(filters.joinTo) : null

    return employees.filter((employee) => {
      const nameMatch = normalizedSearch
        ? employee.name.toLowerCase().includes(normalizedSearch)
        : true
      const departmentMatch = filters.department ? employee.department === filters.department : true
      const positionMatch = filters.position ? employee.position === filters.position : true
      const statusMatch = filters.status ? employee.status === filters.status : true
      const employmentTypeMatch = filters.employmentType
        ? employee.employmentType === filters.employmentType
        : true
      const joinDate = employee.joinDate ? new Date(employee.joinDate) : null
      const joinFromMatch = joinFrom ? (joinDate ? joinDate >= joinFrom : false) : true
      const joinToMatch = joinTo ? (joinDate ? joinDate <= joinTo : false) : true

      return (
        nameMatch &&
        departmentMatch &&
        positionMatch &&
        statusMatch &&
        employmentTypeMatch &&
        joinFromMatch &&
        joinToMatch
      )
    })
  }, [employees, filters, searchQuery])

  useEffect(() => {
    if (activeItem !== 'All Employees') {
      return
    }

    if (!authToken) {
      setEmployees([])
      setSelectedEmployee(null)
      setError('Authentication required to view employees.')
      return
    }

    let isMounted = true

    const loadEmployees = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(employeesEndpoint, {
          headers: authHeaders,
        })

        if (!response.ok) {
          const errorMessage = await parseApiError(response, 'Failed to load employees.')
          throw new Error(errorMessage)
        }

        const payload = await response.json()
        const data = Array.isArray(payload?.data) ? payload.data : []

        if (!isMounted) {
          return
        }

        setEmployees(data)
        setSelectedEmployee((current) => {
          if (!data.length) {
            return null
          }

          if (!current) {
            return data[0]
          }

          return data.find((employee) => employee.id === current.id) ?? data[0]
        })
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setEmployees([])
        setSelectedEmployee(null)
        setError(requestError.message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadEmployees()

    return () => {
      isMounted = false
    }
  }, [activeItem, authHeaders, employeesEndpoint])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handleDeactivate = async (employeeId) => {
    const target = employees.find((employee) => employee.id === employeeId)
    if (!target) {
      return
    }

    try {
      const response = await fetch(`${employeesEndpoint}/${employeeId}`, {
        method: 'PATCH',
        headers: authJsonHeaders,
        body: JSON.stringify({
          status: target.status === 'Active' ? 'Inactive' : 'Active',
        }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to update status.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data

      if (updated) {
        setEmployees((current) =>
          current.map((employee) => (employee.id === updated.id ? updated : employee)),
        )
        setSelectedEmployee((current) =>
          current ? (current.id === updated.id ? updated : current) : null,
        )
      }

      setNotice('Employee status updated.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDelete = async (employeeId) => {
    const confirmDelete = window.confirm('Delete this employee record? This cannot be undone.')
    if (!confirmDelete) {
      return
    }

    try {
      const response = await fetch(`${employeesEndpoint}/${employeeId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete employee.')
        throw new Error(errorMessage)
      }

      setEmployees((current) => {
        const next = current.filter((employee) => employee.id !== employeeId)
        setSelectedEmployee((currentSelected) => {
          if (!currentSelected || currentSelected.id !== employeeId) {
            return currentSelected
          }
          return next[0] ?? null
        })
        return next
      })
      setNotice('Employee record deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const openPanel = (mode, employee = null) => {
    setNotice('')
    setError('')
    setFormError('')
    setPanel({ mode, employee })

    if (mode === 'add') {
      setFormState(emptyEmployeeForm())
    }

    if (mode === 'edit' && employee) {
      setFormState({
        name: employee.name,
        employeeId: employee.employeeId,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        employmentType: employee.employmentType,
        joinDate: employee.joinDate,
        status: employee.status,
        attendance: employee.attendance,
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth,
        address: employee.address,
        manager: employee.manager,
        role: employee.role,
        createdDate: employee.createdDate,
      })
    }

    if (mode === 'transfer' && employee) {
      setTransferState({
        department: employee.department,
        position: employee.position,
        manager: employee.manager,
      })
    }
  }

  const closePanel = () => {
    setPanel({ mode: null, employee: null })
    setImportFile(null)
    setFormError('')
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  const handleTransferChange = (event) => {
    const { name, value } = event.target
    setTransferState((current) => ({ ...current, [name]: value }))
  }

  const handleAddEmployee = async (event) => {
    event.preventDefault()
    setFormError('')
    setError('')

    if (!formState.name || !formState.employeeId || !formState.department || !formState.position) {
      setFormError('Please complete name, employee ID, department, and position.')
      return
    }

    try {
      const response = await fetch(employeesEndpoint, {
        method: 'POST',
        headers: authJsonHeaders,
        body: JSON.stringify(buildEmployeePayload(formState)),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to add employee.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const created = payload?.data

      if (created) {
        setEmployees((current) => [created, ...current])
        setSelectedEmployee(created)
      }

      setNotice('Employee added successfully.')
      closePanel()
    } catch (requestError) {
      setFormError(requestError.message)
    }
  }

  const handleEditEmployee = async (event) => {
    event.preventDefault()
    setFormError('')
    setError('')

    if (!panel.employee) {
      return
    }

    if (!formState.name || !formState.employeeId || !formState.department || !formState.position) {
      setFormError('Please complete name, employee ID, department, and position.')
      return
    }

    try {
      const response = await fetch(`${employeesEndpoint}/${panel.employee.id}`, {
        method: 'PUT',
        headers: authJsonHeaders,
        body: JSON.stringify(buildEmployeePayload(formState)),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to update employee.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data

      if (updated) {
        setEmployees((current) =>
          current.map((employee) => (employee.id === updated.id ? updated : employee)),
        )
        setSelectedEmployee((currentSelected) =>
          currentSelected ? (currentSelected.id === updated.id ? updated : currentSelected) : null,
        )
      }

      setNotice('Employee record updated.')
      closePanel()
    } catch (requestError) {
      setFormError(requestError.message)
    }
  }

  const handleTransferEmployee = async (event) => {
    event.preventDefault()
    setFormError('')
    setError('')

    if (!panel.employee) {
      return
    }

    if (!transferState.department || !transferState.position) {
      setFormError('Department and position are required for a transfer.')
      return
    }

    try {
      const response = await fetch(`${employeesEndpoint}/${panel.employee.id}`, {
        method: 'PATCH',
        headers: authJsonHeaders,
        body: JSON.stringify({
          department: transferState.department,
          position: transferState.position,
          manager: transferState.manager,
        }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to transfer employee.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data

      if (updated) {
        setEmployees((current) =>
          current.map((employee) => (employee.id === updated.id ? updated : employee)),
        )
        setSelectedEmployee((currentSelected) =>
          currentSelected ? (currentSelected.id === updated.id ? updated : currentSelected) : null,
        )
      }

      setNotice('Employee transfer saved.')
      closePanel()
    } catch (requestError) {
      setFormError(requestError.message)
    }
  }

  const handleExport = () => {
    const headers = [
      'Employee Name',
      'Employee ID',
      'Email',
      'Phone Number',
      'Department',
      'Position',
      'Employment Type',
      'Join Date',
      'Status',
      'Attendance Status',
      'Gender',
      'Date of Birth',
      'Address',
      'Manager',
      'Role',
      'Created Date',
    ]

    const rows = employees.map((employee) => [
      employee.name,
      employee.employeeId,
      employee.email,
      employee.phone,
      employee.department,
      employee.position,
      employee.employmentType,
      employee.joinDate,
      employee.status,
      employee.attendance,
      employee.gender,
      employee.dateOfBirth,
      employee.address,
      employee.manager,
      employee.role,
      employee.createdDate,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'employees.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setNotice('Employee list exported.')
  }

  const handleImport = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!importFile) {
      setFormError('Please choose a CSV file to import.')
      return
    }

    const text = await importFile.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)

    if (lines.length < 2) {
      setFormError('CSV file must include a header row and at least one employee.')
      return
    }

    const headers = parseCsvLine(lines[0]).map((header) => headerMap[normalizeHeader(header)])
    const hasName = headers.includes('name')
    const hasEmployeeId = headers.includes('employeeId')

    if (!hasName || !hasEmployeeId) {
      setFormError('CSV headers must include Employee Name and Employee ID.')
      return
    }

    const imported = lines.slice(1).map((line) => {
      const values = parseCsvLine(line)
      const record = { ...emptyEmployeeForm() }

      headers.forEach((key, index) => {
        if (!key) {
          return
        }
        record[key] = values[index] ?? ''
      })

      return record
    })

    let successCount = 0
    let failureCount = 0
    const createdEmployees = []

    for (const record of imported) {
      try {
        const response = await fetch(employeesEndpoint, {
          method: 'POST',
          headers: authJsonHeaders,
          body: JSON.stringify(buildEmployeePayload(record)),
        })

        if (!response.ok) {
          failureCount += 1
          continue
        }

        const payload = await response.json()
        if (payload?.data) {
          createdEmployees.push(payload.data)
          successCount += 1
        }
      } catch {
        failureCount += 1
      }
    }

    if (createdEmployees.length > 0) {
      setEmployees((current) => [...createdEmployees, ...current])
    }

    if (successCount > 0) {
      setNotice(
        `Imported ${successCount} employees${failureCount ? ` (${failureCount} failed)` : ''}.`,
      )
      closePanel()
    } else {
      setFormError('Import failed. Please review the CSV data and try again.')
    }
  }

  if (activeItem !== 'All Employees') {
    return (
      <section className="focus-panel">
        <h2>{activeItem}</h2>
        <p>
          This module can now be connected to dedicated Laravel API endpoints. The Dashboard module
          already includes working Overview, Analytics, Summary, and Notifications data.
        </p>
      </section>
    )
  }

  return (
    <section className="focus-panel employee-page">
      <div className="employee-header">
        <div>
          <h2>Employee List</h2>
          <p className="employee-subtitle">
            Search, filter, and manage employee records across departments and employment types.
          </p>
        </div>
        <div className="employee-actions">
          <button type="button" className="action-btn primary" onClick={() => openPanel('add')}>
            Add Employee
          </button>
          <button type="button" className="action-btn" onClick={() => openPanel('import')}>
            Import Employees
          </button>
          <button type="button" className="action-btn ghost" onClick={handleExport}>
            Export Employees
          </button>
        </div>
      </div>

      <div className="employee-filters">
        <label>
          Search Employee Name
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name"
          />
        </label>
        <label>
          Department
          <select name="department" value={filters.department} onChange={handleFilterChange}>
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label>
          Position
          <select name="position" value={filters.position} onChange={handleFilterChange}>
            <option value="">All Positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Employment Type
          <select
            name="employmentType"
            value={filters.employmentType}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {employmentTypes.map((employmentType) => (
              <option key={employmentType} value={employmentType}>
                {employmentType}
              </option>
            ))}
          </select>
        </label>
        <label>
          Join Date From
          <input
            type="date"
            name="joinFrom"
            value={filters.joinFrom}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          Join Date To
          <input
            type="date"
            name="joinTo"
            value={filters.joinTo}
            onChange={handleFilterChange}
          />
        </label>
      </div>

      {notice ? <div className="employee-notice">{notice}</div> : null}
      {error ? <div className="employee-error">{error}</div> : null}
      {loading ? <div className="employee-loading">Loading employees...</div> : null}

      <div className="employee-meta">
        Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong>{' '}
        employees
      </div>

      <div className="table-wrap">
        <table className="summary-table employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Photo</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Department</th>
              <th>Position</th>
              <th>Employment Type</th>
              <th>Attendance</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="empty-state" colSpan={13}>
                  Loading employees...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td className="empty-state" colSpan={13}>
                  {employees.length === 0
                    ? 'No employees found yet.'
                    : 'No employees match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.employeeId}>
                  <td>{employee.id}</td>
                  <td>
                    <EmployeeAvatar name={employee.name} hue={employee.avatarHue} />
                  </td>
                  <td>{employee.name}</td>
                  <td>{employee.employeeId}</td>
                  <td>{employee.email}</td>
                  <td>{employee.phone}</td>
                  <td>{employee.department}</td>
                  <td>{employee.position}</td>
                  <td>{employee.employmentType}</td>
                  <td>
                    <span
                      className={`pill attendance ${
                        employee.attendance
                          ? employee.attendance.toLowerCase().replace(' ', '-')
                          : 'unknown'
                      }`}
                    >
                      {employee.attendance || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`pill status ${
                        employee.status ? employee.status.toLowerCase() : 'inactive'
                      }`}
                    >
                      {employee.status || 'Inactive'}
                    </span>
                  </td>
                  <td>{employee.joinDate}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => setSelectedEmployee(employee)}>
                        View
                      </button>
                      <button type="button" onClick={() => openPanel('edit', employee)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => openPanel('transfer', employee)}>
                        Transfer
                      </button>
                      <button type="button" onClick={() => handleDeactivate(employee.id)}>
                        {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(employee.id)}>
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

      <section className="employee-profile">
        {selectedEmployee ? (
          <>
            <header className="employee-profile-header">
              <EmployeeAvatar name={selectedEmployee.name} hue={selectedEmployee.avatarHue} />
              <div>
                <h3>{selectedEmployee.name}</h3>
                <p>
                  {selectedEmployee.position} - {selectedEmployee.department}
                </p>
              </div>
              <span
                className={`pill status ${
                  selectedEmployee.status ? selectedEmployee.status.toLowerCase() : 'inactive'
                }`}
              >
                {selectedEmployee.status || 'Inactive'}
              </span>
            </header>

            <div className="profile-grid">
              <article className="profile-card">
                <h4>Personal Information</h4>
                <dl>
                  <div>
                    <dt>Full Name</dt>
                    <dd>{selectedEmployee.name}</dd>
                  </div>
                  <div>
                    <dt>Gender</dt>
                    <dd>{selectedEmployee.gender || '-'}</dd>
                  </div>
                  <div>
                    <dt>Date of Birth</dt>
                    <dd>{selectedEmployee.dateOfBirth || '-'}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{selectedEmployee.address || '-'}</dd>
                  </div>
                  <div>
                    <dt>Phone Number</dt>
                    <dd>{selectedEmployee.phone || '-'}</dd>
                  </div>
                </dl>
              </article>

              <article className="profile-card">
                <h4>Work Information</h4>
                <dl>
                  <div>
                    <dt>Employee ID</dt>
                    <dd>{selectedEmployee.employeeId}</dd>
                  </div>
                  <div>
                    <dt>Department</dt>
                    <dd>{selectedEmployee.department}</dd>
                  </div>
                  <div>
                    <dt>Position</dt>
                    <dd>{selectedEmployee.position}</dd>
                  </div>
                  <div>
                    <dt>Manager / Supervisor</dt>
                    <dd>{selectedEmployee.manager || '-'}</dd>
                  </div>
                  <div>
                    <dt>Joining Date</dt>
                    <dd>{selectedEmployee.joinDate || '-'}</dd>
                  </div>
                </dl>
              </article>

              <article className="profile-card">
                <h4>System Information</h4>
                <dl>
                  <div>
                    <dt>Role</dt>
                    <dd>{selectedEmployee.role || '-'}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{selectedEmployee.status || '-'}</dd>
                  </div>
                  <div>
                    <dt>Created Date</dt>
                    <dd>{selectedEmployee.createdDate || '-'}</dd>
                  </div>
                  <div>
                    <dt>Employment Type</dt>
                    <dd>{selectedEmployee.employmentType || '-'}</dd>
                  </div>
                  <div>
                    <dt>Attendance Status</dt>
                    <dd>{selectedEmployee.attendance || '-'}</dd>
                  </div>
                </dl>
              </article>

              <article className="profile-card">
                <h4>Additional Features (Recommended)</h4>
                <ul className="feature-list">
                  <li>Employee Transfer History</li>
                  <li>Attendance Summary</li>
                  <li>Leave Balance</li>
                  <li>Payroll Information</li>
                  <li>Documents: Contract, ID, Certificates</li>
                </ul>
              </article>
            </div>
          </>
        ) : (
          <div className="employee-empty">
            <p>Select an employee row and click View to preview full profile details.</p>
          </div>
        )}
      </section>

      {panel.mode ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {panel.mode === 'add' && 'Add Employee'}
                {panel.mode === 'edit' && 'Edit Employee'}
                {panel.mode === 'transfer' && 'Transfer Employee'}
                {panel.mode === 'import' && 'Import Employees'}
              </h3>
              <button type="button" className="modal-close" onClick={closePanel}>
                Close
              </button>
            </div>

            {panel.mode === 'import' ? (
              <form className="modal-form" onSubmit={handleImport}>
                <p className="modal-hint">
                  Upload a CSV file with columns like Employee Name, Employee ID, Department, and Position.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                />
                {formError ? <p className="form-error">{formError}</p> : null}
                <div className="modal-actions">
                  <button type="submit" className="action-btn primary">
                    Import
                  </button>
                  <button type="button" className="action-btn ghost" onClick={closePanel}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {panel.mode === 'transfer' ? (
              <form className="modal-form" onSubmit={handleTransferEmployee}>
                <label>
                  Department
                  <input
                    type="text"
                    name="department"
                    value={transferState.department}
                    onChange={handleTransferChange}
                  />
                </label>
                <label>
                  Position
                  <input
                    type="text"
                    name="position"
                    value={transferState.position}
                    onChange={handleTransferChange}
                  />
                </label>
                <label>
                  Manager / Supervisor
                  <input
                    type="text"
                    name="manager"
                    value={transferState.manager}
                    onChange={handleTransferChange}
                  />
                </label>
                {formError ? <p className="form-error">{formError}</p> : null}
                <div className="modal-actions">
                  <button type="submit" className="action-btn primary">
                    Save Transfer
                  </button>
                  <button type="button" className="action-btn ghost" onClick={closePanel}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {panel.mode === 'add' || panel.mode === 'edit' ? (
              <form
                className="modal-form grid-form"
                onSubmit={panel.mode === 'add' ? handleAddEmployee : handleEditEmployee}
              >
                <label>
                  Employee Name
                  <input name="name" value={formState.name} onChange={handleFormChange} />
                </label>
                <label>
                  Employee ID
                  <input name="employeeId" value={formState.employeeId} onChange={handleFormChange} />
                </label>
                <label>
                  Email
                  <input name="email" value={formState.email} onChange={handleFormChange} />
                </label>
                <label>
                  Phone Number
                  <input name="phone" value={formState.phone} onChange={handleFormChange} />
                </label>
                <label>
                  Department
                  <input name="department" value={formState.department} onChange={handleFormChange} />
                </label>
                <label>
                  Position
                  <input name="position" value={formState.position} onChange={handleFormChange} />
                </label>
                <label>
                  Employment Type
                  <select
                    name="employmentType"
                    value={formState.employmentType}
                    onChange={handleFormChange}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </label>
                <label>
                  Join Date
                  <input type="date" name="joinDate" value={formState.joinDate} onChange={handleFormChange} />
                </label>
                <label>
                  Status
                  <select name="status" value={formState.status} onChange={handleFormChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  Attendance Status
                  <input name="attendance" value={formState.attendance} onChange={handleFormChange} />
                </label>
                <label>
                  Gender
                  <input name="gender" value={formState.gender} onChange={handleFormChange} />
                </label>
                <label>
                  Date of Birth
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formState.dateOfBirth}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  Address
                  <input name="address" value={formState.address} onChange={handleFormChange} />
                </label>
                <label>
                  Manager / Supervisor
                  <input name="manager" value={formState.manager} onChange={handleFormChange} />
                </label>
                <label>
                  Role
                  <select name="role" value={formState.role} onChange={handleFormChange}>
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
                <label>
                  Created Date
                  <input
                    type="date"
                    name="createdDate"
                    value={formState.createdDate}
                    onChange={handleFormChange}
                  />
                </label>
                {formError ? <p className="form-error">{formError}</p> : null}
                <div className="modal-actions">
                  <button type="submit" className="action-btn primary">
                    {panel.mode === 'add' ? 'Add Employee' : 'Save Changes'}
                  </button>
                  <button type="button" className="action-btn ghost" onClick={closePanel}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ModulePage
