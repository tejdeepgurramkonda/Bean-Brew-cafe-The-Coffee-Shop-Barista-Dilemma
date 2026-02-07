import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const DRINKS = [
  { label: 'Cold Brew', prep: 1, price: 120 },
  { label: 'Espresso', prep: 2, price: 150 },
  { label: 'Americano', prep: 2, price: 140 },
  { label: 'Cappuccino', prep: 4, price: 180 },
  { label: 'Latte', prep: 4, price: 200 },
  { label: 'Mocha', prep: 6, price: 250 }
]

const formatMinutes = (value) => `${value.toFixed(1)} min`

const parseTime = (value) => (value ? new Date(value).getTime() : null)

export default function DashboardPage({ user, onLogout, onUnauthorized }) {
  const [orders, setOrders] = useState([])
  const [baristas, setBaristas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [form, setForm] = useState({
    drinkType: DRINKS[0].label,
    customerName: '',
    customerPhone: '',
    loyaltyCustomer: false,
    rushOrder: false
  })

  const waitingOrders = useMemo(
    () => orders.filter((order) => order.status === 'WAITING'),
    [orders]
  )
  const inProgressOrders = useMemo(
    () => orders.filter((order) => order.status === 'IN_PROGRESS'),
    [orders]
  )
  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === 'COMPLETED'),
    [orders]
  )

  const stats = useMemo(() => {
    const now = Date.now()
    const waitTimes = completedOrders
      .map((order) => {
        const start = parseTime(order.arrivalTime)
        const end = parseTime(order.completedAt)
        if (!start || !end) return null
        return (end - start) / 60000
      })
      .filter((value) => value !== null)

    const activeWaits = waitingOrders.map((order) => {
      const start = parseTime(order.arrivalTime)
      if (!start) return 0
      return (now - start) / 60000
    })

    const avgWait = waitTimes.length
      ? waitTimes.reduce((sum, value) => sum + value, 0) / waitTimes.length
      : activeWaits.length
        ? activeWaits.reduce((sum, value) => sum + value, 0) / activeWaits.length
        : 0

    const emergencyCount = waitingOrders.filter((order) => {
      const start = parseTime(order.arrivalTime)
      return start && (now - start) / 60000 >= 8
    }).length

    return {
      avgWait,
      emergencyCount
    }
  }, [completedOrders, waitingOrders])

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [ordersRes, baristasRes] = await Promise.all([
        apiFetch('/api/orders'),
        apiFetch('/api/baristas')
      ])

      if (ordersRes.status === 401 || baristasRes.status === 401) {
        onUnauthorized()
        return
      }

      if (!ordersRes.ok || !baristasRes.ok) {
        throw new Error('Backend unavailable')
      }

      const [ordersData, baristasData] = await Promise.all([
        ordersRes.json(),
        baristasRes.json()
      ])

      setOrders(ordersData)
      setBaristas(baristasData)
      setLastRefresh(new Date())
    } catch (err) {
      setError('Cannot reach backend. Start Spring Boot and refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Failed to create order')
      }
      await fetchAll()
    } catch (err) {
      setError('Order submission failed. Check the backend logs.')
    } finally {
      setLoading(false)
    }
  }

  const seedBaristas = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/baristas/seed', {
        method: 'POST'
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      if (!response.ok) {
        throw new Error('Failed to seed baristas')
      }
      await fetchAll()
    } catch (err) {
      setError('Could not seed baristas. Check the backend.')
    } finally {
      setLoading(false)
    }
  }

  const completeOrder = async (orderId) => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch(`/api/orders/${orderId}/complete`, {
        method: 'POST'
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      if (!response.ok) {
        throw new Error('Failed to complete order')
      }
      await fetchAll()
    } catch (err) {
      setError('Could not complete order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notion-shell">
      <nav className="top-nav">
        <div className="top-nav-content">
          <div className="brand">☕ Bean & Brew</div>
          <div className="nav-links">
            <Link to="/dashboard" className="is-active">Dashboard</Link>
            <Link to="/analytics">Analytics</Link>
          </div>
          <div className="nav-actions">
            <span className="text-sm font-medium notion-muted">{user?.name || 'Barista'}</span>
            <button onClick={onLogout} className="notion-button">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="notion-main">
        <div className="notion-content">
          <header className="notion-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] notion-muted font-bold">☕ Bean & Brew</p>
                <h1 className="mt-2 text-4xl font-black gradient-text">Coffee Shop Dashboard</h1>
                <p className="mt-3 text-sm notion-muted font-medium">
                  ⚡ Morning rush · 7:00 AM - 10:00 AM · {user?.name || 'barista'} on duty
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={fetchAll} className="notion-button notion-button-secondary">
                  🔄 Refresh
                </button>
                <button onClick={seedBaristas} className="notion-button notion-button-primary">
                  ✨ Seed 3 Baristas
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">⏱️</span>
                    <span className="rounded-full bg-amber-700 text-white px-3 py-1 text-xs font-bold">AVG</span>
                  </div>
                  <p className="text-4xl font-black gradient-text mb-2">{formatMinutes(stats.avgWait)}</p>
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Average Wait Time</p>
                  <p className="text-xs notion-muted font-medium mt-1">Target: under 8 min</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-red-300 to-orange-300 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">⚠️</span>
                    <span className="rounded-full bg-red-600 text-white px-3 py-1 text-xs font-bold">ALERT</span>
                  </div>
                  <p className="text-4xl font-black gradient-text mb-2">{stats.emergencyCount}</p>
                  <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Urgent Orders</p>
                  <p className="text-xs notion-muted font-medium mt-1">Waiting 8+ minutes</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">📋</span>
                    <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-bold">QUEUE</span>
                  </div>
                  <p className="text-4xl font-black gradient-text mb-2">{waitingOrders.length}</p>
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">In Queue</p>
                  <p className="text-xs notion-muted font-medium mt-1">Pending orders</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-green-300 to-emerald-300 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🔥</span>
                    <span className="rounded-full bg-green-600 text-white px-3 py-1 text-xs font-bold">LIVE</span>
                  </div>
                  <p className="text-4xl font-black gradient-text mb-2">{inProgressOrders.length}</p>
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">In Progress</p>
                  <p className="text-xs notion-muted font-medium mt-1">{lastRefresh ? lastRefresh.toLocaleTimeString() : 'Not synced'}</p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
                ⚠️ {error}
              </div>
            ) : null}
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_1.85fr]">
            <section className="flex flex-col gap-6">
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-white via-amber-50 to-orange-50 p-7 shadow-lg">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-orange-800 text-2xl shadow-lg">
                      📝
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-black gradient-text">New Order</h2>
                      <p className="text-xs notion-muted font-medium mt-1">
                        Place a fresh order for pickup
                      </p>
                    </div>
                    <div className="rounded-full bg-gradient-to-r from-amber-700 to-orange-800 px-4 py-2 text-xs font-bold text-white shadow-lg">
                      {loading ? '⏳ Saving' : '✅ Ready'}
                    </div>
                  </div>

                <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="sr-only" htmlFor="customer-name">Customer name</label>
                    <input
                      id="customer-name"
                      type="text"
                      className="notion-input"
                      placeholder="Customer name"
                      value={form.customerName}
                      onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="customer-phone">Customer phone</label>
                    <input
                      id="customer-phone"
                      type="tel"
                      className="notion-input"
                      placeholder="Customer phone"
                      value={form.customerPhone}
                      onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="sr-only" htmlFor="drink-type">Drink type</label>
                  <select
                    id="drink-type"
                    className="notion-select"
                    value={form.drinkType}
                    onChange={(event) => setForm({ ...form, drinkType: event.target.value })}
                  >
                    {DRINKS.map((drink) => (
                      <option key={drink.label} value={drink.label}>
                        {drink.label} · {drink.prep} min · INR {drink.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-sm font-semibold cursor-pointer transition-all hover:border-amber-300 hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={form.loyaltyCustomer}
                      onChange={(event) =>
                        setForm({ ...form, loyaltyCustomer: event.target.checked })
                      }
                    />
                    ⭐ Loyalty customer
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-sm font-semibold cursor-pointer transition-all hover:border-amber-300 hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={form.rushOrder}
                      onChange={(event) => setForm({ ...form, rushOrder: event.target.checked })}
                    />
                    🚀 Rush order
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="notion-button notion-button-primary w-full text-base"
                >
                  {loading ? '⏳ Saving...' : '🎫 Print Ticket'}
                </button>
              </form>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-white via-purple-50 to-pink-50 p-7 shadow-lg">
              <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-2xl shadow-lg">
                    👥
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black gradient-text">Barista Crew</h3>
                    <p className="text-xs notion-muted font-medium mt-1">Active team members</p>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-lg">
                    {baristas.length} on shift
                  </span>
                </div>
                <div className="grid gap-3">
                  {baristas.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
                      <p className="text-sm notion-muted font-medium">No baristas yet. Seed the lineup.</p>
                    </div>
                  ) : (
                    baristas.slice(0, 3).map((barista) => (
                      <div
                        key={barista.id}
                        className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-white px-5 py-4 transition-all hover:shadow-lg hover:border-purple-400"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-sm">
                              {barista.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-base">{barista.name}</p>
                              <p className="text-xs notion-muted font-medium">⚡ {barista.workloadMinutes} min workload</p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm ${
                              barista.available 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                            }`}
                          >
                            {barista.available ? '✅ Free' : `🔥 #${barista.currentOrderId ?? ''}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-white via-amber-50 to-orange-50 p-7 shadow-lg">
            <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10"></div>
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-orange-800 text-2xl shadow-lg">
                    📊
                  </div>
                  <div>
                    <h2 className="text-3xl font-black gradient-text">Queue Board</h2>
                    <p className="text-xs notion-muted font-medium mt-1">
                      🔄 Auto-updates every 30 seconds
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border-2 border-amber-300 bg-white px-5 py-2 text-xs font-bold shadow-sm">
                  <span className="text-amber-600">{waitingOrders.length} ⏳</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-orange-600">{inProgressOrders.length} 🔥</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-green-600">{completedOrders.length} ✅</span>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="relative overflow-hidden rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-md">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-400 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <h3 className="text-lg font-black gradient-text">Waiting</h3>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-orange-700 text-xs font-bold text-white shadow-md">
                        {waitingOrders.length}
                      </span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto space-y-3">
                      {waitingOrders.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-white/50 px-4 py-6 text-center">
                          <p className="text-sm notion-muted font-medium">All clear!</p>
                        </div>
                      ) : (
                        waitingOrders.map((order) => (
                          <div key={order.id} className="group rounded-xl border-2 border-amber-200 bg-white px-4 py-3 transition-all hover:shadow-lg hover:border-amber-400">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-amber-900">
                                  #{order.id} · {order.drinkType}
                                </p>
                                <p className="mt-1 text-xs notion-muted font-medium">
                                  {order.customerName}
                                </p>
                              </div>
                              <span className="rounded-full bg-amber-700 text-white px-2 py-1 text-[10px] font-bold">
                                {order.prepTime}m
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-amber-700">
                              <span className="rounded-full bg-amber-100 px-2 py-1">🎯 {order.priorityScore?.toFixed(1) ?? '0'}</span>
                              <span className="rounded-full bg-amber-100 px-2 py-1">⏭️ {order.skippedByLaterCount}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 p-5 shadow-md">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-orange-500 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔥</span>
                        <h3 className="text-lg font-black gradient-text">In Progress</h3>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-xs font-bold text-white shadow-md">
                        {inProgressOrders.length}
                      </span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto space-y-3">
                      {inProgressOrders.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-orange-300 bg-white/50 px-4 py-6 text-center">
                          <p className="text-sm notion-muted font-medium">No active orders</p>
                        </div>
                      ) : (
                        inProgressOrders.map((order) => (
                          <div key={order.id} className="group rounded-xl border-2 border-orange-200 bg-white px-4 py-3 transition-all hover:shadow-lg hover:border-orange-400">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-orange-900">
                                  #{order.id} · {order.drinkType}
                                </p>
                                <p className="mt-1 text-xs notion-muted font-medium">
                                  {order.customerName}
                                </p>
                              </div>
                              <span className="rounded-full bg-orange-600 text-white px-2 py-1 text-[10px] font-bold">
                                {order.prepTime}m
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-orange-700">
                              <span className="rounded-full bg-orange-100 px-2 py-1">👤 B{order.assignedBaristaId ?? '?'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-md">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-green-400 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <h3 className="text-lg font-black gradient-text">Completed</h3>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-xs font-bold text-white shadow-md">
                        {completedOrders.length}
                      </span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto space-y-3">
                      {completedOrders.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-green-300 bg-white/50 px-4 py-6 text-center">
                          <p className="text-sm notion-muted font-medium">Nothing yet</p>
                        </div>
                      ) : (
                        completedOrders.slice(-6).map((order) => (
                          <div key={order.id} className="group rounded-xl border-2 border-green-200 bg-white px-4 py-3 transition-all hover:shadow-lg hover:border-green-400">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-green-900">
                                  #{order.id} · {order.drinkType}
                                </p>
                                <p className="mt-1 text-xs notion-muted font-medium">
                                  {order.customerName}
                                </p>
                              </div>
                              <span className="rounded-full bg-green-600 text-white px-2 py-1 text-[10px] font-bold">
                                {order.prepTime}m
                              </span>
                            </div>
                            <div className="mt-2">
                              {order.loyaltyCustomer && (
                                <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                                  ⭐ Loyalty
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  )
}
