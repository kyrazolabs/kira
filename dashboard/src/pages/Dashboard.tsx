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
      const res = await authClient.apiKey.create({ name: 'Extension Key' }) as { data?: { key?: string }; error?: { message: string } }
      if (res.error) { toast(res.error.message || 'Failed to create key', 'error'); return }
      const key = res?.data?.key
      if (key) {
        setNewKey(key)
        toast('API key created — copy it now', 'success')
        await loadKeys()
      } else {
        toast('Key created but value not found. Check console.', 'error')
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
          <span className="text-lg mb-sm block"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></span>
          <h3 className="text-heading-sm mb-xs">Create Persona</h3>
          <p className="text-body-sm text-mute">Define AI personality, tone, and platform rules</p>
        </Link>
        <Link to="/billing" className="card-elevated hover:bg-surface transition-colors no-underline text-on-dark">
          <span className="text-lg mb-sm block"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg></span>
          <h3 className="text-heading-sm mb-xs">Upgrade to Pro</h3>
          <p className="text-body-sm text-mute">Unlimited enhancements, all tones, all platforms</p>
        </Link>
        <Link to="/usage" className="card-elevated hover:bg-surface transition-colors no-underline text-on-dark">
          <span className="text-lg mb-sm block"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></span>
          <h3 className="text-heading-sm mb-xs">View Analytics</h3>
          <p className="text-body-sm text-mute">Track your usage across platforms and tones</p>
        </Link>
      </div>
    </div>
  )
}
