import { useEffect, useState } from 'react'
import { usageApi, type IUsageStats } from '../lib/api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function Usage() {
  const [stats, setStats] = useState<IUsageStats | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    usageApi.getStats(days)
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [days])

  if (loading) {
    return <div className="space-y-xl">{Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="card h-48 animate-pulse" />
    ))}</div>
  }

  if (error) {
    return (
      <div className="card text-center py-xxl">
        <p className="text-accent-red mb-md">Failed to load usage data</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
      </div>
    )
  }

  const chartColors = {
    grid: '#242728',
    text: '#9c9c9d',
    line: '#ffffff',
    bars: ['#ffc533', '#57c1ff', '#59d499', '#ff6161', '#cdcdcd']
  }

  return (
    <div className="space-y-xxl">
      <div>
        <h1 className="text-heading-xl text-on-dark">Usage Analytics</h1>
        <p className="text-body-md text-mute mt-xs">Track your content enhancement activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">Total</p>
          <p className="text-heading-xl text-on-dark">{stats?.total || 0}</p>
        </div>
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">This Month</p>
          <p className="text-heading-xl text-on-dark">{stats?.thisMonth || 0}</p>
        </div>
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">Today</p>
          <p className="text-heading-xl text-on-dark">{stats?.today || 0}</p>
        </div>
      </div>

      {/* Day Range Selector */}
      <div className="flex gap-sm">
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-md py-xs rounded-full text-body-sm transition-colors ${
              days === d
                ? 'bg-surface-elevated text-on-dark border border-hairline'
                : 'text-mute hover:text-body'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Daily Line Chart */}
      <div className="card">
        <h3 className="text-heading-sm text-on-dark mb-lg">Daily Enhancements</h3>
        {stats?.daily && stats.daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.daily} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#0d0d0d',
                  border: '1px solid #242728',
                  borderRadius: '8px',
                  color: '#cdcdcd'
                }}
              />
              <Line type="monotone" dataKey="count" stroke={chartColors.line} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-mute text-body-sm py-xxl text-center">No data yet</p>
        )}
      </div>

      {/* By Platform */}
      <div className="card">
        <h3 className="text-heading-sm text-on-dark mb-lg">By Platform</h3>
        {stats?.byPlatform && stats.byPlatform.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byPlatform} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="platform" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#0d0d0d',
                  border: '1px solid #242728',
                  borderRadius: '8px',
                  color: '#cdcdcd'
                }}
              />
              <Bar dataKey="count" fill={chartColors.bars[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-mute text-body-sm py-xxl text-center">No data yet</p>
        )}
      </div>

      {/* By Tone */}
      <div className="card">
        <h3 className="text-heading-sm text-on-dark mb-lg">By Tone</h3>
        {stats?.byTone && stats.byTone.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byTone} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="tone" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#0d0d0d',
                  border: '1px solid #242728',
                  borderRadius: '8px',
                  color: '#cdcdcd'
                }}
              />
              <Bar dataKey="count" fill={chartColors.bars[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-mute text-body-sm py-xxl text-center">No data yet</p>
        )}
      </div>
    </div>
  )
}
