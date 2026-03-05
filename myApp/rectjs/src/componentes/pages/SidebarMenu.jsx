function SidebarMenu({
  mobileOpen,
  filteredMenuSections,
  expanded,
  activeSection,
  activeItem,
  onToggleSection,
  onSelectItem,
  onLogout,
}) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <p className="menu-kicker">Navigation</p>

      <nav className="menu">
        {filteredMenuSections.map((section) => (
          <section key={section.title} className="menu-group">
            <button
              className="menu-group-trigger"
              onClick={() => onToggleSection(section.title)}
              type="button"
              aria-expanded={expanded[section.title]}
            >
              <span className="menu-title">
                <span className="menu-icon">{section.icon}</span>
                {section.title}
              </span>
              <span className="caret">{expanded[section.title] ? '-' : '+'}</span>
            </button>

            {expanded[section.title] ? (
              <ul className="submenu">
                {section.items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className={`submenu-item ${
                        activeSection === section.title && activeItem === item ? 'active' : ''
                      }`}
                      onClick={() => onSelectItem(section.title, item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </nav>

      {filteredMenuSections.length === 0 ? (
        <p className="no-menu-results">No matching menu items found.</p>
      ) : null}

      <button type="button" className="logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  )
}

export default SidebarMenu
