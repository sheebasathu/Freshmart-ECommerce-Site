// src/pages/Cart/Cart.jsx
// Replicates the UI from screenshots exactly:
//   • Empty state  → green-tinted basket illustration + "Let's fill the empty Basket"
//   • Filled state → "Your Basket" title, breadcrumb, Delivery-1 group card,
//                    ITEMS/QUANTITY/SUB-TOTAL table, savings tag, Delete / Save for later,
//                    sticky bottom bar with subtotal + savings + delivery-type + Proceed btn.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import styles from './Cart.module.css'

// ── Delivery type options (mirrors screenshot "Later 2 hrs") ─────────────────
const DELIVERY_OPTIONS = [
  { id: 'now',   label: 'Now',   sub: '10 mins', icon: '⚡' },
  { id: 'later', label: 'Later', sub: '2 hrs',   icon: '🕐' },
]

// ── Basket SVG illustration (matches the wicker-basket in screenshot 1975) ───
function BasketIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Green circle background */}
      <circle cx="55" cy="55" r="55" fill="#e8f5e9"/>
      {/* Basket body */}
      <rect x="22" y="52" width="66" height="36" rx="6" fill="#c8a86b"/>
      {/* Basket weave lines horizontal */}
      <line x1="22" y1="64" x2="88" y2="64" stroke="#a07840" strokeWidth="1.5"/>
      <line x1="22" y1="76" x2="88" y2="76" stroke="#a07840" strokeWidth="1.5"/>
      {/* Basket weave lines vertical */}
      {[30,38,46,54,62,70,78].map(x => (
        <line key={x} x1={x} y1="52" x2={x} y2="88" stroke="#a07840" strokeWidth="1" opacity="0.5"/>
      ))}
      {/* Basket rim */}
      <rect x="18" y="48" width="74" height="10" rx="5" fill="#d4a853"/>
      {/* Handle left */}
      <path d="M35 48 Q28 28 40 22" stroke="#c8a86b" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Handle right */}
      <path d="M75 48 Q82 28 70 22" stroke="#c8a86b" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Handle top arc */}
      <path d="M40 22 Q55 12 70 22" stroke="#c8a86b" strokeWidth="5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

export default function Cart() {
  const { items, setQty, removeItem, totalPrice, totalItems, clearCart, loading } = useCart()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [delivery,   setDelivery]   = useState('later')
  const [savedItems, setSavedItems] = useState([])  // track "saved for later" item IDs

  // ── Savings: difference between MRP total and actual price total ────────────
  const savings = items.reduce((acc, item) => {
    const mrp   = parseFloat(item.variant?.mrp   || 0)
    const price = parseFloat(item.variant?.price || 0)
    return acc + (mrp - price) * item.quantity
  }, 0)

  const deliveryCharge = totalPrice > 499 ? 0 : (delivery === 'now' ? 0 : 0)
  const gst            = +(totalPrice * 0.05).toFixed(2)
  const grandTotal     = +(totalPrice + deliveryCharge + gst).toFixed(2)

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!user) return (
    <div className={styles.emptyPage}>
      <nav className={styles.breadcrumb}>
        <Link to="/">Home</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.crumbCur}>Cart</span>
      </nav>
      <h1 className={styles.pageTitle}>Your Basket</h1>
      <div className={styles.emptyBox}>
        <BasketIllustration />
        <p className={styles.emptyMsg}>
          Please <Link to="/login" className={styles.loginLink}>log in</Link> to view your basket
        </p>
        <Link to="/login" className={styles.continueBtn}>Login / Sign Up</Link>
      </div>
    </div>
  )

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.loadingPage}>
      <div className={styles.spinner}/>
      <p>Loading your basket…</p>
    </div>
  )

  // ── EMPTY CART STATE ─────────────────────────────────────────────────────────
  if (!items.length) return (
    <div className={styles.emptyPage}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link to="/">Home</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.crumbCur}>Cart</span>
      </nav>
      <h1 className={styles.pageTitle}>Your Basket</h1>

      {/* Empty illustration box */}
      <div className={styles.emptyBox}>
        <BasketIllustration />
        <p className={styles.emptyMsg}>
          Let's fill the empty <span className={styles.emptyAccent}>Basket</span>
        </p>
        <button
          className={styles.continueBtn}
          onClick={() => navigate('/listing')}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )

  // ── FILLED CART STATE ───────────────────────────────────────────────────────
  // Group items into a single "Delivery 1" group (can be expanded to multiple later)
  const handleSaveForLater = (itemId) => {
    setSavedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  return (
    <div className={styles.page}>

      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb}>
        <Link to="/">Home</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.crumbCur}>Cart</span>
      </nav>

      {/* ── Page title ── */}
      <h1 className={styles.pageTitle}>Your Basket</h1>

      {/* ── Main scroll area (above sticky bottom bar) ── */}
      <div className={styles.cartBody}>

        {/* ── Delivery group card ── */}
        <div className={styles.deliveryGroup}>

          {/* Group header */}
          <div className={styles.groupHeader}>
            <div className={styles.groupLeft}>
              <span className={styles.groupTitle}>Delivery 1</span>
              <span className={styles.groupCount}>{totalItems} Product{totalItems !== 1 ? 's' : ''}</span>
            </div>
            <button className={styles.collapseBtn} aria-label="collapse">▼</button>
          </div>

          {/* Savings tag – only shown when there are savings */}
          {savings > 0 && (
            <div className={styles.savingsTag}>
              <span className={styles.savingsCheck}>✔</span>
              <span>Har Din Sasta!</span>
              <span className={styles.savingsAmt}>You're saving ₹{savings.toFixed(0)} on this order</span>
            </div>
          )}

          {/* Table header */}
          <div className={styles.tableHeader}>
            <span className={styles.colItems}>ITEMS</span>
            <span className={styles.colQty}>QUANTITY</span>
            <span className={styles.colSub}>SUB-TOTAL</span>
          </div>

          {/* Item rows */}
          <div className={styles.itemList}>
            {items.map(item => {
              const price    = parseFloat(item.variant?.price || 0)
              const mrp      = parseFloat(item.variant?.mrp   || 0)
              const subtotal = price * item.quantity
              const saved    = savedItems.includes(item.id)

              return (
                <div key={item.id} className={`${styles.itemRow} ${saved ? styles.itemSaved : ''}`}>

                  {/* Product image + info */}
                  <div className={styles.itemCell}>
                    <div className={styles.imgBox}>
                      <img
                        src={item.image || '/images/capsicumdefault.png'}
                        alt={item.product_name}
                        className={styles.itemImg}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.product_name}</p>
                      <div className={styles.itemPriceRow}>
                        <span className={styles.itemPrice}>₹ {price.toFixed(0)}</span>
                        {mrp > price && (
                          <span className={styles.itemMrp}>₹{mrp.toFixed(0)}</span>
                        )}
                      </div>
                      {/* Delete | Save for later */}
                      <div className={styles.itemActions}>
                        <button
                          className={styles.actionLink}
                          onClick={() => removeItem(item.id)}
                        >
                          Delete
                        </button>
                        <span className={styles.actionDivider}>|</span>
                        <button
                          className={`${styles.actionLink} ${saved ? styles.actionSaved : ''}`}
                          onClick={() => handleSaveForLater(item.id)}
                        >
                          {saved ? 'Saved ✓' : 'Save for later'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className={styles.qtyCell}>
                    <div className={styles.stepper}>
                      <button
                        className={styles.stepBtn}
                        onClick={() => setQty(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.stepCount}>{item.quantity}</span>
                      <button
                        className={styles.stepBtn}
                        onClick={() => setQty(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Sub-total + savings */}
                  <div className={styles.subCell}>
                    <span className={styles.subTotal}>₹{subtotal.toFixed(0)}</span>
                    {mrp > price && (
                      <span className={styles.subSaved}>
                        Saved: ₹{((mrp - price) * item.quantity).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Clear cart link */}
          <div className={styles.clearRow}>
            <button className={styles.clearBtn} onClick={clearCart}>
              🗑 Clear Basket
            </button>
          </div>
        </div>

      </div>

      {/* ── STICKY BOTTOM BAR ─────────────────────────────────────────────── */}
      <div className={styles.bottomBar}>

        {/* Left — Subtotal + Savings chip */}
        <div className={styles.barLeft}>
          <p className={styles.barSubtotal}>
            Subtotal: <strong>₹{totalPrice.toFixed(0)}</strong>
          </p>
          {savings > 0 && (
            <span className={styles.savingsChip}>
              Savings: ₹{savings.toFixed(0)}
            </span>
          )}
        </div>

        {/* Centre — Choose delivery type */}
        <div className={styles.barCenter}>
          <p className={styles.deliveryLabel}>CHOOSE DELIVERY TYPE</p>
          <div className={styles.deliveryOptions}>
            {DELIVERY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`${styles.deliveryOpt} ${delivery === opt.id ? styles.deliveryActive : ''}`}
                onClick={() => setDelivery(opt.id)}
              >
                <span className={styles.deliveryIcon}>{opt.icon}</span>
                <div className={styles.deliveryOptText}>
                  <span className={styles.deliveryOptLabel}>{opt.label}</span>
                  <span className={styles.deliveryOptSub}>{opt.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Proceed to checkout */}
        <div className={styles.barRight}>
          <button
            className={styles.checkoutBtn}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>

      </div>

    </div>
  )
}