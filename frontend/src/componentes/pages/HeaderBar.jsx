import { useEffect, useRef, useState } from 'react'

function HeaderBar({
  apiOnline,
  apiStatus,
  currentUser,
  searchTerm,
  onOpenMenu,
  onLogoRefresh,
  onOpenProfile,
  onSearchChange,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
        <div className={`profile-dropdown ${menuOpen ? 'open' : ''}`} ref={menuRef}>
          <button
            type="button"
            className="profile-chip"
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="profile-avatar" style={{ '--avatar-hue': hueValue }}>
              {initials}
            </span>
            <span className="profile-meta">
              <strong>{name}</strong>
              <small>{role}</small>
            </span>
            <span className="profile-caret">▾</span>
          </button>
          {menuOpen ? (
            <div className="profile-menu" role="menu">
              <button
                type="button"
                className="profile-menu-item"
                onClick={(event) => {
                  onOpenProfile(event)
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                Profile
              </button>
              <button
                type="button"
                className="profile-menu-item danger"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout?.()
                }}
                role="menuitem"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default HeaderBar
