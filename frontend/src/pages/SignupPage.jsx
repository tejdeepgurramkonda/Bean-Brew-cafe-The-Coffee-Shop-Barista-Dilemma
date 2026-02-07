import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Signup failed')
      }

      navigate('/login')
    } catch (err) {
      setError('Signup failed. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="text-center">
          <div className="inline-block text-4xl mb-4">☕</div>
          <p className="text-xs uppercase tracking-[0.28em] notion-muted font-bold">Bean & Brew</p>
          <h1 className="mt-4 text-3xl font-black gradient-text">Create Account</h1>
          <p className="mt-3 text-sm notion-muted font-medium">Start your coffee journey with us today</p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
            ⚠️ {error}
          </div>
        ) : null}

        <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="sr-only" htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              type="text"
              className="notion-input"
              placeholder="👤 Full name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="notion-input"
              placeholder="✉️ Email address"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="notion-input"
              placeholder="🔒 Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="notion-button notion-button-primary text-base">
            {loading ? '⏳ Creating...' : '✨ Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm notion-muted font-medium">
          Already have an account?{' '}
          <Link className="font-bold gradient-text hover:underline" to="/login">
            Login →
          </Link>
        </p>
      </div>
    </div>
  )
}
