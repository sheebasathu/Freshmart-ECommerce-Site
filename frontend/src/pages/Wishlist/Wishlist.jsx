// src/pages/Wishlist/Wishlist.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../../hooks/useWishlist'
import { useCart }     from '../../hooks/useCart'
import { useAuth }     from '../../hooks/useAuth'
import styles from './Wishlist.module.css'

export default function Wishlist() {
  const { items, toggle, isWished } = useWishlist()
  const { addItem }                 = useCart()
  const { user }                    = useAuth()
  const navigate                    = useNavigate()

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>🔒</div>
      <h2 className={styles.emptyTitle}>Please log in to view your Wishlist</h2>
      <p className={styles.emptyText}>Save your favourite products and shop them anytime.</p>
      <Link to="/login" className={styles.shopBtn}>Login / Sign Up</Link>
    </div>
  )

  // ── Empty wishlist ─────────────────────────────────────────────────────────
  if (!items.length) return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>❤️</div>
      <h2 className={styles.emptyTitle}>Your Wishlist is Empty</h2>
      <p className={styles.emptyText}>Save items you love and come back to them later.</p>
      <Link to="/listing" className={styles.shopBtn}>Browse Products</Link>
    </div>
  )

  // ── Helpers ────────────────────────────────────────────────────────────────
  /**
   * Get primary image URL from the API product shape.
   * API returns: { primary_image: "http://...", images: [{image_url, is_primary, ...}], ... }
   */
  const getImage = (product) => {
    // Try full images array first
    if (product.images?.length) {
      const primary = product.images.find(img => img.is_primary) || product.images[0]
      return primary?.image_url || '/images/capsicumdefault.png'
    }
    // Fall back to the shorthand primary_image URL string
    return product.primary_image || '/images/capsicumdefault.png'
  }

  /**
   * Get cheapest variant (first active variant from API).
   * API shape: variants: [{ id, weight, price, mrp, discount, in_stock }, ...]
   */
  const getVariant = (product) => {
    return product.variants?.[0] || {}
  }

  const handleAddToCart = (product) => {
    const variant = getVariant(product)
    if (!variant.id) return
    // CartContext.addItem expects (variantId: number, quantity: number)
    addItem(variant.id, 1)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className="wrap">

        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Wishlist</h1>
            <p className={styles.pageSubtitle}>
              {items.length} saved item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/listing" className={styles.continueShopping}>
            ← Continue Shopping
          </Link>
        </div>

        {/* Wishlist grid */}
        <div className={styles.grid}>
          {items.map(product => {
            const img     = getImage(product)
            const variant = getVariant(product)
            const wished  = isWished(product.id)

            return (
              <div key={product.id} className={styles.card}>

                {/* Remove from wishlist button */}
                <button
                  className={styles.removeBtn}
                  onClick={() => toggle(product)}
                  aria-label="Remove from wishlist"
                  title="Remove"
                >
                  ✕
                </button>

                {/* Wish heart badge */}
                <button
                  className={`${styles.heartBtn} ${wished ? styles.heartActive : ''}`}
                  onClick={() => toggle(product)}
                  aria-label="Toggle wishlist"
                >
                  {wished ? '♥' : '♡'}
                </button>

                {/* Product image */}
                <div
                  className={styles.imgWrap}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img src={img} alt={product.name} loading="lazy"/>
                  {product.badge && (
                    <span className={styles.badge}>{product.badge}</span>
                  )}
                </div>

                {/* Product info */}
                <div className={styles.body}>
                  <div
                    className={styles.brand}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.brand}
                  </div>
                  <div
                    className={styles.name}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.name}
                  </div>

                  {variant.weight && (
                    <div className={styles.weight}>{variant.weight}</div>
                  )}

                  {/* Price row */}
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{variant.price}</span>
                    {variant.mrp && variant.mrp !== variant.price && (
                      <span className={styles.origPrice}>₹{variant.mrp}</span>
                    )}
                    {variant.discount && (
                      <span className={styles.discountBadge}>{variant.discount}</span>
                    )}
                  </div>

                  {/* Delivery estimate */}
                  {variant.delivery_mins && (
                    <div className={styles.deliveryInfo}>
                      ⚡ Delivery in {variant.delivery_mins} mins
                    </div>
                  )}

                  {/* Add to cart */}
                  <button
                    className={styles.addBtn}
                    onClick={() => handleAddToCart(product)}
                    disabled={!variant.in_stock}
                  >
                    {variant.in_stock ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}