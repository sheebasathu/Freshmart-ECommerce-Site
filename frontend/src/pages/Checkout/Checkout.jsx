import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import styles from './Checkout.module.css'

const SHIP_OPTIONS = [
  { value: 'express', label: 'Express Delivery (10 mins)', sub: 'Guaranteed in 10 minutes', cost: 0 },
  { value: 'standard', label: 'Standard Delivery', sub: '3–5 business days', cost: 0 },
]
const PAY_OPTIONS = [
  { value: 'card',   label: 'Credit / Debit Card',  icon: '💳' },
  { value: 'upi',    label: 'UPI / PhonePe',         icon: '📱' },
  { value: 'cod',    label: 'Cash on Delivery',      icon: '💵' },
]

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [ship,   setShip]   = useState('express')
  const [pay,    setPay]    = useState('card')
  const [errors, setErrors] = useState({})
  const [form,   setForm]   = useState({
    name: user?.name || '', email: user?.email || '',
    phone: '', address: '', city: '', state: '', zip: '',
    card: '', exp: '', cvv: '',
  })

  const delivery   = 0
  const gst        = +(totalPrice * 0.05).toFixed(2)
  const grandTotal = +(totalPrice + delivery + gst).toFixed(2)

  if (!items.length) return (
    <div className={styles.empty}>
      <div>🛒</div>
      <h2>Your cart is empty</h2>
      <Link to="/listing" className={styles.btn}>Continue Shopping</Link>
    </div>
  )

  const field = (name) => ({
    value: form[name],
    onChange: e => setForm(f => ({ ...f, [name]: e.target.value })),
    className: `${styles.input} ${errors[name] ? styles.inputErr : ''}`,
  })

  const validate = () => {
    const e = {}
    if (!form.name.trim())                      e.name    = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g,'')))  e.phone = '10-digit phone'
    if (!form.address.trim())                   e.address = 'Required'
    if (!form.city.trim())                      e.city    = 'Required'
    if (!form.state.trim())                     e.state   = 'Required'
    if (!/^\d{4,6}$/.test(form.zip))            e.zip     = 'Valid PIN'
    if (pay === 'card') {
      if (!/^\d{16}$/.test(form.card.replace(/\s/g,''))) e.card = '16-digit number'
      if (!/^\d{2}\/\d{2}$/.test(form.exp))              e.exp  = 'MM/YY'
      if (!/^\d{3,4}$/.test(form.cvv))                   e.cvv  = '3-digit CVV'
    }
    return e
  }

  const handleOrder = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const order = {
      id: 'FM' + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      status: 'confirmed',
      items, subtotal: totalPrice, shipping: delivery, tax: gst, total: grandTotal,
      address: form,
      eta: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }
    localStorage.setItem('fm_last_order', JSON.stringify(order))
    // Save address to dashboard
    const saved = JSON.parse(localStorage.getItem('fm_saved_addresses') || '[]')
    saved.unshift({ ...form, id: Date.now(), label: 'Home' })
    localStorage.setItem('fm_saved_addresses', JSON.stringify(saved.slice(0, 5)))
    clearCart()
    navigate('/order-success')
  }

  return (
    <div className={`${styles.page} wrap`}>
      <h1 className={styles.pageTitle}>Checkout</h1>
      <p className={styles.crumbs}><Link to="/">Home</Link> / <Link to="/cart">Cart</Link> / <strong>Checkout</strong></p>

      <div className={styles.grid}>
        <form className={styles.formCol} noValidate>

          {/* Address */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📍 Shipping Address</h2>
            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label>Full Name *</label>
                <input {...field('name')} placeholder="John Doe"/>
                {errors.name && <span className={styles.err}>{errors.name}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label>Email *</label>
                <input {...field('email')} type="email" placeholder="you@example.com"/>
                {errors.email && <span className={styles.err}>{errors.email}</span>}
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label>Phone *</label>
                <input {...field('phone')} placeholder="10-digit mobile"/>
                {errors.phone && <span className={styles.err}>{errors.phone}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label>City *</label>
                <input {...field('city')} placeholder="City"/>
                {errors.city && <span className={styles.err}>{errors.city}</span>}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label>Street Address *</label>
              <input {...field('address')} placeholder="House no., Street, Area"/>
              {errors.address && <span className={styles.err}>{errors.address}</span>}
            </div>
            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label>State *</label>
                <input {...field('state')} placeholder="State"/>
                {errors.state && <span className={styles.err}>{errors.state}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label>PIN Code *</label>
                <input {...field('zip')} placeholder="6-digit PIN"/>
                {errors.zip && <span className={styles.err}>{errors.zip}</span>}
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🚚 Delivery Method</h2>
            {SHIP_OPTIONS.map(o => (
              <label key={o.value} className={`${styles.optRow} ${ship === o.value ? styles.optActive : ''}`}>
                <input type="radio" name="ship" value={o.value} checked={ship === o.value} onChange={() => setShip(o.value)}/>
                <div className={styles.optInfo}><strong>{o.label}</strong><span>{o.sub}</span></div>
                <span className={styles.optPrice}>{o.cost === 0 ? <span className={styles.free}>FREE</span> : `₹${o.cost}`}</span>
              </label>
            ))}
          </div>

          {/* Payment */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>💳 Payment Method</h2>
            {PAY_OPTIONS.map(o => (
              <label key={o.value} className={`${styles.optRow} ${pay === o.value ? styles.optActive : ''}`}>
                <input type="radio" name="pay" value={o.value} checked={pay === o.value} onChange={() => setPay(o.value)}/>
                <div className={styles.optInfo}><strong>{o.label}</strong></div>
                <span className={styles.optIcon}>{o.icon}</span>
              </label>
            ))}
            {pay === 'card' && (
              <div className={styles.cardFields}>
                <div className={styles.fieldGroup}>
                  <label>Card Number *</label>
                  <input {...field('card')} placeholder="1234 5678 9012 3456" maxLength={19}/>
                  {errors.card && <span className={styles.err}>{errors.card}</span>}
                </div>
                <div className={styles.row2}>
                  <div className={styles.fieldGroup}>
                    <label>Expiry (MM/YY) *</label>
                    <input {...field('exp')} placeholder="MM/YY" maxLength={5}/>
                    {errors.exp && <span className={styles.err}>{errors.exp}</span>}
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>CVV *</label>
                    <input {...field('cvv')} placeholder="123" maxLength={4} type="password"/>
                    {errors.cvv && <span className={styles.err}>{errors.cvv}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Summary sidebar */}
        <aside className={styles.aside}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🧾 Order Summary</h2>
            <div className={styles.orderItems}>
              {items.map(i => (
                <div key={`${i.id}-${i.weight}`} className={styles.orderItem}>
                  <span>{i.name} × {i.qty}</span>
                  <span>₹{(i.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className={styles.summLine}><span>Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
            <div className={styles.summLine}><span>Delivery</span><span className={styles.free}>FREE</span></div>
            <div className={styles.summLine}><span>GST (5%)</span><span>₹{gst}</span></div>
            <div className={styles.summTotal}><span>Total</span><span>₹{grandTotal}</span></div>
            <button className={styles.placeBtn} type="button" onClick={handleOrder}>Place Order →</button>
            <Link to="/cart" className={styles.backCart}>← Back to Cart</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
