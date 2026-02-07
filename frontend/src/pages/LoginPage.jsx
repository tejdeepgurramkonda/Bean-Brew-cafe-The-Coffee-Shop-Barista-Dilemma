import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, getApiBase } from '../lib/api'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      onLogin(data)
      navigate('/dashboard')
    } catch (err) {
      setError('Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${getApiBase()}/oauth2/authorization/google`
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="text-center">
          <div className="inline-block text-4xl mb-4">☕</div>
          <p className="text-xs uppercase tracking-[0.28em] notion-muted font-bold">Bean & Brew</p>
          <h2 className="mt-4 text-3xl font-black gradient-text">Welcome Back</h2>
          <p className="mt-3 text-sm notion-muted font-medium">Log in to your account to continue</p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
            ⚠️ {error}
          </div>
        ) : null}

        <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="sr-only" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="notion-input"
              placeholder="✉️ Email address"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="notion-input"
              placeholder="🔒 Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="notion-button notion-button-primary text-base">
            {loading ? '⏳ Signing in...' : '🚀 Log In'}
          </button>
        </form>

        <div className="mt-7 text-center">
          <div className="flex items-center gap-4 text-xs notion-muted font-semibold">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></span>
            OR
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></span>
          </div>
          <button onClick={handleGoogleLogin} className="mt-5 w-full notion-button notion-button-secondary">
            <span className="inline-flex items-center gap-2">
              🔐 Continue with Google
            </span>
          </button>
          <p className="mt-6 text-sm notion-muted font-medium">
            Don't have an account?{' '}
            <Link className="font-bold gradient-text hover:underline" to="/signup">
              Sign up →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
