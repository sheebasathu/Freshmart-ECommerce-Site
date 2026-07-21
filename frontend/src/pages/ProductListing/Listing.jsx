// src/pages/Listing/Listing.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ProductCard/ProductCard'
import Pagination from '../../components/Pagination/Pagination'
import { getProducts, getCategories } from '../../api/index'
import styles from './Listing.module.css'

const SORT_OPTIONS = [
  { value: 'default', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
]

// Map frontend sort values → backend ordering param.
// 'default' omitted intentionally → no ?ordering= sent → backend default applies.
const SORT_MAP = {
  'price-asc': 'min_price',
  'price-desc': '-min_price',
  'name-asc': 'name',
}

export default function Listing() {
  const [searchParams, setSearchParams] = useSearchParams()

  // URL is the single source of truth for active filters
  const urlCat = searchParams.get('category') || ''
  const urlSubcat = searchParams.get('subcategory') || ''
  const urlSearch = searchParams.get('search') || ''
  const isBestSelling = searchParams.get('is_best_selling') === 'true'
  const isFeatured = searchParams.get('is_featured') === 'true'
  const page = Number(searchParams.get('page') || 1)

  // Support comma-separated subcategory slugs from Home "View All" links
  const activeSubcats = urlSubcat ? urlSubcat.split(',').map(s => s.trim()).filter(Boolean) : []

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('default')
  const [maxPrice, setMaxPrice] = useState(500)



  // Load categories with embedded subcategories once
  useEffect(() => {
    getCategories().then(setCategories).catch(() => { })
  }, [])

  // Reset to page 1 whenever any filter changes
  // useEffect(() => {
  //   setPage(1)
  // }, [urlCat, urlSubcat, urlSearch, sort, maxPrice, isBestSelling, isFeatured])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        // Best-selling uses a dedicated no-pagination endpoint
        // if (isBestSelling) {
        //   const data = await getBestSellingProducts()
        //   setProducts(Array.isArray(data) ? data : (data.results || []))
        //   setPagination(null)
        //   return
        // }
        const qp = { page }
        if (maxPrice) qp.max_price = maxPrice
        if (urlSearch) qp.search = urlSearch
        if (urlSubcat) {
          qp.subcategory = urlSubcat
        } else if (urlCat) {
          qp.category = urlCat
        }
        if (isFeatured) qp.is_featured = 'true'
        if (isBestSelling) qp.is_best_selling = 'true' 
        if (SORT_MAP[sort]) qp.ordering = SORT_MAP[sort]

        const data = await getProducts(qp)

        if (Array.isArray(data)) {
          setProducts(data)
          setPagination(null)
        } else {
          setProducts(data.results || [])
          setPagination({
            count: data.count,
            totalPages: data.total_pages ?? Math.ceil(data.count / 9),
            currentPage: data.current_page ?? page,
            next: data.next,
            previous: data.previous,
          })
        }
      } catch (e) {
        console.error('Listing fetch error:', e)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [page, sort, maxPrice, urlSearch, urlCat, urlSubcat, isBestSelling, isFeatured])

  // Sidebar helpers — all mutations update the URL, keeping it as source of truth

  const toggleCategory = (slug) => {
    const next = new URLSearchParams(searchParams)
    next.delete('subcategory')
    next.delete('is_best_selling')
    next.delete('is_featured')
    if (urlCat === slug) next.delete('category')
    else next.set('category', slug)

    next.set('page', 1)

    setSearchParams(next)
  }

  const toggleSubcategory = (categorySlug, subSlug) => {
    const next = new URLSearchParams(searchParams)
    next.set('category', categorySlug)
    next.delete('is_best_selling')
    next.delete('is_featured')
    const current = next.get('subcategory') || ''
    let values = current ? current.split(',') : []
    if (values.includes(subSlug)) {
      values = values.filter(v => v !== subSlug)
    } else {
      values.push(subSlug)
    }
    if (values.length === 0) next.delete('subcategory')
    else next.set('subcategory', values.join(','))

    next.set('page', 1)

    setSearchParams(next)
  }

  const clearFilters = () => {
    const next = new URLSearchParams()

    next.set('page', 1)

    setSearchParams(next)
  }

  // Derived values for header display
  const activeCategory = categories.find(c => c.slug === urlCat)
  const activeSub = activeSubcats.length === 1
    ? activeCategory?.subcategories?.find(s => s.slug === activeSubcats[0])
    : null

  const pageTitle = urlSearch
    ? `Results for "${urlSearch}"`
    : isBestSelling
      ? 'Best Selling'
      : isFeatured
        ? 'Featured Offers'
        : activeSub?.name 
          ? activeSub.name
          : activeCategory?.name 
            ? activeCategory.name 
            :'All Products'

  const totalCount = pagination?.count ?? products.length

  const handlePageChange = (p) => {

    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    setSearchParams(next)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.inner} wrap`}>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <h3 className={styles.filterTitle}>Filters</h3>

          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Category</div>

            {categories.map(cat => (
              <div key={cat.id} className={styles.catBlock}>

                {/* Category-level checkbox */}
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={urlCat === cat.slug}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span>{cat.icon} {cat.name}</span>
                </label>

                {/* Subcategory rows — only shown when parent is active */}
                {urlCat === cat.slug && cat.subcategories?.length > 0 && (
                  <div className={styles.subcatList}>
                    {cat.subcategories.map(sub => (
                      <label key={sub.id} className={styles.subCheckRow}>
                        <input
                          type="checkbox"
                          checked={activeSubcats.includes(sub.slug)}
                          onChange={() => toggleSubcategory(cat.slug, sub.slug)}
                        />
                        <span>{sub.icon} {sub.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {(urlCat || urlSubcat || isBestSelling || isFeatured) && (
              <button className={styles.clearBtn} onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          {/* Price slider — hidden for best-selling (endpoint ignores price param) */}
          {!isBestSelling && (
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Max Price: ₹{maxPrice}</div>
              <input
                type="range" min="50" max="500" step="10"
                value={maxPrice}
                onChange={e => setMaxPrice(+e.target.value)}
                className={styles.range}
              />
              <div className={styles.rangeLabels}><span>₹50</span><span>₹500</span></div>
            </div>
          )}
        </aside>

        {/* MAIN */}
        <div className={styles.main}>
          <div className={styles.topBar}>
            <div>
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
              {!loading && (
                <p className={styles.count}>
                  {totalCount} product{totalCount !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            {!isBestSelling && (
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            /* Skeleton grid while fetching */
            <div className={styles.grid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <h2>No products found</h2>
              <p>Try adjusting your filters or search term</p>
              <button
                className={styles.resetBtn}
                onClick={() => { setMaxPrice(500); setSort('default'); setSearchParams({}) }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {pagination && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}