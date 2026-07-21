import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Auth.module.css'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [alert, setAlert]   = useState(null)
  const [terms, setTerms]   = useState(false)

  const f = (name) => ({
    value: form[name],
    onChange: e => setForm(p => ({ ...p, [name]: e.target.value })),
    className: `${styles.input} ${errors[name] ? styles.inputErr : ''}`,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (form.name.trim().length < 2)                             errs.name     = 'Enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))         errs.email    = 'Invalid email'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g,'')))          errs.phone    = '10-digit phone'
    if (form.password.length < 6)                                errs.password = 'At least 6 characters'
    if (form.confirm !== form.password)                          errs.confirm  = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!terms) { setAlert({ type: 'bad', msg: 'Please accept the terms.' }); return }
    try {
      signup(form.name, form.email, form.password, form.phone)
      setAlert({ type: 'ok', msg: 'Account created! Redirecting…' })
      setTimeout(() => navigate('/'), 900)
    } catch (err) {
      setAlert({ type: 'bad', msg: err.message })
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={() => navigate('/')}>×</button>
        <div className={styles.illus}>
          <svg viewBox="0 0 200 200" fill="none" width="200" height="200">
            <circle cx="100" cy="100" r="90" fill="#86efac" opacity=".4"/>
            <path d="M50 150 Q50 110 100 110 Q150 110 150 150 Z" fill="#16a34a"/>
            <circle cx="100" cy="80" r="26" fill="#16a34a"/>
            <circle cx="155" cy="55" r="20" fill="#fff" stroke="#16a34a" strokeWidth="3"/>
            <path d="M148 55 L153 60 L163 50" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
          <h3>Join FreshMart</h3>
          <p>Create your account and start shopping fresh, organic groceries today.</p>
        </div>
        <div className={styles.formSide}>
          <div className={styles.brand}>🛒 <span className={styles.green}>Fresh</span>Mart</div>
          <h2 className={styles.formTitle}>Create Account</h2>
          <p className={styles.sub}>It only takes a minute</p>
          {alert && <div className={`${styles.alert} ${alert.type === 'ok' ? styles.alertOk : styles.alertBad}`}>{alert.msg}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label>Full Name</label>
              <input {...f('name')} placeholder="John Doe"/>
              {errors.name && <span className={styles.err}>{errors.name}</span>}
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input {...f('email')} type="email" placeholder="you@example.com"/>
              {errors.email && <span className={styles.err}>{errors.email}</span>}
            </div>
            <div className={styles.field}>
              <label>Phone</label>
              <input {...f('phone')} placeholder="10-digit mobile"/>
              {errors.phone && <span className={styles.err}>{errors.phone}</span>}
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input {...f('password')} type="password" placeholder="At least 6 characters"/>
              {errors.password && <span className={styles.err}>{errors.password}</span>}
            </div>
            <div className={styles.field}>
              <label>Confirm Password</label>
              <input {...f('confirm')} type="password" placeholder="Re-enter password"/>
              {errors.confirm && <span className={styles.err}>{errors.confirm}</span>}
            </div>
            <label className={styles.termsRow}>
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{width:'auto'}}/>
              <span>I agree to the <a href="#" style={{color:'#21B421'}}>Terms</a> &amp; <a href="#" style={{color:'#21B421'}}>Privacy Policy</a></span>
            </label>
            <button className={styles.submitBtn} type="submit">Sign Up</button>
            <p className={styles.switch}>Already have an account? <Link to="/login">Login</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
