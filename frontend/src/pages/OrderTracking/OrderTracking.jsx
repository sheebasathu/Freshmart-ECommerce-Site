import { Link } from 'react-router-dom'
import styles from './OrderTracking.module.css'


const STEPS = ['Confirmed', 'Packed', 'Out for Delivery', 'Delivered']

export default function OrderTracking() {
  const order = JSON.parse(localStorage.getItem('fm_last_order') || 'null')
  if (!order) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>📦</div>
      <h2>No orders found</h2>
      <p>You don't have any recent orders to track.</p>
      <Link to="/" className={styles.btn}>Start Shopping</Link>
    </div>
  )

  const mins = (Date.now() - new Date(order.date)) / 60000
  let stage = 0
  if (mins > 0.5) stage = 1
  if (mins > 2) stage = 2
  if (mins > 5) stage = 3
  const pct = (stage / (STEPS.length - 1)) * 100


  return (
    <div className={`${styles.page} wrap`}>
      <h1 className={styles.title}>Track Your Order</h1>
      <p className={styles.crumbs}><Link to="/">Home</Link> / <strong>Track Order</strong></p>

      <div className={styles.card}>
        <div className={styles.orderHead}>
          <div>
            <div className={styles.orderId}>Order #{order.id}</div>
            <div className={styles.orderDate}>Placed on {new Date(order.date).toLocaleString()}</div>
          </div>
          <span className={styles.statusBadge}>{STEPS[stage]}</span>
        </div>

        {/* Progress bar */}
        <div className={styles.track}>
          <div className={styles.trackBar} style={{ width: `calc(${pct}% - 36px)` }} />
          {STEPS.map((s, i) => (
            <div key={s} className={`${styles.step} ${i < stage ? styles.done : i === stage ? styles.active : ''}`}>
              <div className={styles.dot}>{i < stage ? '✓' : i + 1}</div>
              <div className={styles.lbl}>{s}</div>
            </div>
          ))}
        </div>

        <div className={styles.metaGrid}>
          <div>
            <h3>Estimated Delivery</h3>
            <p><strong>In about 10 minutes</strong></p>
          </div>
          <div>
            <h3>Shipping To</h3>
            <p>{order.address?.name}<br />{order.address?.address}, {order.address?.city}<br />📞 {order.address?.phone}</p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.itemsTitle}>Order Items</h3>
        <table className={styles.table}>
          <thead><tr><th>Item</th><th>Qty</th><th className={styles.r}>Price</th><th className={styles.r}>Total</th></tr></thead>
          <tbody>
            {order.items?.map(i => {
              const qty =
                Number(i.quantity) ||  
                0
              const price =
                Number(i.variant?.price) || 0

              const total =
                Number(i.line_total) || (qty * price)
              console.log("ITEM:", i)

              return (
                <tr key={i.id}>
                  <td>
                    {i.name || i.product_name || 'Item'}
                    {i.variant?.weight ? ` (${i.variant.weight})` : ''}
                  </td>
                  <td>{qty}</td>

                  <td className={styles.r}>
                    ₹{price.toFixed(2)}
                  </td>

                  <td className={styles.r}>
                    ₹{total.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}>Subtotal</td><td className={styles.r}>₹{order.subtotal?.toFixed(2)}</td></tr>
            <tr><td colSpan={3}>GST</td><td className={styles.r}>₹{order.tax?.toFixed(2)}</td></tr>
            <tr className={styles.totalRow}><td colSpan={3}><strong>Total</strong></td><td className={styles.r}><strong>₹{order.total?.toFixed(2)}</strong></td></tr>
          </tfoot>
        </table>
        <div className={styles.actions}>
          <Link to="/" className={styles.btn}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
