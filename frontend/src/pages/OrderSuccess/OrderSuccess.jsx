// OrderSuccess.jsx
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './OrderSuccess.module.css'

export default function OrderSuccess() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/track'), 8000)
    return () => clearTimeout(t)
  }, [navigate])
  const order = JSON.parse(localStorage.getItem('fm_last_order') || 'null')
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Order Placed Successfully!</h1>
        <p className={styles.sub}>Your order has been confirmed. We'll deliver in 10 minutes.</p>
        {order && <div className={styles.orderId}>Order ID: <strong>#{order.id}</strong></div>}
        <div className={styles.total}>Total: <strong>₹{order?.total?.toFixed(2)}</strong></div>
        <div className={styles.actions}>
          <Link to="/track" className={styles.primaryBtn}>Track My Order</Link>
          <Link to="/" className={styles.secondaryBtn}>Continue Shopping</Link>
        </div>
        <p className={styles.redirect}>Redirecting to tracking in 8 seconds…</p>
      </div>
    </div>
  )
}
