/**
 * src/components/Specialcategorycard/Specialcategorycard.jsx
 *
 * Card used in the "Fruits and Vegetables" and "Daily Deals" homepage sections.
 * Receives CMS data from the HomepageContentView API response:
 *   { title, subtitle, image_url, badge, description?, onClick }
 */
import styles from './Specialcategorycard.module.css'

export default function SpecialCategoryCard({
  title,
  subtitle,
  image,
  badge,
  description,
  onClick,
}) {
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}>

      {/* Image */}
      <div className={styles.imgWrap}>
        <img
          src={image || '/images/capsicumdefault.png'}
          alt={title}
          loading="lazy"
          className={styles.img}
        />
      </div>

      {/* Text body */}
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>

        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}

        {description && (
          <p className={styles.description}>{description}</p>
        )}

        {/* Badge row — e.g. "MIN 27% OFF" */}
        {badge && (
          <div className={styles.offerRow}>
            <span className={styles.offerBar} aria-hidden="true"/>
            <span className={styles.offerBadge}>{badge}</span>
          </div>
        )}
      </div>
    </div>
  )
}