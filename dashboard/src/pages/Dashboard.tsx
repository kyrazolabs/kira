import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { configApi, usageApi, type IPersona, type IUsageStats } from '../lib/api'
import { authClient } from '../lib/auth-client'

export default function Dashboard() {
  const [stats, setStats] = useState<IUsageStats | null>(null)
  const [personas, setPersonas] = useState<IPersona[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      usageApi.getStats(7),
      configApi.listPersonas(),
      authClient.apiKey.list()
    ])
      .then(([s, p, k]) => {
        setStats(s)
        setPersonas(p || [])
        setApiKeys((k?.data as any)?.apiKeys || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-xl">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-xxl">
        <p className="text-accent-red mb-md">Failed to load dashboard</p>
        <p className="text-caption-sm text-mute mb-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-xxl">
      <div>
        <h1 className="text-heading-xl text-on-dark">Dashboard</h1>
        <p className="text-body-md text-mute mt-xs">Overview of your content enhancement activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">Today</p>
          <p className="text-display-lg text-on-dark">{stats?.today || 0}</p>
          <p className="text-caption-sm text-mute mt-xs">enhancements</p>
        </div>
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">This Month</p>
          <p className="text-display-lg text-on-dark">{stats?.thisMonth || 0}</p>
          <p className="text-caption-sm text-mute mt-xs">enhancements</p>
        </div>
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">Personas</p>
          <p className="text-display-lg text-on-dark">{personas.length}</p>
          <p className="text-caption-sm text-mute mt-xs">configured</p>
        </div>
        <div className="card">
          <p className="text-caption-sm text-mute mb-xs">API Keys</p>
          <p className="text-display-lg text-on-dark">{apiKeys.length}</p>
          <p className="text-caption-sm text-mute mt-xs">active keys</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
        <Link to="/personas" className="card-elevated hover:bg-surface transition-colors no-underline text-on-dark">
          <span className="text-lg mb-sm block">◎</span>
          <h3 className="text-heading-sm mb-xs">Create Persona</h3>
          <p className="text-body-sm text-mute">Define AI personality, tone, and platform rules</p>
        </Link>
        <Link to="/billing" className="card-elevated hover:bg-surface transition-colors no-underline text-on-dark">
          <span className="text-lg mb-sm block">◈</span>
          <h3 className="text-heading-sm mb-xs">Upgrade to Pro</h3>
          <p className="text-body-sm text-mute">Unlimited enhancements, all tones, all platforms</p>
        </Link>
        <Link to="/usage" className="card-elevated hover:bg-surface transition-colors no-underline text-on-dark">
          <span className="text-lg mb-sm block">◉</span>
          <h3 className="text-heading-sm mb-xs">View Analytics</h3>
          <p className="text-body-sm text-mute">Track your usage across platforms and tones</p>
        </Link>
      </div>
    </div>
  )
}
