import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import styles from './DeliveryAddress.module.css'

const ADDRESS_TYPES = ['Home', 'Work', 'Other']

function loadAddress() {
  try { return JSON.parse(localStorage.getItem('fm_address')) || {} }
  catch { return {} }
}

function saveAddress(data) {
  try { localStorage.setItem('fm_address', JSON.stringify(data)) } catch {}
}

export default function DeliveryAddress() {
  const { user } = useAuth()
  const mapRef      = useRef(null)
  const leafletRef  = useRef({ map: null, marker: null })
  const [mapReady,  setMapReady]  = useState(false)
  const [query,     setQuery]     = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [saved,     setSaved]     = useState(false)
  const [addrType,  setAddrType]  = useState('Home')

  const [form, setForm] = useState(() => {
    const a = loadAddress()
    return {
      house:    a.house    || '',
      street:   a.street   || '',
      landmark: a.landmark || '',
      city:     a.city     || '',
      postcode: a.postcode || '',
    }
  })

  const setField = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  // Dynamically load Leaflet
  useEffect(() => {
    if (window.L) { setMapReady(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  const fillAddress = useCallback((addr) => {
    setForm(prev => ({
      house:    addr.house_number || addr.building || prev.house,
      street:   addr.road || addr.street || prev.street,
      landmark: prev.landmark,
      city:     addr.city || addr.town || addr.village || addr.county || prev.city,
      postcode: addr.postcode || prev.postcode,
    }))
  }, [])

  const reverseGeocode = useCallback((lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(r => r.json()).then(data => { if (data.address) fillAddress(data.address) })
      .catch(() => {})
  }, [fillAddress])

  const initMap = useCallback((lat, lng) => {
    const L = window.L
    if (!mapRef.current || !L) return
    if (!leafletRef.current.map) {
      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)
      const icon = L.divIcon({ html: '<div style="font-size:28px;line-height:1">📍</div>', className: '', iconAnchor: [14, 28] })
      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map)
      marker.on('dragend', e => reverseGeocode(e.target.getLatLng().lat, e.target.getLatLng().lng))
      map.on('click', e => { marker.setLatLng(e.latlng); reverseGeocode(e.latlng.lat, e.latlng.lng) })
      leafletRef.current = { map, marker }
    } else {
      leafletRef.current.map.setView([lat, lng], 15)
      leafletRef.current.marker.setLatLng([lat, lng])
    }
  }, [reverseGeocode])

  useEffect(() => {
    if (!mapReady) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => initMap(pos.coords.latitude, pos.coords.longitude),
        ()   => initMap(13.0827, 80.2707)
      )
    } else {
      initMap(13.0827, 80.2707)
    }
    return () => {
      if (leafletRef.current.map) {
        leafletRef.current.map.remove()
        leafletRef.current = { map: null, marker: null }
      }
    }
  }, [mapReady, initMap])

  // Map search suggestions
  const searchTimeout = useRef(null)
  const handleSearchInput = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(searchTimeout.current)
    if (q.length < 3) { setSuggestions([]); return }
    searchTimeout.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`)
        .then(r => r.json())
        .then(results => setSuggestions(results))
        .catch(() => {})
    }, 400)
  }

  const handleSuggestionPick = (r) => {
    setQuery(r.display_name)
    setSuggestions([])
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon)
    initMap(lat, lng)
    if (r.address) fillAddress(r.address)
  }

  const handleSave = () => {
    saveAddress(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (

    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Delivery Address</h1>
        <p className={styles.sub}>Pin your location or fill in the form below</p>
      </div>

      {/* Map search */}
      <div className={styles.mapSearchWrap}>
        <span className={styles.mapSearchIcon}>🔍</span>
        <input
          className={styles.mapSearchInput}
          placeholder="Search for your area, street name…"
          value={query}
          onChange={handleSearchInput}
          onBlur={() => setTimeout(() => setSuggestions([]), 200)}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((r, i) => (
              <div key={i} className={styles.suggItem} onMouseDown={() => handleSuggestionPick(r)}>
                📍 {r.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Map */}
      <div className={styles.mapWrap}>
        {!mapReady && <div className={styles.mapPlaceholder}>Loading map…</div>}
        <div ref={mapRef} className={styles.map} style={{ display: mapReady ? 'block' : 'none' }} />
      </div>

      {/* Address Type */}
      <div className={styles.typeRow}>
        {ADDRESS_TYPES.map(t => (
          <button
            key={t}
            className={`${styles.typeBtn} ${addrType === t ? styles.typeActive : ''}`}
            onClick={() => setAddrType(t)}
          >
            {t === 'Home' ? '🏠' : t === 'Work' ? '💼' : '📌'} {t}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>House / Flat No.</label>
          <input className={styles.input} placeholder="e.g. 4B, Tower 2" value={form.house} onChange={setField('house')} />
        </div>
        <div className={styles.field}>
          <label>Street / Area</label>
          <input className={styles.input} placeholder="Street name, locality" value={form.street} onChange={setField('street')} />
        </div>
        <div className={styles.field}>
          <label>Landmark <span className={styles.opt}>(optional)</span></label>
          <input className={styles.input} placeholder="Near park, opposite mall…" value={form.landmark} onChange={setField('landmark')} />
        </div>
        <div className={styles.field}>
          <label>City / Town</label>
          <input className={styles.input} placeholder="City" value={form.city} onChange={setField('city')} />
        </div>
        <div className={styles.field}>
          <label>Pincode</label>
          <input className={styles.input} placeholder="6-digit pincode" maxLength={6} value={form.postcode} onChange={setField('postcode')} />
        </div>
        {user && (
          <div className={styles.field}>
            <label>Deliver to</label>
            <input className={styles.input} value={user.name} readOnly />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
          onClick={handleSave}
        >
          {saved ? '✓ Address Saved!' : 'Save Address'}
        </button>
      </div>

      {/* Saved addresses preview */}
      {form.house || form.street ? (
        <div className={styles.preview}>
          <div className={styles.previewIcon}>
            {addrType === 'Home' ? '🏠' : addrType === 'Work' ? '💼' : '📌'}
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewType}>{addrType}</div>
            <div className={styles.previewAddr}>
              {[form.house, form.street, form.landmark, form.city, form.postcode].filter(Boolean).join(', ')}
            </div>
          </div>
          <span className={styles.previewBadge}>Default</span>
        </div>
      ) : null}
    </div>
  )
}
