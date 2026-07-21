/**
 * src/components/Pagination/Pagination.jsx
 * Windowed pagination bar used by the Listing page.
 * Props:
 *   currentPage  {number}   1-based current page
 *   totalPages   {number}   total number of pages
 *   onPageChange {function} called with the new page number
 */
import styles from './Pagination.module.css'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  // Build the page number sequence with ellipsis gaps
  // e.g. [1, '…', 4, 5, 6, '…', 12]
  const range = []
  for (let n = 1; n <= totalPages; n++) {
    if (
      n === 1 ||
      n === totalPages ||
      Math.abs(n - currentPage) <= 1
    ) {
      range.push(n)
    } else if (range[range.length - 1] !== '…') {
      range.push('…')
    }
  }

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      {/* Prev */}
      <button
        className={styles.btn}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {/* Page buttons */}
      {range.map((item, idx) =>
        item === '…' ? (
          <span key={`ellipsis-${idx}`} className={styles.ellipsis}>…</span>
        ) : (
          <button
            key={item}
            className={`${styles.btn} ${item === currentPage ? styles.active : ''}`}
            onClick={() => item !== currentPage && onPageChange(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </button>
        )
      )}

      {/* Next */}
      <button
        className={styles.btn}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  )
}