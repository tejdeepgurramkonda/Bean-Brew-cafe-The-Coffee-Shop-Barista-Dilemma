import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const formatMinutes = (value) => `${value.toFixed(1)} min`

const formatTime = (value) => new Date(value).toLocaleTimeString()

export default function AnalyticsPage() {
  const [testCases, setTestCases] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTestCases = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/analytics/test-cases')
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      const data = await response.json()
      const cases = Array.isArray(data.testCases) ? data.testCases : []
      setTestCases(cases)
      setSelectedId(cases[0]?.id || '')
    } catch (err) {
      setError('Unable to fetch analytics from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestCases()
  }, [])

  const selectedCase = useMemo(
    () => testCases.find((testCase) => testCase.id === selectedId) || testCases[0],
    [selectedId, testCases]
  )

  const stats = useMemo(() => {
    if (!selectedCase) return null

    const orders = selectedCase.orders || []
    const totalWait = orders.reduce((sum, order) => sum + order.waitMinutes, 0)
    const avgWait = orders.length ? totalWait / orders.length : 0
    const complaints = orders.filter((order) => order.waitMinutes > 10)

    const drinkCounts = orders.reduce((acc, order) => {
      acc[order.drinkType] = (acc[order.drinkType] || 0) + 1
      return acc
    }, {})

    const baristaMap = orders.reduce((acc, order) => {
      if (!acc[order.barista]) {
        acc[order.barista] = {
          name: order.barista,
          orders: 0,
          totalWait: 0,
          complaints: 0,
          drinks: {}
        }
      }
      const barista = acc[order.barista]
      barista.orders += 1
      barista.totalWait += order.waitMinutes
      barista.complaints += order.waitMinutes > 10 ? 1 : 0
      barista.drinks[order.drinkType] = (barista.drinks[order.drinkType] || 0) + 1
      return acc
    }, {})

    const baristaStats = Object.values(baristaMap).map((barista) => ({
      ...barista,
      avgWait: barista.orders ? barista.totalWait / barista.orders : 0
    }))

    return {
      avgWait,
      complaintCount: complaints.length,
      drinkCounts,
      baristaStats,
      orders
    }
  }, [selectedCase])

  if (loading && !stats) {
    return (
      <div className="notion-shell">
        <nav className="top-nav">
          <div className="top-nav-content">
            <div className="brand">☕ Bean & Brew</div>
            <div className="nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/analytics" className="is-active">Analytics</Link>
            </div>
          </div>
        </nav>
        <div className="notion-main">
          <div className="notion-content">
            <div className="notion-card p-6 text-sm notion-muted font-medium">Loading analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedCase || !stats) {
    return (
      <div className="notion-shell">
        <nav className="top-nav">
          <div className="top-nav-content">
            <div className="brand">☕ Bean & Brew</div>
            <div className="nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/analytics" className="is-active">Analytics</Link>
            </div>
          </div>
        </nav>
        <div className="notion-main">
          <div className="notion-content">
            <div className="notion-card p-6 text-sm notion-muted font-medium">
              {error || 'No analytics data available.'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notion-shell">
      <nav className="top-nav">
        <div className="top-nav-content">
          <div className="brand">☕ Bean & Brew</div>
          <div className="nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/analytics" className="is-active">Analytics</Link>
          </div>
          <div className="nav-actions">
            <button onClick={fetchTestCases} className="notion-button notion-button-primary">
              🔄 Regenerate
            </button>
          </div>
        </div>
      </nav>

      <div className="notion-main">
        <div className="notion-content">
          <header className="notion-card p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] notion-muted font-bold">📊 Bean & Brew</p>
                <h1 className="mt-3 text-4xl font-black gradient-text">Analytics Lab</h1>
                <p className="mt-3 text-sm notion-muted font-medium">
                  🧪 10 test cases · 200-300 simulated orders each
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/dashboard" className="notion-button notion-button-secondary">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-300 to-pink-400 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">⏱️</span>
                    <span className="rounded-full bg-purple-600 text-white px-3 py-1 text-xs font-bold">AVG</span>
                  </div>
                  <p className="text-4xl font-black gradient-text mb-2">{formatMinutes(stats.avgWait)}</p>
                  <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Average Wait Time</p>
                  <p className="text-xs notion-muted font-medium mt-1">Per customer</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-red-300 to-orange-400 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">⚠️</span>
                    <span className="rounded-full bg-red-600 text-white px-3 py-1 text-xs font-bold">ALERT</span>
                  </div>
                  <p className="text-4xl font-black gradient-text mb-2">{stats.complaintCount}</p>
                  <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Total Complaints</p>
                  <p className="text-xs notion-muted font-medium mt-1">Orders over 10 min</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-6 transition-all hover:shadow-xl hover:scale-105">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-300 to-cyan-400 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🧪</span>
                    <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-bold">TEST</span>
                  </div>
                  <div className="mt-3">
                    <select
                      className="notion-select w-full text-sm"
                      value={selectedId}
                      onChange={(event) => setSelectedId(event.target.value)}
                    >
                      {testCases.map((testCase) => (
                        <option key={testCase.id} value={testCase.id}>
                          {testCase.label} ({testCase.orders.length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mt-3">Test Case</p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
                ⚠️ {error}
              </div>
            ) : null}
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
            <section className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-white via-amber-50 to-orange-50 p-7 shadow-lg">
              <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-orange-800 text-2xl shadow-lg">
                    ☕
                  </div>
                  <div>
                    <h2 className="text-2xl font-black gradient-text">Drink Mix</h2>
                    <p className="text-xs notion-muted font-medium mt-1">Most popular orders</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(stats.drinkCounts).map(([drink, count]) => {
                    const total = Object.values(stats.drinkCounts).reduce((a, b) => a + b, 0)
                    const percentage = (count / total) * 100
                    return (
                      <div key={drink} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-amber-900">{drink}</span>
                          <span className="rounded-full bg-amber-700 text-white px-3 py-1 text-xs font-bold">{count}</span>
                        </div>
                        <div className="h-3 rounded-full bg-amber-100 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-600 to-orange-700 rounded-full transition-all duration-500 group-hover:from-amber-700 group-hover:to-orange-800"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs notion-muted font-medium mt-1">{percentage.toFixed(1)}% of orders</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-white via-purple-50 to-pink-50 p-7 shadow-lg">
              <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-2xl shadow-lg">
                    👥
                  </div>
                  <div>
                    <h2 className="text-2xl font-black gradient-text">Barista Stats</h2>
                    <p className="text-xs notion-muted font-medium mt-1">Performance overview</p>
                  </div>
                </div>
                <div className="grid gap-5">
                  {stats.baristaStats.slice(0, 3).map((barista) => (
                    <div key={barista.name} className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-white p-5 transition-all hover:shadow-lg hover:border-purple-400">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-md">
                            {barista.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-lg font-bold">{barista.name}</p>
                            <p className="text-xs notion-muted font-medium">{barista.orders} total orders</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-xs font-bold shadow-md">
                          {formatMinutes(barista.avgWait)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Avg Wait</p>
                          <p className="text-lg font-bold text-purple-900 mt-1">{formatMinutes(barista.avgWait)}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Complaints</p>
                          <p className="text-lg font-bold text-red-900 mt-1">⚠️ {barista.complaints}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(barista.drinks).map(([drink, count]) => (
                          <span key={drink} className="rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900">
                            {drink}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="relative overflow-hidden rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-7 shadow-lg mt-8">
            <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-10"></div>
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-2xl shadow-lg">
                    📝
                  </div>
                  <div>
                    <h2 className="text-2xl font-black gradient-text">Order Timeline</h2>
                    <p className="text-xs notion-muted font-medium mt-1">
                      Complete order history with timestamps
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2 text-xs font-bold shadow-lg">
                  {selectedCase.orders.length} orders
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-blue-200 bg-blue-50">
                    <tr>
                      <th className="py-4 px-3 rounded-tl-lg">Order</th>
                      <th className="py-4 px-3">Customer</th>
                      <th className="py-4 px-3">Drink</th>
                      <th className="py-4 px-3">Barista</th>
                      <th className="py-4 px-3">Ordered</th>
                      <th className="py-4 px-3">Completed</th>
                      <th className="py-4 px-3">Wait</th>
                      <th className="py-4 px-3 rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {stats.orders.map((order, index) => (
                      <tr key={order.id} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-colors">
                        <td className="py-4 px-3">
                          <span className="inline-block rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-xs font-bold text-blue-900">
                            #{order.id}
                          </span>
                        </td>
                        <td className="py-4 px-3 font-semibold">{order.customerName}</td>
                        <td className="py-4 px-3">
                          <span className="inline-block rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900">
                            {order.drinkType}
                          </span>
                        </td>
                        <td className="py-4 px-3 font-medium">{order.barista}</td>
                        <td className="py-4 px-3 text-xs notion-muted font-medium">{formatTime(order.orderedAt)}</td>
                        <td className="py-4 px-3 text-xs notion-muted font-medium">{formatTime(order.completedAt)}</td>
                        <td className="py-4 px-3">
                          <span className="inline-block rounded-full bg-purple-100 border border-purple-300 px-3 py-1 text-xs font-bold text-purple-900">
                            {formatMinutes(order.waitMinutes)}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <span className={`inline-block rounded-full px-4 py-2 text-xs font-bold shadow-sm ${
                            order.waitMinutes > 10 
                              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white' 
                              : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          }`}>
                            {order.waitMinutes > 10 ? '⚠️ Slow' : '✅ Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
