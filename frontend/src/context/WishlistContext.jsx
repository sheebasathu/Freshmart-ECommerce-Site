/**
 * src/context/WishlistContext.jsx
 * Backend-synced wishlist — replaces localStorage implementation.
 */
import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { AuthContext } from './AuthContext'
import { getWishlist, toggleWishlist } from '../api/index'

export const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user }  = useContext(AuthContext)
  const [items,   setItems]   = useState([])
  const [wishSet, setWishSet] = useState(new Set())   // O(1) isWished lookup

  useEffect(() => {
    if (!user) { setItems([]); setWishSet(new Set()); return }
    getWishlist()
      .then(data => {
        setItems(data)
        setWishSet(new Set(data.map(p => p.id)))
      })
      .catch(() => {})
  }, [user])

  const toggle = useCallback(async (product) => {
    if (!user) return false
    try {
      const result = await toggleWishlist(product.id)
      if (result.wishlisted) {
        setItems(prev => [...prev, product])
        setWishSet(prev => new Set([...prev, product.id]))
      } else {
        setItems(prev => prev.filter(p => p.id !== product.id))
        setWishSet(prev => { const s = new Set(prev); s.delete(product.id); return s })
      }
      return result.wishlisted
    } catch (e) {
      console.error('Wishlist toggle error:', e)
      return false
    }
  }, [user])

  const isWished = useCallback((id) => wishSet.has(id), [wishSet])

  return (
    <WishlistContext.Provider value={{ items, toggle, isWished }}>
      {children}
    </WishlistContext.Provider>
  )
}