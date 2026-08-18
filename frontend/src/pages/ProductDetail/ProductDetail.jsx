/**
 * src/pages/ProductDetail/ProductDetail.jsx
 *
 * Pixel-perfect replication of the FreshMart product-detail screenshots.
 *
 * Layout order (top → bottom):
 *  1. Breadcrumb
 *  2. Hero  :  [4 thumbnails] [main image ← →] [brand / title / price / CTA / pack-sizes]
 *  3. About : product name as h2 title, bordered box with "About the product" + body
 *  4. Customer Reviews : avg score + rating bars + review cards + write-review form
 *  5. Product Specifications : 2-col keyed table from product.specs JSON
 *  6. Related Products : 3-col image card grid
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'
import { useAuth } from '../../hooks/useAuth'
import { getProductById, getReviews, submitReview, likeReview } from '../../api/index'
import styles from './ProductDetail.module.css'

/* ── Star widget ─────────────────────────────────────────────────────────────
   size       : px font-size
   interactive: enables hover + click for review form
   onRate     : callback(n) when a star is clicked                            */
function Stars({ rating = 0, size = 16, interactive = false, onRate }) {
  const [hover, setHover] = useState(0)
  const active = interactive ? (hover || rating) : rating
  return (
    <div className={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={styles.star}
          style={{ fontSize: size, color: i <= active ? '#f5a623' : '#d1d5db' }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(i)}
        >★</span>
      ))}
    </div>
  )
}

/* ── Bookmark SVG (exactly matches Save for later icon in screenshot) ────── */
function BookmarkIcon({ filled }) {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2h12v14l-6-4-6 4V2z" fill={filled ? 'currentColor' : 'none'} />
    </svg>
  )
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { addItem, items, setQty, removeItem } = useCart()
  const { toggle, isWished } = useWishlist()
  const { user } = useAuth()

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [activeImg, setActiveImg] = useState(0)   // index into images[]
  const [selectedVar, setSelectedVar] = useState(0)   // index into variants[]
  const [toast, setToast] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [newText, setNewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    setActiveImg(0)
    setSelectedVar(0)
    setLoading(true)
    Promise.all([
      getProductById(id),
      getReviews(id).catch(() => []),
    ])
      .then(([prod, revData]) => {
        setProduct(prod)
        setReviews(Array.isArray(revData) ? revData : (revData.results || []))
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  /* ── Toast helper ───────────────────────────────────────────────────────── */
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  /* ── Guards ─────────────────────────────────────────────────────────────── */
  if (loading) return <Spinner />
  if (!product) return (
    <div className={styles.notFound}>
      <h2>Product not found</h2>
      <button onClick={() => navigate('/listing')}>Back to listing</button>
    </div>
  )

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const variants = product.variants || []
  const opt = variants[selectedVar] || {}
  const isOutOfStock = opt.stock === 0
  const isLowStock = opt.stock > 0 && opt.stock <= 5

  // Build exactly 4 image slots from product.images array (each has image_url)
  // Fall back to primary_image string if images array is empty / absent.
  const rawImages = product.images?.length
    ? product.images.map(img => img?.image_url).filter(Boolean)
    : [product.primary_image].filter(Boolean)

  // We show up to 4 thumbnails; if fewer images exist we just show what we have
  const images = rawImages.slice(0, 4)

  // Cart state for the currently selected variant
  const cartItem = items.find(i => i.variant === opt.id || i.variant_id === opt.id)
  const qty = cartItem?.quantity || 0

  // Rating distribution — backend returns { "5": 40, "4": 30, ... }
  const ratingDist = product.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  // Related products embedded in the detail serializer
  const relatedProducts = product.related_products || []

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleAdd = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOutOfStock) {
      showToast('Out of stock')
      return
    }

    if (!opt.id || !product.id) return

    addItem(opt.id, 1)
    showToast('Added to cart ✓')
  }

  const handleSave = () => {
    if (!user) { navigate('/login'); return }
    toggle(product)
    showToast(isWished(product.id) ? 'Removed from saved' : 'Saved ✓')
  }

  const handlePrevImg = () =>
    setActiveImg(i => (i - 1 + images.length) % images.length)
  const handleNextImg = () =>
    setActiveImg(i => (i + 1) % images.length)

  const handleSubmitReview = async () => {
    if (!user) { navigate('/login'); return }
    if (!newRating) { showToast('Please select a rating'); return }
    if (!newText.trim()) { showToast('Please write a review'); return }
    setSubmitting(true)
    try {
      const rev = await submitReview(product.id, { rating: newRating, body: newText.trim() })
      setReviews(prev => [rev, ...prev])
      setNewRating(0); setNewText('')
      showToast('Review submitted ✓')
    } catch (e) {
      showToast(e.response?.data?.detail || 'Could not submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (reviewId) => {
    try {
      const r = await likeReview(reviewId)
      setReviews(prev => prev.map(rv =>
        rv.id === reviewId ? { ...rv, likes: r.likes } : rv
      ))
    } catch { showToast('Could not like review.') }
  }

  /* ── Helpers for displaying review date as "2 weeks ago" style ─────────── */
  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return 'Today'
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`
  }

  /* ── Specs: from product.specs JSON (key-value pairs) ───────────────────── */
  const specEntries = (product.specifications && product.specifications.length > 0)
    ? [...product.specifications]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(s => [s.key, s.value])
    : (product.specs ? Object.entries(product.specs) : [])

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Toast ───────────────────────────────────────────────────────────── */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Breadcrumb ──────────────────────────────────────────────────────── */}
      {/*  Home / Fruits & Vegetables / Fresh Vegetables / capsicum-Green    */}
      <div className={`${styles.breadcrumb} wrap`}>
        <Link to="/">Home</Link>
        <span className={styles.sep}>/</span>
        {product.category && (
          <>
            <Link to={`/listing?category=${product.category.slug}`}>
              {product.category.name}
            </Link>
            <span className={styles.sep}>/</span>
          </>
        )}
        {product.subcategory && (
          <>
            <Link to={`/listing?category=${product.category?.slug}&subcategory=${product.subcategory.slug}`}>
              {product.subcategory.name}
            </Link>
            <span className={styles.sep}>/</span>
          </>
        )}
        <span className={styles.crumbCur}>{product.slug || product.name}</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          3-column: thumbnails | main image | info + CTA + pack sizes
      ══════════════════════════════════════════════════════════════════ */}
      <div className={`${styles.heroWrap} wrap`}>

        {/* Col 1 — Vertical thumbnail strip (exactly 4 slots) */}
        <div className={styles.thumbCol}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`${styles.thumb} ${activeImg === i ? styles.thumbActive : ''}`}
              onClick={() => setActiveImg(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img} alt={`${product.name} ${i + 1}`} loading="lazy" />
            </button>
          ))}
          {/* Fill remaining slots if fewer than 4 images */}
          {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, i) => (
            <div key={`empty-${i}`} className={`${styles.thumb} ${styles.thumbEmpty}`} />
          ))}
        </div>

        {/* Col 2 — Main image with prev/next arrows bottom-right */}
        <div className={styles.mainImgCol}>
          <div className={styles.mainImgWrap}>
            <img
              key={images[activeImg]}          /* key forces re-render → natural fade */
              className={styles.mainImg}
              src={images[activeImg] || ''}
              alt={product.name}
            />
            {images.length > 1 && (
              <div className={styles.imgArrows}>
                <button className={styles.arrow} onClick={handlePrevImg} aria-label="Previous">←</button>
                <button className={styles.arrow} onClick={handleNextImg} aria-label="Next">→</button>
              </div>
            )}
          </div>
        </div>

        {/* Col 3 — Product info */}
        <div className={styles.infoCol}>

          {/* Brand in green */}
          <div className={styles.brand}>{product.brand}</div>

          {/* Product title includes selected variant weight */}
          <h1 className={styles.productTitle}>
            {product.name}{opt.weight ? `, ${opt.weight}` : ''}
          </h1>

          {/* Pricing */}
          <div className={styles.mrpRow}>
            MRP: <s>₹{opt.mrp}</s>
          </div>
          <div className={styles.priceRow}>
            Price <span className={styles.priceAmt}>₹{opt.price}</span>
          </div>
          <div className={styles.saveRow}>
            You save: {opt.discount}
          </div>
          <div className={styles.taxRow}>(Inclusive of all taxes)</div>

          {/* CTAs — Add to Basket (red) + Save for later (white outline) */}
          {isOutOfStock && (
            <p className={styles.outOfStockText}>Out of stock</p>
          )}

          {!isOutOfStock && isLowStock && (
            <p className={styles.lowStockText}>Only {opt.stock} left</p>
          )}
          <div className={styles.ctaRow}>
            {qty === 0 ? (
              <button
                className={`${styles.btnAdd} ${isOutOfStock ? styles.disabledBtn : ''}`}
                onClick={handleAdd}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of stock' : 'Add to Basket'}
              </button>
            ) : (
              <div className={styles.stepper}>
                <button
                  className={styles.stepperBtn}
                  onClick={() => qty <= 1 ? removeItem(cartItem.id) : setQty(cartItem.id, qty - 1)}
                >−</button>
                <span className={styles.stepperQty}>{qty}</span>
                <button
                  className={styles.stepperBtn}
                  onClick={() => {
                    if (qty >= opt.stock) {
                      showToast('No more stock available')
                      return
                    }
                    setQty(cartItem.id, qty + 1)
                  }}
                >
                  +
                </button>
              </div>
            )}
            <button
              className={`${styles.btnSave} ${isWished(product.id) ? styles.btnSaved : ''}`}
              onClick={handleSave}
            >
              <BookmarkIcon filled={isWished(product.id)} />
              {isWished(product.id) ? 'Saved' : 'Save for later'}
            </button>
          </div>

          {/* Pack sizes — shown when there is more than one variant */}
          {variants.length > 0 && (
            <div className={styles.packSection}>
              <div className={styles.packTitle}>Pack Sizes</div>
              <div className={styles.packList}>
                {variants.map((v, i) => (
                  <div
                    key={v.id}
                    className={`${styles.packItem}
                    ${selectedVar === i ? styles.packSelected : ''}
                    ${v.stock === 0 ? styles.packDisabled  : ''}`}
                    onClick={() => {
                      if (v.stock !== 0) setSelectedVar(i);
                    }}
                  >
                    {/* Weight label */}
                    <span className={styles.packWeight}>{v.weight}</span>

                    {/* Price block */}
                    <div className={styles.packPriceBlock}>
                      <span className={styles.packPrice}>₹{v.price}</span>
                      <div className={styles.packPriceMeta}>
                        <span className={styles.packMrp}>₹{v.mrp}</span>
                        <span className={styles.packDiscount}>{v.discount}</span>
                      </div>
                    </div>

                    {/* Delivery badge */}
                    <div className={styles.packDelivery}>
                      ⚡ {v.delivery_mins} MINS
                    </div>

                    {/* Selected checkmark */}
                    {selectedVar === i && (
                      <span className={styles.packCheck}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — ABOUT PRODUCT
          Product name as section title (h2), bordered box below
          "About the product" label + body text + optional recipe link
      ══════════════════════════════════════════════════════════════════ */}
      {(product.description || product.product_description) && (
        <div className={`${styles.section} wrap`}>
          {/* product.display_title comes from the separate ProductDescription
              model (if set), otherwise falls back to product.name            */}
          <h2 className={styles.sectionHeading}>
            {product.display_title || product.name}
          </h2>
          <div className={styles.aboutBox}>
            <p className={styles.aboutLabel}>About the product</p>
            <p className={styles.aboutBody}>
              {product.product_description?.body || product.description}
            </p>
            {product.product_description?.recipe_url && (
              <p className={styles.aboutRecipe}>
                Don't forget to check out our delicious recipe at{' '}
                <a
                  href={product.product_description.recipe_url}
                  target="_blank" rel="noopener noreferrer"
                  className={styles.recipeLink}
                >
                  {product.product_description.recipe_url}
                </a>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — CUSTOMER REVIEWS
      ══════════════════════════════════════════════════════════════════ */}
      <div className={`${styles.section} wrap`}>
        <h2 className={styles.sectionHeading}>Customer Reviews</h2>

        {/* Summary row: big score + stars + count | rating bars */}
        <div className={styles.reviewSummaryRow}>

          {/* Left: average score */}
          <div className={styles.avgBlock}>
            <div className={styles.avgScore}>
              {(product.avg_rating || 0).toFixed(1)}
            </div>
            <Stars rating={Math.round(product.avg_rating || 0)} size={22} />
            <div className={styles.reviewCountLabel}>
              {product.review_count || reviews.length} reviews
            </div>
          </div>

          {/* Right: rating distribution bars */}
          <div className={styles.barsBlock}>
            {[5, 4, 3, 2, 1].map(n => (
              <div key={n} className={styles.barRow}>
                <span className={styles.barNum}>{n}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${ratingDist[n] || 0}%` }}
                  />
                </div>
                <span className={styles.barPct}>{ratingDist[n] || 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual review cards */}
        {reviews.length > 0 && (
          <div className={styles.reviewList}>
            {reviews.map(r => (
              <div key={r.id} className={styles.reviewCard}>
                {/* Avatar: photo or initial placeholder */}
                {r.user_avatar ? (
                  <img
                    className={styles.reviewAvatar}
                    src={r.user_avatar}
                    alt={r.user_name || 'User'}
                  />
                ) : (
                  <div className={styles.reviewInitial}>
                    {(r.user_name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className={styles.reviewContent}>
                  <div className={styles.reviewName}>{r.user_name || 'Anonymous'}</div>
                  <div className={styles.reviewTime}>{timeAgo(r.created_at)}</div>
                  <Stars rating={r.rating} size={15} />
                  <p className={styles.reviewText}>{r.body}</p>
                  <div className={styles.reviewReactions}>
                    <button
                      className={styles.reactionBtn}
                      onClick={() => handleLike(r.id)}
                    >
                      👍 {r.likes || 0}
                    </button>
                    <button className={styles.reactionBtn}>
                      👎 {r.dislikes || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {reviews.length === 0 && (
          <p className={styles.noReviews}>No reviews yet. Be the first!</p>
        )}

        {/* Write a Review form — only for logged-in users */}
        <div className={styles.writeReviewBox}>
          <h3 className={styles.writeReviewTitle}>Write a Review</h3>
          {user ? (
            <>
              <Stars
                rating={newRating}
                size={30}
                interactive
                onRate={setNewRating}
              />
              <textarea
                className={styles.reviewTextarea}
                placeholder="Share your experience with this product…"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                rows={4}
              />
              <button
                className={styles.submitBtn}
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </>
          ) : (
            <p className={styles.loginPrompt}>
              <Link to="/login" className={styles.loginLink}>Log in</Link> to write a review.
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — PRODUCT SPECIFICATIONS
          2-col keyed table. Keys: uppercase grey label. Values: bold black.
          Rows alternate white / light grey background.
          A vertical divider separates left and right columns.
      ══════════════════════════════════════════════════════════════════ */}
      {specEntries.length > 0 && (
        <div className={`${styles.section} wrap`}>
          <h2 className={styles.sectionHeading}>Product Specifications</h2>
          <div className={styles.specsTable}>
            {specEntries.map(([key, val], i) => {
              const rowIndex = Math.floor(i / 2)
              const isLeft = i % 2 === 0
              const rowBg = rowIndex % 2 === 0 ? '#fff' : '#f9fafb'
              return (
                <div
                  key={`${key}-${i}`}
                  className={`${styles.specCell} ${isLeft ? styles.specCellLeft : styles.specCellRight}`}
                  style={{ background: rowBg }}
                >
                  <div className={styles.specKey}>{key.toUpperCase()}</div>
                  <div className={styles.specVal}>{val}</div>
                </div>
              )
            })}
            {/* Pad to even number of cells so the grid closes cleanly */}
            {specEntries.length % 2 !== 0 && (
              <div
                className={`${styles.specCell} ${styles.specCellRight} ${styles.specCellEmpty}`}
                style={{ background: Math.floor(specEntries.length / 2) % 2 === 0 ? '#fff' : '#f9fafb' }}
              />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — RELATED PRODUCTS
          3-col card grid. Each card: large image, product name, price string.
          Clicking navigates to that product's detail page.
      ══════════════════════════════════════════════════════════════════ */}
      {relatedProducts.length > 0 && (
        <div className={`${styles.section} wrap`}>
          <h2 className={styles.sectionHeading}>Related Products</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map(rel => {
              const firstVar = rel.variants?.[0] || {}
              /* Price string: "₹ 100 / 500g" as visible in screenshot */
              const priceStr = firstVar.price
                ? `₹ ${firstVar.price}${firstVar.weight ? ` / ${firstVar.weight}` : ''}`
                : ''
              return (
                <div
                  key={rel.id}
                  className={styles.relatedCard}
                  onClick={() => navigate(`/product/${rel.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/product/${rel.id}`)}
                >
                  <div className={styles.relatedImgWrap}>
                    <img
                      src={rel.primary_image}
                      alt={rel.name}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.relatedInfo}>
                    <div className={styles.relatedName}>{rel.name}</div>
                    {priceStr && (
                      <div className={styles.relatedPrice}>{priceStr}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
