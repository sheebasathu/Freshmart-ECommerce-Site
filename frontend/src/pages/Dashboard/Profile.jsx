import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Profile.module.css'

const SAMPLE_COUPONS = [
  { code: 'FRESH10', desc: '10% off on your next order', expiry: '30 Jun 2025', valid: true },
  { code: 'NEWUSER50', desc: '₹50 off on orders above ₹299', expiry: '31 Dec 2025', valid: true },
  { code: 'VEGGIE20', desc: '20% off on vegetables', expiry: '15 Jan 2025', valid: false },
]

function EditField({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)

  const save = () => { onSave(draft); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }

  return (
    <div className={styles.profileRow}>
      <div className={styles.profileRowLeft}>
        <span className={styles.fieldLabel}>{label}</span>
        {editing ? (
          <input
            className={styles.inlineInput}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
        ) : (
          <span className={styles.fieldValue}>{value || <em className={styles.empty}>Not set</em>}</span>
        )}
      </div>
      <div className={styles.profileRowActions}>
        {editing ? (
          <>
            <button className={styles.actionSave} onClick={save}>✓</button>
            <button className={styles.actionCancel} onClick={cancel}>✕</button>
          </>
        ) : (
          <button className={styles.actionEdit} onClick={() => setEditing(true)}>✏️ Edit</button>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [copiedCode, setCopiedCode] = useState(null)

  if (!user) {
    return (
      <div className={styles.notLoggedIn}>
        <div className={styles.notLoggedInIcon}>👤</div>
        <h2>Please log in to view your profile</h2>
        <Link to="/login" className={styles.loginBtn}>Login / Sign Up</Link>
      </div>
    )
  }

  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.inner} wrap`}>

        {/* Sidebar navigation */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.avatarName}>{user.name}</div>
              <div className={styles.avatarEmail}>{user.email}</div>
            </div>
          </div>
          <nav className={styles.sideNav}>
            <a href="#personal"   className={styles.navLink}>👤 Personal Info</a>
            <a href="#address"    className={styles.navLink}>📍 My Address</a>
            <a href="#coupons"    className={styles.navLink}>🎟️ Coupons</a>
            <Link to="/cart"      className={styles.navLink}>🛒 My Cart</Link>
            <Link to="/wishlist"  className={styles.navLink}>❤️ Wishlist</Link>
          </nav>
        </aside>

        {/* Main content */}
        <div className={styles.content}>

          {/* Personal Info */}
          <section id="personal" className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Personal Information</h2>
              <span className={styles.cardBadge}>Verified ✓</span>
            </div>
            <EditField
              label="Full Name"
              value={user.name}
              onSave={v => updateProfile({ name: v })}
            />
            <EditField
              label="Email Address"
              value={user.email}
              onSave={v => updateProfile({ email: v })}
            />
            <EditField
              label="Phone Number"
              value={user.phone || ''}
              onSave={v => updateProfile({ phone: v })}
            />
          </section>

          {/* Address */}
          <section id="address" className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>My Delivery Address</h2>
              <Link to="/delivery-address" className={styles.manageLink}>Manage →</Link>
            </div>
            {(() => {
              let addr = {}
              try { addr = JSON.parse(localStorage.getItem('fm_address')) || {} } catch {}
              const parts = [addr.house, addr.street, addr.landmark, addr.city, addr.postcode].filter(Boolean)
              return parts.length ? (
                <div className={styles.addrPreview}>
                  <span className={styles.addrIcon}>🏠</span>
                  <div>
                    <div className={styles.addrType}>Home</div>
                    <div className={styles.addrText}>{parts.join(', ')}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.addrEmpty}>
                  <p>No address saved yet.</p>
                  <Link to="/delivery-address" className={styles.addAddrBtn}>+ Add Address</Link>
                </div>
              )
            })()}
          </section>

          {/* Coupons */}
          <section id="coupons" className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>My Coupons</h2>
              <span className={styles.cardBadge}>{SAMPLE_COUPONS.filter(c => c.valid).length} active</span>
            </div>
            <div className={styles.couponList}>
              {SAMPLE_COUPONS.map(c => (
                <div key={c.code} className={`${styles.coupon} ${!c.valid ? styles.couponExpired : ''}`}>
                  <div className={styles.couponLeft}>
                    <div className={styles.couponCode}>{c.code}</div>
                    <div className={styles.couponDesc}>{c.desc}</div>
                    <div className={styles.couponExpiry}>
                      {c.valid ? `Valid till ${c.expiry}` : `Expired ${c.expiry}`}
                    </div>
                  </div>
                  <button
                    className={`${styles.copyBtn} ${copiedCode === c.code ? styles.copyBtnDone : ''}`}
                    disabled={!c.valid}
                    onClick={() => handleCopy(c.code)}
                  >
                    {copiedCode === c.code ? '✓ Copied' : 'Copy'}
                  </button>
                  {!c.valid && <div className={styles.expiredBadge}>Expired</div>}
                  {c.valid && <div className={styles.scissor}>✂</div>}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
