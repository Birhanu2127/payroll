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
        <a href="#/profile" className="profile-link" onClick={onOpenProfile}>
          Profile: {currentUser.name}
        </a>
        <span className={`status ${apiOnline ? 'ok' : 'offline'}`}>{apiStatus}</span>
      </div>
    </header>
  )
}

export default HeaderBar
