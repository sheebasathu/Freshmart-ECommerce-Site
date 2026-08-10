/**
 * src/components/ProductCard/ProductCard.jsx
 * Works with Django API product shape:
 *   { id, name, brand, badge, primary_image, variants:[{id,weight,price,mrp,discount,delivery_mins}], avg_rating }
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'
import { useAuth } from '../../hooks/useAuth'
import styles from './ProductCard.module.css'

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

export default function ProductCard({ product }) {
  const { addItem, items, setQty, removeItem } = useCart()
  const { toggle, isWished } = useWishlist()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [dropOpen, setDropOpen] = useState(false)

  const variants = product.variants || []
  const opt = variants[selectedIdx] || {}


  // Find this variant in cart by Django CartItem.id
  // cart items shape: { id (CartItem PK), variant: {id, weight, ...}, quantity, ... }
  const cartItem = items.find(i => i.variant?.id === opt.id)
  const qty = cartItem?.quantity || 0
  const isOutOfStock = opt.stock === 0;
  const isLowStock = opt.stock > 0 && opt.stock < qty;
  const exceedsStock = qty >= opt.stock

  const requireLogin = (e) => {
    e.preventDefault()
    navigate('/login')
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!user) { requireLogin(e); return }
    if (opt.stock === 0) return
    addItem(opt.id, 1)   // opt.id = ProductVariant PK
  }

  const handleMinus = (e) => {
    e.preventDefault()
    if (!cartItem) return
    if (qty <= 1) removeItem(cartItem.id)
    else setQty(cartItem.id, qty - 1)
  }

  const handlePlus = (e) => {
    e.preventDefault()
    if (!cartItem) return
    if (qty >= opt.stock) return
    setQty(cartItem.id, qty + 1)
  }

  const handleWish = (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    toggle(product)
  }

  // Primary image: API returns a URL string
  const primary = product.images?.find(img => img.is_primary) ||
    product.images?.[0];

  const hover = product.images?.find(img => img.is_hover);

  const imgA = primary?.image_url || '/images/capsicumdefault.png';
  const imgB = hover?.image_url;

  return (
    <Link to={`/product/${product.id}`} className={styles.card}>
      {product.badge && <span className={styles.badge}>{product.badge}</span>}

      <div className={styles.imgFrame}>
        {/* Primary Image */}
        <img
          className={styles.imgA}
          src={imgA}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = '/images/capsicumdefault.png'
          }} />

        {/* Hover Image */}
        {imgB && (
          <img className={styles.imgB} src={imgB} alt={product.name} loading="lazy" />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.captionRow}>
          <span className={styles.brandTag}>{product.brand}</span>
          {opt.delivery_mins && (
            <span className={styles.timeBadge}><ClockIcon /> {opt.delivery_mins} MINS</span>
          )}
        </div>
        <h3 className={styles.title}>{product.name}</h3>

        {/* Variant selector */}
        {variants.length > 0 && (
          <div className={styles.qtyWrap} onClick={e => e.preventDefault()}>
            <button
              className={styles.qtySelector}
              onClick={e => { e.preventDefault(); setDropOpen(v => !v) }}
            >
              <span>{opt.weight}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropOpen && (
              <div className={styles.qtyDrop}>
                {variants.map((v, i) => (
                  <div
                    key={v.id}
                    className={`${styles.qtyOption} ${i === selectedIdx ? styles.selected : ''}`}
                    onClick={() => { setSelectedIdx(i); setDropOpen(false) }}
                  >
                    <div className={styles.qtyLeft}>
                      <span className={styles.qtyWeight}>{v.weight}</span>
                      <span className={styles.qtyDisc}>{v.discount}</span>
                    </div>
                    <div className={styles.qtyRight}>
                      <span className={styles.qtyPrice}>₹{v.price}</span>
                      <span className={styles.qtyOrig}>₹{v.mrp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.priceRow}>
          <span className={styles.priceNow}>₹ {opt.price}</span>
          {opt.mrp && opt.mrp !== opt.price && (
            <span className={styles.priceOrig}>₹{opt.mrp}</span>
          )}
        </div>

        {isOutOfStock && (
          <p className={styles.outOfStock}>Out of stock</p>
        )}

        {!isOutOfStock && isLowStock && (
          <p className={styles.lowStock}>Only {opt.stock} left</p>
        )}

        <div className={styles.actionRow} onClick={e => e.preventDefault()}>
          {/* Wishlist */}
          <button
            className={`${styles.wishBtn} ${isWished(product.id) ? styles.wished : ''}`}
            onClick={handleWish}
            aria-label="Wishlist"
          >
            <svg viewBox="0 0 24 24" strokeWidth="1.8" width="18" height="18"
              fill={isWished(product.id) ? '#c0392b' : 'none'}
              stroke={isWished(product.id) ? '#c0392b' : '#888'}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Cart stepper */}
          <div className={`${styles.cartArea} ${qty > 0 ? styles.active : ''}`}>
            {qty === 0 ? (
              <button
                className={`${styles.cartBtn} ${isOutOfStock ? styles.disabled : ''}`}
                onClick={handleAdd}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of stock" : "Add to cart"}
              </button>
            ) : (
              <div className={styles.stepper}>
                <button className={styles.stepBtn} onClick={handleMinus}>−</button>
                <span className={styles.stepCount}>{qty}</span>
                <button className={styles.stepBtn} onClick={handlePlus} disabled={qty >= opt.stock}>+</button>
              </div>

            )}
          </div>
        </div>
      </div>
    </Link>
  )
}