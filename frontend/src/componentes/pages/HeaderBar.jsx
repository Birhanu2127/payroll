function HeaderBar({
  apiOnline,
  apiStatus,
  currentUser,
  searchTerm,
  onOpenMenu,
  onLogoRefresh,
  onOpenProfile,
  onSearchChange,
}) {
  const name = currentUser?.name ?? 'Guest'
  const role = currentUser?.role ?? 'Visitor'
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const avatarHue = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
    .toString()
  const hueValue = (Number(avatarHue) * 37) % 360

  return (
    <header className="header-bar">
      <div className="header-left">
        <button type="button" className="mobile-menu-btn" onClick={onOpenMenu}>
          Menu
        </button>
        <button type="button" className="header-logo" onClick={onLogoRefresh} aria-label="Refresh page">
          <span className="header-logo-mark">P</span>
          <span className="header-logo-word">PAYROLL</span>
        </button>
      </div>

      <label className="header-search" aria-label="Search menu">
        <input
          type="search"
          placeholder="Search menu modules..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="header-right">
        <button type="button" className="profile-chip" onClick={onOpenProfile}>
          <span className="profile-avatar" style={{ '--avatar-hue': hueValue }}>
            {initials}
          </span>
          <span className="profile-meta">
            <strong>{name}</strong>
            <small>{role}</small>
          </span>
        </button>
        <span className={`status ${apiOnline ? 'ok' : 'offline'}`}>{apiStatus}</span>
      </div>
    </header>
  )
}

export default HeaderBar
