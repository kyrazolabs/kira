import { useState, useEffect } from 'react'
import { useSession, signOut } from '../lib/auth-client'
import { configApi, type IUserConfig } from '../lib/api'
import { useToast } from '../components/ui/Toast'

export default function Settings() {
  const { data: session } = useSession()
  const user = session?.user
  const [config, setConfig] = useState<IUserConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    configApi.getFull().then((data: any) => setConfig(data.config))
      .catch(() => toast('Failed to load settings', 'error'))
  }, [])

  const updateConfig = async (patch: Partial<IUserConfig>) => {
    setSaving(true)
    try {
      const updated = await configApi.updateConfig(patch)
      setConfig(updated)
      toast('Settings saved', 'success')
    } catch (e: any) {
      toast(e.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-xxl max-w-2xl">
      <div>
        <h1 className="text-heading-xl text-on-dark">Settings</h1>
        <p className="text-body-md text-mute mt-xs">Manage your account and preferences</p>
      </div>

      <div className="card">
        <h2 className="text-heading-sm text-on-dark mb-lg">Account</h2>
        <div className="flex items-center gap-lg">
          {user?.image && (
            <img src={user.image} alt="" className="w-12 h-12 rounded-full" />
          )}
          <div>
            <p className="text-body-strong text-on-dark">{user?.name || 'User'}</p>
            <p className="text-body-sm text-mute">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-heading-sm text-on-dark mb-lg">Preferences</h2>
        <div className="space-y-lg">
          <div>
            <label className="text-caption-sm text-mute block mb-xs">Default Tone</label>
            <select
              className="select"
              value={config?.defaultTone || 'casual'}
              onChange={e => updateConfig({ defaultTone: e.target.value as any })}
              disabled={saving}
            >
              <option value="casual" className="bg-surface text-body">Casual</option>
              <option value="professional" className="bg-surface text-body">Professional</option>
              <option value="engaging" className="bg-surface text-body">Engaging</option>
            </select>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-body-sm">Send anonymous analytics</span>
            <input
              type="checkbox"
              checked={config?.analyticsEnabled !== false}
              onChange={e => updateConfig({ analyticsEnabled: e.target.checked })}
              disabled={saving}
              className="accent-white w-9 h-5 rounded-full bg-stone relative cursor-pointer appearance-none
                after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full
                after:transition-transform checked:bg-accent-green checked:after:translate-x-4"
            />
          </label>
        </div>
      </div>

      <div className="card border-accent-red/25">
        <h2 className="text-heading-sm text-accent-red mb-lg">Danger Zone</h2>
        <p className="text-body-sm text-mute mb-lg">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn-secondary text-accent-red border-accent-red/25"
          >
            Delete Account
          </button>
        ) : (
          <div className="flex gap-sm">
            <button className="btn-tertiary text-accent-red border-accent-red/25">
              Confirm Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="text-center pt-xl">
        <button onClick={() => signOut()} className="btn-secondary">
          Sign Out
        </button>
      </div>
    </div>
  )
}
