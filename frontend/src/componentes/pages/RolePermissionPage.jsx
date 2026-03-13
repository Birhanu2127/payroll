import { useEffect, useMemo, useState } from 'react'

const emptyRoleForm = () => ({
  id: null,
  name: '',
  description: '',
  level: '',
  status: 'Active',
})

const emptyUserForm = () => ({
  id: null,
  name: '',
  employeeName: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  status: 'Active',
  password: '',
})

const emptyLogFilters = () => ({
  userId: '',
  module: '',
  from: '',
  to: '',
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

function RolePermissionPage({ activeItem, authToken, rolesEndpoint, permissionsEndpoint, usersEndpoint, logsEndpoint }) {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [rolePermissions, setRolePermissions] = useState(new Set())
  const [roleForm, setRoleForm] = useState(() => emptyRoleForm())
  const [userForm, setUserForm] = useState(() => emptyUserForm())
  const [logFilters, setLogFilters] = useState(() => emptyLogFilters())
  const [panel, setPanel] = useState({ mode: null })
  const [loading, setLoading] = useState(false)
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

  const permissionsByModule = useMemo(() => {
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push(permission)
      return acc
    }, {})

    Object.keys(grouped).forEach((module) => {
      grouped[module].sort((a, b) => a.label.localeCompare(b.label))
    })

    return grouped
  }, [permissions])

  useEffect(() => {
    if (!authToken) {
      return
    }

    if (!['Manage Roles', 'Assign Permissions', 'User Accounts', 'Activity Logs'].includes(activeItem)) {
      return
    }

    setLoading(true)
    setNotice('')
    setError('')

    const loadData = async () => {
      try {
        const requests = []

        if (activeItem === 'Manage Roles' || activeItem === 'Assign Permissions' || activeItem === 'User Accounts') {
          requests.push(fetch(rolesEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Assign Permissions') {
          requests.push(fetch(permissionsEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'User Accounts') {
          requests.push(fetch(usersEndpoint, { headers: authHeaders }))
        }

        if (activeItem === 'Activity Logs') {
          requests.push(fetch(logsEndpoint, { headers: authHeaders }))
          requests.push(fetch(usersEndpoint, { headers: authHeaders }))
        }

        const responses = await Promise.all(requests)
        const payloads = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              const errorMessage = await parseApiError(response, 'Failed to load role and permission data.')
              throw new Error(errorMessage)
            }
            return response.json()
          }),
        )

        let cursor = 0

        if (activeItem === 'Manage Roles' || activeItem === 'Assign Permissions' || activeItem === 'User Accounts') {
          const rolePayload = payloads[cursor]
          cursor += 1
          setRoles(rolePayload?.data ?? [])
        }

        if (activeItem === 'Assign Permissions') {
          const permissionsPayload = payloads[cursor]
          cursor += 1
          setPermissions(permissionsPayload?.data ?? [])
        }

        if (activeItem === 'User Accounts') {
          const usersPayload = payloads[cursor]
          cursor += 1
          setUsers(usersPayload?.data ?? [])
        }

        if (activeItem === 'Activity Logs') {
          const logsPayload = payloads[cursor]
          const usersPayload = payloads[cursor + 1]
          setLogs(logsPayload?.data ?? [])
          setUsers(usersPayload?.data ?? [])
        }
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activeItem, authHeaders, authToken, logsEndpoint, permissionsEndpoint, rolesEndpoint, usersEndpoint])

  useEffect(() => {
    if (!authToken || !selectedRoleId) {
      return
    }

    const loadRolePermissions = async () => {
      try {
        const response = await fetch(`${rolesEndpoint}/${selectedRoleId}/permissions`, { headers: authHeaders })
        if (!response.ok) {
          const errorMessage = await parseApiError(response, 'Failed to load role permissions.')
          throw new Error(errorMessage)
        }
        const payload = await response.json()
        const ids = payload?.data?.permissionIds ?? []
        setRolePermissions(new Set(ids))
      } catch (requestError) {
        setError(requestError.message)
      }
    }

    loadRolePermissions()
  }, [authHeaders, authToken, rolesEndpoint, selectedRoleId])

  const openPanel = (mode, record = null) => {
    setPanel({ mode })
    setNotice('')
    setError('')

    if (mode === 'addRole') {
      setRoleForm(emptyRoleForm())
    }

    if (mode === 'editRole' && record) {
      setRoleForm({
        id: record.id,
        name: record.name,
        description: record.description || '',
        level: record.level ?? '',
        status: record.status ?? 'Active',
      })
    }

    if (mode === 'addUser') {
      setUserForm(emptyUserForm())
    }

    if (mode === 'editUser' && record) {
      setUserForm({
        id: record.id,
        name: record.name,
        employeeName: record.employeeName || '',
        email: record.email,
        phone: record.phone || '',
        role: record.role || '',
        department: record.department || '',
        status: record.status || 'Active',
        password: '',
      })
    }
  }

  const closePanel = () => {
    setPanel({ mode: null })
  }

  const handleRoleSave = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!roleForm.name) {
      setError('Role name is required.')
      return
    }

    const payload = {
      name: roleForm.name,
      description: roleForm.description || null,
      level: roleForm.level ? Number(roleForm.level) : null,
      status: roleForm.status,
    }

    try {
      const response = await fetch(roleForm.id ? `${rolesEndpoint}/${roleForm.id}` : rolesEndpoint, {
        method: roleForm.id ? 'PUT' : 'POST',
        headers: authJsonHeaders,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to save role.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const data = result?.data
      if (data) {
        setRoles((current) => {
          if (roleForm.id) {
            return current.map((role) => (role.id === data.id ? data : role))
          }
          return [data, ...current]
        })
      }

      setNotice(roleForm.id ? 'Role updated.' : 'Role created.')
      closePanel()
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  const handleRoleDelete = async (roleId) => {
    if (!window.confirm('Delete this role?')) {
      return
    }

    try {
      const response = await fetch(`${rolesEndpoint}/${roleId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete role.')
        throw new Error(errorMessage)
      }

      setRoles((current) => current.filter((role) => role.id !== roleId))
      setNotice('Role deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleRoleToggle = async (role) => {
    const nextStatus = role.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const response = await fetch(`${rolesEndpoint}/${role.id}`, {
        method: 'PATCH',
        headers: authJsonHeaders,
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to update role status.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data
      if (updated) {
        setRoles((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }
      setNotice('Role status updated.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handlePermissionToggle = (permissionId) => {
    setRolePermissions((current) => {
      const next = new Set(current)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }

  const handleModuleToggle = (moduleName) => {
    const modulePermissions = permissionsByModule[moduleName] || []
    setRolePermissions((current) => {
      const next = new Set(current)
      const allSelected = modulePermissions.every((permission) => next.has(permission.id))
      modulePermissions.forEach((permission) => {
        if (allSelected) {
          next.delete(permission.id)
        } else {
          next.add(permission.id)
        }
      })
      return next
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      setError('Select a role first.')
      return
    }

    setError('')
    setNotice('')

    try {
      const response = await fetch(`${rolesEndpoint}/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers: authJsonHeaders,
        body: JSON.stringify({ permissionIds: Array.from(rolePermissions) }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to update permissions.')
        throw new Error(errorMessage)
      }

      setNotice('Permissions updated for selected role.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleUserSave = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!userForm.name || !userForm.email || !userForm.role) {
      setError('Name, email, and role are required.')
      return
    }

    if (!userForm.id && !userForm.password) {
      setError('Password is required for a new account.')
      return
    }

    const payload = {
      name: userForm.name,
      employeeName: userForm.employeeName || null,
      email: userForm.email,
      phone: userForm.phone || null,
      department: userForm.department || null,
      role: userForm.role,
      status: userForm.status,
    }

    if (!userForm.id) {
      payload.password = userForm.password
    }

    try {
      const response = await fetch(userForm.id ? `${usersEndpoint}/${userForm.id}` : usersEndpoint, {
        method: userForm.id ? 'PUT' : 'POST',
        headers: authJsonHeaders,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to save user account.')
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const data = result?.data
      if (data) {
        setUsers((current) => {
          if (userForm.id) {
            return current.map((user) => (user.id === data.id ? data : user))
          }
          return [data, ...current]
        })
      }

      setNotice(userForm.id ? 'User account updated.' : 'User account created.')
      closePanel()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Delete this user account?')) {
      return
    }

    try {
      const response = await fetch(`${usersEndpoint}/${userId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok && response.status !== 204) {
        const errorMessage = await parseApiError(response, 'Failed to delete user account.')
        throw new Error(errorMessage)
      }

      setUsers((current) => current.filter((user) => user.id !== userId))
      setNotice('User account deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleUserToggle = async (user) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const response = await fetch(`${usersEndpoint}/${user.id}`, {
        method: 'PATCH',
        headers: authJsonHeaders,
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to update user status.')
        throw new Error(errorMessage)
      }

      const payload = await response.json()
      const updated = payload?.data
      if (updated) {
        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }
      setNotice('User status updated.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handlePasswordReset = async (userId) => {
    const nextPassword = window.prompt('Enter a temporary password (min 8 characters):')
    if (!nextPassword) {
      return
    }

    try {
      const response = await fetch(`${usersEndpoint}/${userId}/reset-password`, {
        method: 'POST',
        headers: authJsonHeaders,
        body: JSON.stringify({ password: nextPassword }),
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to reset password.')
        throw new Error(errorMessage)
      }

      setNotice('Password reset successfully.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleLogFilter = async () => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (logFilters.userId) params.set('userId', logFilters.userId)
    if (logFilters.module) params.set('module', logFilters.module)
    if (logFilters.from) params.set('from', logFilters.from)
    if (logFilters.to) params.set('to', logFilters.to)

    try {
      const response = await fetch(`${logsEndpoint}?${params.toString()}`, { headers: authHeaders })
      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to load activity logs.')
        throw new Error(errorMessage)
      }
      const payload = await response.json()
      setLogs(payload?.data ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogExport = () => {
    const headers = ['User', 'Role', 'Action', 'Module', 'IP Address', 'Device', 'Date']
    const rows = logs.map((log) => [
      log.userName,
      log.roleName,
      log.action,
      log.module,
      log.ipAddress,
      log.device,
      log.createdDate,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'activity-logs.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!authToken) {
    return (
      <section className="focus-panel">
        <h2>{activeItem}</h2>
        <p>Authentication is required to manage roles and permissions.</p>
      </section>
    )
  }
  if (activeItem === 'Manage Roles') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Manage Roles</h2>
          <p>Create, update, and deactivate system roles.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading roles...</div> : null}

        <div className="settings-actions">
          <button type="button" className="action-btn primary" onClick={() => openPanel('addRole')}>
            Create Role
          </button>
        </div>

        <div className="table-wrap">
          <table className="summary-table employee-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Role Name</th>
                <th>Description</th>
                <th>Level</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td className="empty-state" colSpan={7}>
                    No roles configured yet.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.id}</td>
                    <td>{role.name}</td>
                    <td>{role.description || '-'}</td>
                    <td>{role.level ?? '-'}</td>
                    <td>
                      <span className={`pill status ${role.status === 'Active' ? 'active' : 'inactive'}`}>
                        {role.status}
                      </span>
                    </td>
                    <td>{role.updatedDate || '-'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => openPanel('editRole', role)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleRoleToggle(role)}>
                          {role.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" className="danger" onClick={() => handleRoleDelete(role.id)}>
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

        {panel.mode === 'addRole' || panel.mode === 'editRole' ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{panel.mode === 'addRole' ? 'Create Role' : 'Edit Role'}</h3>
                <button type="button" className="modal-close" onClick={closePanel}>
                  Close
                </button>
              </div>
              <form className="modal-form grid-form" onSubmit={handleRoleSave}>
                <label>
                  Role Name
                  <input
                    value={roleForm.name}
                    onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label>
                  Role Description
                  <input
                    value={roleForm.description}
                    onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <label>
                  Role Level
                  <input
                    type="number"
                    value={roleForm.level}
                    onChange={(event) => setRoleForm((current) => ({ ...current, level: event.target.value }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={roleForm.status}
                    onChange={(event) => setRoleForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <div className="modal-actions">
                  <button type="submit" className="action-btn primary">
                    {panel.mode === 'addRole' ? 'Create Role' : 'Save Role'}
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

  if (activeItem === 'Assign Permissions') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Assign Permissions</h2>
          <p>Define which modules and actions are available for each role.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading permissions...</div> : null}

        <div className="settings-card">
          <label className="settings-inline">
            Select Role
            <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)}>
              <option value="">Choose a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          {selectedRoleId ? (
            <div className="permission-grid">
              {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => {
                const allSelected = modulePermissions.every((permission) => rolePermissions.has(permission.id))
                return (
                  <section key={moduleName} className="permission-module">
                    <header>
                      <h3>{moduleName}</h3>
                      <button type="button" className="action-btn ghost" onClick={() => handleModuleToggle(moduleName)}>
                        {allSelected ? 'Clear All' : 'Select All'}
                      </button>
                    </header>
                    <div className="permission-actions">
                      {modulePermissions.map((permission) => (
                        <label key={permission.id} className="permission-item">
                          <input
                            type="checkbox"
                            checked={rolePermissions.has(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                          <span>{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <p className="settings-subtitle">Choose a role to view and edit its permissions.</p>
          )}

          <div className="settings-actions">
            <button type="button" className="action-btn primary" onClick={handleSavePermissions} disabled={!selectedRoleId}>
              Save Permissions
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (activeItem === 'User Accounts') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>User Accounts</h2>
          <p>Create and manage user accounts, roles, and access status.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading user accounts...</div> : null}

        <div className="settings-actions">
          <button type="button" className="action-btn primary" onClick={() => openPanel('addUser')}>
            Create User
          </button>
        </div>

        <div className="table-wrap">
          <table className="summary-table employee-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User Name</th>
                <th>Employee</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="empty-state" colSpan={8}>
                    No user accounts configured yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.employeeName || '-'}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`pill status ${user.status === 'Active' ? 'active' : 'inactive'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastLogin || '-'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => openPanel('editUser', user)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleUserToggle(user)}>
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" onClick={() => handlePasswordReset(user.id)}>
                          Reset Password
                        </button>
                        <button type="button" className="danger" onClick={() => handleUserDelete(user.id)}>
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

        {panel.mode === 'addUser' || panel.mode === 'editUser' ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{panel.mode === 'addUser' ? 'Create User' : 'Edit User'}</h3>
                <button type="button" className="modal-close" onClick={closePanel}>
                  Close
                </button>
              </div>
              <form className="modal-form grid-form" onSubmit={handleUserSave}>
                <label>
                  User Name
                  <input
                    value={userForm.name}
                    onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label>
                  Employee Name
                  <input
                    value={userForm.employeeName}
                    onChange={(event) => setUserForm((current) => ({ ...current, employeeName: event.target.value }))}
                  />
                </label>
                <label>
                  Email
                  <input
                    value={userForm.email}
                    onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label>
                  Phone Number
                  <input
                    value={userForm.phone}
                    onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </label>
                <label>
                  Role
                  <select
                    value={userForm.role}
                    onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Department
                  <input
                    value={userForm.department}
                    onChange={(event) => setUserForm((current) => ({ ...current, department: event.target.value }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={userForm.status}
                    onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                {panel.mode === 'addUser' ? (
                  <label>
                    Temporary Password
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                    />
                  </label>
                ) : null}
                <div className="modal-actions">
                  <button type="submit" className="action-btn primary">
                    {panel.mode === 'addUser' ? 'Create User' : 'Save Changes'}
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

  if (activeItem === 'Activity Logs') {
    return (
      <section className="focus-panel settings-page">
        <header className="settings-header">
          <h2>Activity Logs</h2>
          <p>Track user activity across modules for auditing and compliance.</p>
        </header>
        {notice ? <div className="employee-notice">{notice}</div> : null}
        {error ? <div className="employee-error">{error}</div> : null}
        {loading ? <div className="employee-loading">Loading activity logs...</div> : null}

        <div className="employee-filters">
          <label>
            User
            <select
              value={logFilters.userId}
              onChange={(event) => setLogFilters((current) => ({ ...current, userId: event.target.value }))}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Module
            <input
              value={logFilters.module}
              onChange={(event) => setLogFilters((current) => ({ ...current, module: event.target.value }))}
            />
          </label>
          <label>
            From
            <input
              type="date"
              value={logFilters.from}
              onChange={(event) => setLogFilters((current) => ({ ...current, from: event.target.value }))}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={logFilters.to}
              onChange={(event) => setLogFilters((current) => ({ ...current, to: event.target.value }))}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="action-btn primary" onClick={handleLogFilter}>
              Apply Filters
            </button>
            <button type="button" className="action-btn ghost" onClick={handleLogExport}>
              Export Logs
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="summary-table employee-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td className="empty-state" colSpan={7}>
                    No activity logs available yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.userName || '-'}</td>
                    <td>{log.roleName || '-'}</td>
                    <td>{log.action}</td>
                    <td>{log.module}</td>
                    <td>{log.ipAddress || '-'}</td>
                    <td>{log.device || '-'}</td>
                    <td>{log.createdDate || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return (
    <section className="focus-panel">
      <h2>{activeItem}</h2>
      <p>This module is ready for role and permission management endpoints.</p>
    </section>
  )
}

export default RolePermissionPage
