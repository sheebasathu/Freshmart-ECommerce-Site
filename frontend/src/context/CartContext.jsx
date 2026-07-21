/**
 * src/context/CartContext.jsx
 * Backend-synced cart — replaces localStorage-only implementation.
 * All add/update/remove operations hit Django API and update state from response.
 */
import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { AuthContext } from './AuthContext'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart as apiClearCart } from '../api/index'

export const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user }    = useContext(AuthContext)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch cart whenever user logs in / changes
  useEffect(() => {
    if (!user) { setCart(null); return }
    setLoading(true)
    getCart()
      .then(setCart)
      .catch(e => console.error('CartContext:', e))
      .finally(() => setLoading(false))
  }, [user])

  /**
   * addItem(variantId, quantity)
   * variantId — the Django ProductVariant PK
   */
  const addItem = useCallback(async (variantId, quantity = 1) => {
  if (!user) return

  console.log("addItem received:", variantId, typeof variantId)

  const updated = await addToCart(variantId, quantity)
  setCart(updated)
}, [user])

  /**
   * setQty(cartItemId, quantity)
   * cartItemId — the Django CartItem PK (item.id in cart.items[])
   * quantity=0 removes the item
   */
  const setQty = useCallback(async (cartItemId, quantity) => {
    const updated = await updateCartItem(cartItemId, quantity)
    setCart(updated)
  }, [])

  /**
   * removeItem(cartItemId)
   */
  const removeItem = useCallback(async (cartItemId) => {
    const updated = await removeCartItem(cartItemId)
    setCart(updated)
  }, [])

  /**
   * clearCart()
   */
  const clearCart = useCallback(async () => {
    await apiClearCart()
    setCart(prev => prev ? { ...prev, items: [], total_items: 0, subtotal: '0.00' } : null)
  }, [])

  const items      = cart?.items       || []
  const totalItems = cart?.total_items || 0
  const totalPrice = parseFloat(cart?.subtotal || '0')

  return (
    <CartContext.Provider value={{ cart, items, totalItems, totalPrice, loading, addItem, setQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}