function ProfilePage({ currentUser }) {
  if (!currentUser) {
    return null
  }

  return (
    <section className="focus-panel">
      <h2>Logged In Profile</h2>
      <div className="profile-grid">
        <article className="metric-card">
          <p>Full Name</p>
          <strong>{currentUser.name}</strong>
        </article>
        <article className="metric-card">
          <p>Email</p>
          <strong>{currentUser.email}</strong>
        </article>
        <article className="metric-card">
          <p>Role</p>
          <strong>{currentUser.role}</strong>
        </article>
        <article className="metric-card">
          <p>Access Scope</p>
          <strong>{currentUser.role === 'superadmin' ? 'Global Admin Access' : 'HR Access'}</strong>
        </article>
      </div>
    </section>
  )
}

export default ProfilePage
