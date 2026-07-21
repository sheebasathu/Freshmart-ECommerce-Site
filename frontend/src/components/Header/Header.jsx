/**
 * src/components/Header/Header.jsx
 * Nav categories (dropdown) and nav menus (top bar) are loaded from Django CMS API.
 * Search uses /api/products/?search=... instead of static PRODUCTS array.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart }    from '../../hooks/useCart'
import { useAuth }    from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import { getHomepageContent, getProducts } from '../../api/index'
import profileIcon from '../../assets/profileicon.png'
import cartIcon    from '../../assets/carticon.png'

import styles from './Header.module.css'

export default function Header() {
  const navigate = useNavigate()
  const { totalItems }    = useCart()
  const { user, logout }  = useAuth()

  // CMS-driven nav data
  const [navCategories, setNavCategories] = useState([])   // dropdown (Shop by Category)
  const [navMenus,      setNavMenus]      = useState([])   // top horizontal links

  const [catOpen,      setCatOpen]      = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [query,        setQuery]        = useState('')
  const [suggestions,  setSuggestions]  = useState([])
  const debouncedQuery = useDebounce(query, 250)
  const searchRef      = useRef(null)

  // Load nav content from backend once
  useEffect(() => {
    getHomepageContent()
      .then(data => {
        setNavCategories(data.nav_categories || [])
        setNavMenus(data.nav_menus          || [])
      })
      .catch(() => {})
  }, [])

  // Live search suggestions from API
  useEffect(() => {
    if (!debouncedQuery.trim()) { setSuggestions([]); return }
    getProducts({ search: debouncedQuery, page_size: 6 })
      .then(data => setSuggestions(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setSuggestions([]))
  }, [debouncedQuery])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.fm-cat-wrap'))     setCatOpen(false)
      if (!e.target.closest('.fm-profile-wrap')) setProfileOpen(false)
      if (!e.target.closest('.fm-search-box'))   { setQuery(''); setSuggestions([]) }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleSuggestionClick = useCallback((product) => {
    setQuery(''); setSuggestions([])
    navigate(`/product/${product.id}`)
  }, [navigate])

  const handleSearchKey = useCallback((e) => {
    if (e.key !== 'Enter' || !query.trim()) return
    if (suggestions[0]) navigate(`/product/${suggestions[0].id}`)
    else navigate(`/listing?search=${encodeURIComponent(query)}`)
    setQuery(''); setSuggestions([])
  }, [query, suggestions, navigate])

  const initials = user
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : null

  const isQueryActive = (path) => {
    const url = new URL(path, window.location.origin)
    const current = new URL(window.location.href)
    if (url.pathname !== current.pathname) return false
    for (const [k, v] of url.searchParams) {
      if (current.searchParams.get(k) !== v) return false
    }
    return true
  }

  return (
    <>
      <header className={styles.header}>
        {/* ── Row 1 ── */}
        <div className={styles.row1}>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <Link to="/" className={styles.logo}>
            <span className={styles.logoEmoji}>🛒</span>
            <span className={styles.logoText}>
              <span className={styles.logoGreen}>Fresh</span>
              <span className={styles.logoDark}>Mart</span>
            </span>
          </Link>

          {/* Desktop search */}
          <div className={`${styles.searchBox} fm-search-box`} ref={searchRef}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search for Products..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map(p => (
                  <button key={p.id} className={styles.suggItem} onClick={() => handleSuggestionClick(p)}>
                    <span className={styles.suggIcon}>🛒</span>
                    <span className={styles.suggName}>{p.name}</span>
                    <span className={styles.suggBrand}>by {p.brand}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.delivery}>
            <span>⚡</span>
            <div>
              <Link to="/delivery-address" className={styles.deliveryTitle}>Delivery in 10 mins</Link>
              <div className={styles.deliverySub}>Select Location</div>
            </div>
          </div>

          <div className={styles.rightIcons}>
            {/* Mobile search toggle */}
            <button className={`${styles.iconBtn} ${styles.searchIcon}`} onClick={() => setMobileSearch(v => !v)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            {/* Profile */}
            <div className={`${styles.profileWrap} fm-profile-wrap`}>
              {user ? (
                <button className={`${styles.iconBtn} ${styles.profileBtn}`} onClick={() => setProfileOpen(v => !v)}>
                  <span className={styles.avatar}>{initials}</span>
                </button>
              ) : (
                <Link to="/login" className={`${styles.iconBtn} ${styles.profileBtn}`}>
                  <img src={profileIcon} alt="Login" width="30"/>
                </Link>
              )}
              {user && profileOpen && (
                <div className={styles.profileDrop}>
                  <div className={styles.pdUser}>
                    <div className={styles.pdName}>👋 {user.name}</div>
                    <div className={styles.pdEmail}>{user.email}</div>
                  </div>
                  <Link to="/dashboard"        className={styles.pdLink} onClick={() => setProfileOpen(false)}>👤 My Account</Link>
                  <Link to="/cart"             className={styles.pdLink} onClick={() => setProfileOpen(false)}>🛒 My Cart</Link>
                  <Link to="/track"            className={styles.pdLink} onClick={() => setProfileOpen(false)}>📦 Track Order</Link>
                  <Link to="/wishlist"         className={styles.pdLink} onClick={() => setProfileOpen(false)}>❤️ Wishlist</Link>
                  <Link to="/delivery-address" className={styles.pdLink} onClick={() => setProfileOpen(false)}>📍 My Address</Link>
                  <button className={`${styles.pdLink} ${styles.pdLogout}`} onClick={() => { logout(); setProfileOpen(false) }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className={`${styles.iconBtn} ${styles.cartBtn}`}>
              <img src={cartIcon} alt="Cart" width="30"/>
              {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </Link>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearch && (
          <div className={styles.mobileSearch}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" placeholder="Search products..."
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearchKey} autoFocus
            />
            <button onClick={() => { setMobileSearch(false); setQuery(''); setSuggestions([]) }}>✕</button>
          </div>
        )}

        {/* ── Row 2 — Desktop nav ── */}
        <div className={styles.row2}>
          <div className={styles.row2Inner}>
            {/* Shop-by-Category dropdown — admin NavCategory entries */}
            <div className={`${styles.catWrap} fm-cat-wrap`}>
              <button
                className={`${styles.catBtn} ${catOpen ? styles.catOpen : ''}`}
                onClick={() => setCatOpen(v => !v)}
              >
                Shop by Category
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {catOpen && (
                <div className={styles.catDrop}>
                  {navCategories.map(c => (
                    <Link
                      key={c.id}
                      to={c.path}
                      className={styles.dropItem}
                      onClick={() => setCatOpen(false)}
                    >
                      {c.icon_url
                        ? <img src={c.icon_url} alt={c.name} width="24" height="24" style={{ borderRadius: 4 }}/>
                        : <span className={styles.dropIcon}>{c.icon_emoji || '🛒'}</span>
                      }
                      <div>
                        <div className={styles.dropName}>{c.name}</div>
                        {c.description && <div className={styles.dropSub}>{c.description}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Horizontal nav links — admin NavMenu entries */}
            <nav className={styles.nav}>
              {navMenus.map(m => (
                <span
                  key={m.id}
                  className={`${styles.navLink} ${isQueryActive(m.path) ? styles.navActive : ''}`}
                  onClick={() => navigate(m.path)}
                  style={{ cursor: 'pointer' }}
                >
                  {m.title}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ── SIDEBAR (mobile) ── */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)}>
          <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
            <div className={styles.sbHead}>
              <span className={styles.logoText}>
                <span className={styles.logoGreen}>Fresh</span><span className={styles.logoDark}>Mart</span>
              </span>
              <button className={styles.sbClose} onClick={() => setSidebarOpen(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.sbDelivery}>
              <span>⚡</span>
              <div>
                <div className={styles.deliveryTitle}>Delivery in 10 mins</div>
                <div className={styles.deliverySub}>Select Location</div>
              </div>
            </div>
            <div className={styles.sbSection}>
              <div className={styles.sbLabel}>Shop by Category</div>
              {navCategories.map(c => (
                <Link key={c.id} to={c.path} className={styles.sbCatItem} onClick={() => setSidebarOpen(false)}>
                  <span>{c.icon_emoji || '🛒'}</span><span>{c.name}</span>
                </Link>
              ))}
            </div>
            <div className={styles.sbSection}>
              <div className={styles.sbLabel}>Quick Links</div>
              {navMenus.map(m => (
                <span key={m.id} className={styles.sbNavLink} onClick={() => { navigate(m.path); setSidebarOpen(false) }}>
                  {m.title}
                </span>
              ))}
            </div>
            <div className={styles.sbActions}>
              {user ? (
                <>
                  <Link to="/dashboard" className={styles.sbBtn} onClick={() => setSidebarOpen(false)}>My Account</Link>
                  <button className={`${styles.sbBtn} ${styles.sbBtnOutline}`} onClick={() => { logout(); setSidebarOpen(false) }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className={styles.sbBtn} onClick={() => setSidebarOpen(false)}>Login / Sign Up</Link>
                  <Link to="/cart" className={`${styles.sbBtn} ${styles.sbBtnOutline}`} onClick={() => setSidebarOpen(false)}>
                    View Cart {totalItems > 0 && `(${totalItems})`}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}