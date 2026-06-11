import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { configApi, usageApi, type IPersona, type IUsageStats } from '../lib/api'
import { authClient } from '../lib/auth-client'
import { useToast } from '../components/ui/Toast'

export default function Dashboard() {
  const [stats, setStats] = useState<IUsageStats | null>(null)
  const [personas, setPersonas] = useState<IPersona[]>([])
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadKeys = async () => {
    try {
      const res = await authClient.apiKey.list() as any
      const keys = res?.data?.apiKeys || []
      setApiKey(keys.length > 0 ? keys[0].id : null)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    Promise.all([
      usageApi.getStats(7),
      configApi.listPersonas(),
      loadKeys()
    ])
      .then(([s, p]) => {
        setStats(s)
        setPersonas(p || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const createApiKey = async () => {
    try {
      const res = await authClient.apiKey.create({ name: 'Extension Key' }) as any
      const key = res?.data?.key
      if (key) {
        setNewKey(key)
        toast('API key created — copy it now', 'success')
        await loadKeys()
      }
    } catch (e: any) {
      toast(e.message || 'Failed to create key', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-xl">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {[1, 2, 3].map(i => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
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
      </div>

      {/* API Key Section */}
      <div className="card">
        <h3 className="text-heading-sm text-on-dark mb-sm">Extension Connection</h3>
        <p className="text-body-sm text-mute mb-lg">
          {apiKey
            ? 'Your extension is connected. If you need a new key, create one below.'
            : 'Connect the Kira browser extension to your account.'}
        </p>

        {newKey ? (
          <div>
            <div className="flex items-center gap-sm mb-md">
              <input
                className="input text-sm flex-1 font-mono"
                value={newKey}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(newKey); toast('Copied!', 'success') }}
                className="btn-secondary"
              >
                Copy
              </button>
            </div>
            <p className="text-caption-sm text-accent-yellow">
              Copy this key now — it won't be shown again. Paste it in extension Settings.
            </p>
          </div>
        ) : (
          <button onClick={createApiKey} className="btn-primary">
            {apiKey ? 'Create New Key' : 'Create API Key'}
          </button>
        )}
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
