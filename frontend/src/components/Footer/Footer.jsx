import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} wrap`}>
        <div className={styles.brand}>
          <div className={styles.footLogo}>
            <span>🛒</span>
            <span className={styles.footLogoText}><span className={styles.green}>Fresh</span>Mart</span>
          </div>
          <p className={styles.desc}>
            Fresh groceries and daily essentials delivered to your door in 10 minutes.
            Quality you can trust, speed you'll love.
          </p>
          <div className={styles.appBtns}>
            <a href="#" className={styles.appBtn}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
            <a href="#" className={styles.appBtn}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="m3.18 23.76 9.31-9.31-9.31-9.31C2.77 5.55 2.5 6.13 2.5 6.83v10.34c0 .7.27 1.28.68 1.69zm11.12-11.12 2.26-2.26-9.5-5.49c-.62-.36-1.28-.39-1.84-.12l9.08 7.87zm2.26 2.26-2.26-2.26-9.08 7.87c.56.27 1.22.24 1.84-.12l9.5-5.49zm1.46-1.46 1.85-1.07c.69-.4.69-1.05 0-1.45l-1.85-1.07-2.5 2.29 2.5 2.3z"/>
              </svg>
              Google Play
            </a>
          </div>
        </div>

        <div className={styles.links}>
          <h4>Company</h4>
          <a href="#">About Us</a><a href="#">Careers</a>
          <a href="#">Press</a><a href="#">Blog</a>
        </div>
        <div className={styles.links}>
          <h4>Help</h4>
          <a href="#">FAQ</a><a href="#">Contact Us</a>
          <a href="#">Returns</a><Link to="/track">Track Order</Link>
        </div>
        <div className={styles.links}>
          <h4>Shop</h4>
          <Link to="/listing?category=fruits">Fruits</Link>
          <Link to="/listing?category=vegetables">Vegetables</Link>
          <Link to="/listing?category=snacks">Snacks</Link>
          <Link to="/listing">All Products</Link>
        </div>
        <div className={styles.links}>
          <h4>Follow Us</h4>
          <div className={styles.socBtns}>
            <a href="#" className={styles.socBtn} title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="#" className={styles.socBtn} title="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" className={styles.socBtn} title="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className={styles.hr}><hr/></div>
      <div className={styles.copy}>Copyright © 2025–2027 FreshMart — Supermarket Grocery Supplies Pvt Ltd</div>
    </footer>
  )
}