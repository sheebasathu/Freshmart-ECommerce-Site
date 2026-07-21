import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [alert, setAlert]   = useState(null)

  const f = (name) => ({
    value: form[name],
    onChange: e => setForm(p => ({ ...p, [name]: e.target.value })),
    className: `${styles.input} ${errors[name] ? styles.inputErr : ''}`,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (form.password.length < 6) errs.password = 'At least 6 characters'
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      login(form.email, form.password)
      setAlert({ type: 'ok', msg: 'Login successful! Redirecting…' })
      setTimeout(() => navigate('/'), 900)
    } catch {
      setAlert({ type: 'bad', msg: 'Invalid email or password.' })
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={() => navigate('/')}>×</button>
        <div className={styles.illus}>
          <svg viewBox="0 0 200 200" fill="none" width="200" height="200">
            <circle cx="100" cy="100" r="90" fill="#86efac" opacity=".4"/>
            <rect x="55" y="70" width="90" height="80" rx="8" fill="#fff" stroke="#16a34a" strokeWidth="3"/>
            <circle cx="100" cy="95" r="14" fill="#16a34a"/>
            <rect x="92" y="105" width="16" height="22" rx="2" fill="#16a34a"/>
            <path d="M75 70 Q75 50 100 50 Q125 50 125 70" stroke="#16a34a" strokeWidth="4" fill="none"/>
          </svg>
          <h3>Welcome Back!</h3>
          <p>Login to access your fresh groceries and track your orders.</p>
        </div>
        <div className={styles.formSide}>
          <div className={styles.brand}>🛒 <span className={styles.green}>Fresh</span>Mart</div>
          <h2 className={styles.formTitle}>Login</h2>
          <p className={styles.sub}>Enter your credentials to continue</p>
          {alert && <div className={`${styles.alert} ${alert.type === 'ok' ? styles.alertOk : styles.alertBad}`}>{alert.msg}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label>Email</label>
              <input {...f('email')} type="email" placeholder="you@example.com"/>
              {errors.email && <span className={styles.err}>{errors.email}</span>}
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input {...f('password')} type="password" placeholder="••••••••"/>
              {errors.password && <span className={styles.err}>{errors.password}</span>}
            </div>
            <button className={styles.submitBtn} type="submit">Login</button>
            <p className={styles.switch}>Don't have an account? <Link to="/signup">Sign up</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
