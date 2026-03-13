function DashboardPanel({
  activeItem,
  dashboardData,
  dashboardError,
  dashboardLoading,
  dashboardEndpoint,
  moneyFormatter,
}) {
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
    const dashboardOverview = dashboardData?.overview ?? []

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

export default DashboardPanel
