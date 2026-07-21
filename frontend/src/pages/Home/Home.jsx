// src/pages/Home/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductCard         from '../../components/ProductCard/ProductCard'
import SpecialCategoryCard from '../../components/Specialcategorycard/Specialcategorycard'
import {
  getHomepageContent,
  getFeaturedProducts,
  getBestSellingProducts,
} from '../../api/index'
import styles from './Home.module.css'

export default function Home() {
  const navigate = useNavigate()

  const [cms,         setCms]         = useState(null)
  const [smartBasket, setSmartBasket] = useState([])
  const [bestSelling, setBestSelling] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getHomepageContent(),
      getFeaturedProducts(),
      getBestSellingProducts(),
    ])
      .then(([cmsData, featured, best]) => {
        setCms(cmsData)
        setSmartBasket(Array.isArray(featured) ? featured.slice(0, 4) : [])
        setBestSelling(Array.isArray(best)     ? best.slice(0, 4)     : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{
        width:40, height:40,
        border:'4px solid #e5e7eb', borderTopColor:'#21B421',
        borderRadius:'50%', animation:'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const heroBanners  = cms?.hero_banners      || []
  const promoBanners = cms?.promo_banners     || []
  const topOffers    = cms?.top_offer_banners || []
  const featuredSecs = cms?.featured_sections || []
  const shopCats     = cms?.shop_categories   || []
  const popularPills = cms?.popular_pills     || []
  const fruitsVegs   = cms?.fruits_vegetables || []
  const dailyDeals   = cms?.daily_deals       || []

  // Build listing URL: prefer subcategory → category → fallback
  const cardUrl = (card, fallback = '/listing') => {
    console.log("CARD DATA:", card) 
    if (card.subcategory_slug)
      return `/listing?subcategory=${card.subcategory_slug}`
    if (card.category_slug)
      return `/listing?category=${card.category_slug}`
    return fallback
  }

  return (
    <div className={styles.home}>

      {/* HERO */}
      <section
        className={styles.hero}
        style={heroBanners[0]?.image_url ? {
          backgroundImage: `linear-gradient(45deg, rgba(49,50,49,0.6)), url(${heroBanners[0].image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        <div className={styles.heroInner}>
          {heroBanners[0] ? (
            <>
              <h1 className={styles.heroTitle}>
                {(() => {
                  const title     = heroBanners[0]?.title || ''
                  const highlight = heroBanners[0]?.highlight_title
                  if (!highlight || !title.includes(highlight)) return title
                  const [before, after] = title.split(highlight)
                  return (
                    <>
                      {before}
                      <span style={{ color: heroBanners[0].highlight_color || '#4ade80' }}>
                        {highlight}
                      </span>
                      {after}
                    </>
                  )
                })()}
              </h1>
              {heroBanners[0].subtitle && <p>{heroBanners[0].subtitle}</p>}
              <button className={styles.heroBtn}
                onClick={() => navigate(heroBanners[0].cta_link || '/listing')}>
                {heroBanners[0].cta_text || 'Shop Now'}
              </button>
            </>
          ) : (
            <>
              <h1>
                <span className={styles.heroGreen}>FreshMart:</span>
                <span className={styles.heroWhite}> Your Daily Needs Delivered</span>
              </h1>
              <p>Shop groceries, fresh produce &amp; essentials delivered in 10 minutes.</p>
              <button className={styles.heroBtn} onClick={() => navigate('/listing')}>Shop Now</button>
            </>
          )}
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      {popularPills.length > 0 && (
        <section className={`${styles.popular} wrap`}>
          <h2 className={styles.secTitle}>Popular Categories</h2>
          <div className={styles.pills}>
            {popularPills.map(c => (
              <button key={c.id} className={styles.pill} onClick={() => navigate(c.path)}>
                {c.icon && <span className={styles.iconpill}>{c.icon}</span>}
                {c.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED OFFERS */}
      {featuredSecs.length > 0 && (
        <section className={`${styles.featured} wrap`}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Featured Offers</h2>
            <button className={styles.viewAll}
              onClick={() => navigate('/listing?is_featured=true')}>View All</button>
          </div>
          <div className={styles.featGrid}>
            {featuredSecs.map(f => (
              <div key={f.id} className={styles.featCard}
                onClick={() => navigate(cardUrl(f, '/listing?is_featured=true'))}>
                <img src={f.image_url} alt={f.title} loading="lazy"/>
                <div className={styles.featBody}>
                  <h3>{f.title}</h3>
                  {f.subtitle && <p>{f.subtitle}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SMART BASKET */}
      {smartBasket.length > 0 && (
        <section className={`${styles.prodSec} wrap`} aria-label="Smart Basket">
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Smart Basket</h2>
            <button className={styles.viewAll}
              onClick={() => navigate('/listing?is_featured=true')}>View All</button>
          </div>
          <div className={styles.prodGrid}>
            {smartBasket.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        </section>
      )}

      {/* BEST SELLING */}
      {bestSelling.length > 0 && (
        <section className={`${styles.prodSec} wrap`} aria-label="Best Selling">
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Best Selling</h2>
            <button className={styles.viewAll}
              onClick={() => navigate('/listing?is_best_selling=true')}>View All</button>
          </div>
          <div className={styles.prodGrid}>
            {bestSelling.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        </section>
      )}

      {/* FRUITS AND VEGETABLES */}
      {fruitsVegs.length > 0 && (
        <section className={`${styles.specialSec} wrap`}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Fruits and Vegetables</h2>
            <button className={styles.viewAll}
              onClick={() => navigate('/listing?category=fruits-vegetables')}>View All</button>
          </div>
          <div className={styles.specialGrid}>
            {fruitsVegs.map(card => (
              <SpecialCategoryCard
                key={card.id}
                title={card.title}
                subtitle={card.subtitle}
                image={card.image_url}
                badge={card.badge}
                onClick={() => navigate(cardUrl(card, '/listing?category=fruits-vegetables'))}
              />
            ))}
          </div>
        </section>
      )}

      {/* SHOP BY CATEGORY */}
      {shopCats.length > 0 && (
        <section className={`${styles.sbcSec} wrap`}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Shop by Category</h2>
            <button className={styles.viewAll} onClick={() => navigate('/listing')}>View All</button>
          </div>
          <div className={styles.sbcGrid}>
            {shopCats.map(c => (
              <div key={c.id} className={styles.sbcCard}
                onClick={() => navigate(`/listing?category=${c.category_slug}`)}>
                <div className={styles.sbcImg}>
                  <img src={c.image_url} alt={c.category_name} loading="lazy"/>
                </div>
                <p className={styles.sbcName}>{c.category_name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DAILY DEALS */}
      {dailyDeals.length > 0 && (
        <section className={`${styles.specialSec} wrap`}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Daily Deals</h2>
            <button className={styles.viewAll} onClick={() => navigate('/listing')}>View All</button>
          </div>
          <div className={styles.specialGrid}>
            {dailyDeals.map(card => (
              <SpecialCategoryCard
                key={card.id}
                title={card.title}
                subtitle={card.subtitle}
                image={card.image_url}
                badge={card.badge}
                description={card.description}
                onClick={() => navigate(cardUrl(card, '/listing'))}
              />
            ))}
          </div>
        </section>
      )}

      {/* TOP OFFERS */}
      {topOffers.length > 0 && (
        <section className={`${styles.topOffers} wrap`}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Top Offers</h2>
            <button className={styles.viewAll} onClick={() => navigate('/listing')}>View All</button>
          </div>
          <div className={styles.offersGrid}>
            {topOffers.map(o => (
              <div key={o.id} className={styles.offerCard}
                onClick={() => navigate(o.cta_link || '/listing')}>
                <div className={styles.offerImgWrap}>
                  <img src={o.image_url} alt={o.title} loading="lazy"/>
                </div>
                <div className={styles.offerText}>
                  <div className={styles.offerTitle}>{o.title}</div>
                  {o.subtitle && <div className={styles.offerSub}>{o.subtitle}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROMO BANNER */}
      {promoBanners[0] && (
        <section className={`${styles.dpoBanner} wrap`}>
          <div className={styles.dpoInner}>
            <div className={styles.dpoImg}>
              <img src={promoBanners[0].image_url} alt={promoBanners[0].title} loading="lazy"/>
            </div>
            <div className={styles.dpoContent}>
              <h2 className={styles.dpoHeading}>{promoBanners[0].title}</h2>
              {promoBanners[0].subtitle && (
                <h5 className={styles.dpoSubtitle}>{promoBanners[0].subtitle}</h5>
              )}
              {promoBanners[0].description && (
                <p className={styles.dpoDesc}>{promoBanners[0].description}</p>
              )}
              <button className={styles.dpoBtn}
                onClick={() => navigate(promoBanners[0].cta_link || '/listing')}>
                {promoBanners[0].cta_text || 'Shop Now'}
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}