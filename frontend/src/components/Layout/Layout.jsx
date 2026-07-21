// src/components/Layout/Layout.jsx
import { Outlet } from 'react-router-dom'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'

export default function Layout() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '60vh' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}