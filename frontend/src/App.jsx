// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Home            from './pages/Home/Home'
import Listing         from './pages/ProductListing/Listing'
import ProductDetail   from './pages/ProductDetail/ProductDetail'
import Cart            from './pages/Cart/Cart'
import Checkout        from './pages/Checkout/Checkout'
import Login           from './pages/Auth/Login'
import Signup          from './pages/Auth/Signup'
import Profile         from './pages/Dashboard/Profile'
import Wishlist        from './pages/Wishlist/Wishlist'
import OrderTracking   from './pages/OrderTracking/OrderTracking'
import OrderSuccess    from './pages/OrderSuccess/OrderSuccess'
import DeliveryAddress from './pages/DeliveryAddress/DeliveryAddress'

export default function App() {
  return (
    <Routes>
      {/* Public routes wrapped in Layout (Header + Footer) */}
      <Route element={<Layout />}>
        <Route path="/"           element={<Home />} />
        <Route path="/listing"    element={<Listing />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart"       element={<Cart />} />
        <Route path="/wishlist"   element={<Wishlist />} />
        <Route path="/track/"      element={<OrderTracking />} />
        <Route path="/order-success" element={<OrderSuccess />} />

        {/* Protected — must be logged in */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout"         element={<Checkout />} />
          <Route path="/dashboard"        element={<Profile />} />
          <Route path="/delivery-address" element={<DeliveryAddress />} />
        </Route>
      </Route>

      {/* Auth pages — full screen, no Layout */}
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}