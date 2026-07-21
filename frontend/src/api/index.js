import client from './client'

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts            = (params = {}) => client.get('/products/', { params }).then(r => r.data)
export const getProductById         = (id)          => client.get(`/products/${id}/`).then(r => r.data)
export const getFeaturedProducts    = ()            => client.get('/products/featured/').then(r => r.data)
export const getBestSellingProducts = ()            => client.get('/products/best-selling/').then(r => r.data)
export const getCategories          = ()            => client.get('/products/categories/').then(r => r.data)
export const getSubCategories       = (categorySlug) =>
  client.get('/products/subcategories/', {
    params: categorySlug ? { category: categorySlug } : {},
  }).then(r => r.data)

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart        = ()                   => client.get('/cart/').then(r => r.data)
export const addToCart      = (variantId, qty = 1) => client.post('/cart/add/', { variant_id: Number(variantId), quantity: Number(qty)}).then(r => r.data)
export const updateCartItem = (itemId, qty)        => client.patch(`/cart/items/${itemId}/`, { quantity: qty }).then(r => r.data)
export const removeCartItem = (itemId)             => client.delete(`/cart/items/${itemId}/`).then(r => r.data)
export const clearCart      = ()                   => client.delete('/cart/').then(r => r.data)

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders        = ()     => client.get('/orders/').then(r => r.data)
export const getOrderByNumber = (num)  => client.get(`/orders/${num}/`).then(r => r.data)
export const placeOrder       = (data) => client.post('/orders/create/', data).then(r => r.data)
export const cancelOrder      = (num)  => client.post(`/orders/${num}/cancel/`).then(r => r.data)

// ── Payments ──────────────────────────────────────────────────────────────────
export const createRazorpayOrder   = (amount) => client.post('/payments/razorpay/create/', { amount }).then(r => r.data)
export const verifyRazorpayPayment = (data)   => client.post('/payments/razorpay/verify/', data).then(r => r.data)

// ── Coupons ───────────────────────────────────────────────────────────────────
export const validateCoupon = (code) => client.post('/coupons/validate/', { code }).then(r => r.data)

// ── Reviews ───────────────────────────────────────────────────────────────────
export const getReviews   = (productId)       => client.get(`/reviews/product/${productId}/`).then(r => r.data)
export const submitReview = (productId, data) => client.post(`/reviews/product/${productId}/`, data).then(r => r.data)
export const likeReview   = (reviewId)        => client.post(`/reviews/${reviewId}/like/`).then(r => r.data)

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const getWishlist    = ()    => client.get('/wishlist/').then(r => r.data)
export const toggleWishlist = (pid) => client.post('/wishlist/', { product_id: pid }).then(r => r.data)

// ── CMS / Homepage Content ────────────────────────────────────────────────────
export const getNavCategories   = () => client.get('/content/nav-categories/').then(r => r.data)
export const getNavMenus        = () => client.get('/content/nav-menus/').then(r => r.data)
export const getHomepageContent = () => client.get('/content/homepage/').then(r => r.data)