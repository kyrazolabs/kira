import { useEffect, useState } from 'react'
import { configApi, type IPersona } from '../lib/api'
import { useToast } from '../components/ui/Toast'

const PLATFORMS = ['all', 'twitter', 'linkedin', 'reddit', 'threads', 'generic']
const TONES = ['casual', 'professional', 'engaging']

const emptyPersona = {
  name: '',
  description: '',
  platform: 'all',
  tone: 'casual',
  systemPrompt: '',
  temperature: 0.8,
  isDefault: false
}

export default function Personas() {
  const [personas, setPersonas] = useState<IPersona[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<IPersona | null>(null)
  const [form, setForm] = useState(emptyPersona)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    configApi.listPersonas()
      .then(setPersonas)
      .catch(e => toast(e.message || 'Failed to load personas', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = () => {
    setEditing(null)
    setForm(emptyPersona)
    setShowForm(true)
  }

  const handleEdit = (p: IPersona) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      platform: p.platform,
      tone: p.tone,
      systemPrompt: p.systemPrompt,
      temperature: p.temperature,
      isDefault: p.isDefault
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.systemPrompt) {
      toast('Name and system prompt are required', 'error')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await configApi.updatePersona(editing._id, form)
        toast('Persona updated', 'success')
      } else {
        await configApi.createPersona(form)
        toast('Persona created', 'success')
      }
      setShowForm(false)
      load()
    } catch (e: any) {
      toast(e.message || 'Failed to save persona', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this persona?')) return
    try {
      await configApi.deletePersona(id)
      toast('Persona deleted', 'success')
      load()
    } catch (e: any) {
      toast(e.message || 'Failed to delete', 'error')
    }
  }

  if (loading) {
    return <div className="space-y-lg">{Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="card h-20 animate-pulse" />
    ))}</div>
  }

  return (
    <div className="space-y-xxl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-on-dark">Personas</h1>
          <p className="text-body-md text-mute mt-xs">Custom AI personalities for different platforms and tones</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          + New Persona
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-xl" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-lg">
            <h2 className="text-heading-md text-on-dark">
              {editing ? 'Edit Persona' : 'New Persona'}
            </h2>

            <div>
              <label className="text-caption-sm text-mute block mb-xs">Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Twitter Style" />
            </div>

            <div>
              <label className="text-caption-sm text-mute block mb-xs">Description</label>
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Casual, punchy tweets with hooks" />
            </div>

            <div className="grid grid-cols-2 gap-lg">
              <div>
                <label className="text-caption-sm text-mute block mb-xs">Platform</label>
                <select className="select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                  {PLATFORMS.map(p => <option key={p} value={p} className="bg-surface text-body">{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-caption-sm text-mute block mb-xs">Tone</label>
                <select className="select" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
                  {TONES.map(t => <option key={t} value={t} className="bg-surface text-body">{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-caption-sm text-mute block mb-xs">System Prompt ({form.systemPrompt.length}/4000)</label>
              <textarea className="textarea" rows={6} value={form.systemPrompt} onChange={e => setForm({ ...form, systemPrompt: e.target.value })} placeholder="You are an expert content writer..." />
            </div>

            <div>
              <label className="text-caption-sm text-mute block mb-xs">Temperature: {form.temperature}</label>
              <input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} className="w-full accent-white" />
            </div>

            <label className="flex items-center gap-sm cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="accent-white" />
              <span className="text-body-sm">Set as default persona</span>
            </label>

            <div className="flex gap-sm pt-md">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {personas.length === 0 ? (
        <div className="card text-center py-xxl">
          <p className="text-mute text-body-lg mb-md">No personas yet</p>
          <p className="text-caption-sm text-mute mb-lg">Create your first AI persona to customize how content is enhanced</p>
          <button onClick={handleCreate} className="btn-primary">Create Persona</button>
        </div>
      ) : (
        <div className="space-y-md">
          {personas.map(p => (
            <div key={p._id} className="card flex items-start justify-between gap-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm mb-xs">
                  <h3 className="text-heading-sm text-on-dark">{p.name}</h3>
                  {p.isDefault && <span className="badge badge-info">Default</span>}
                </div>
                <p className="text-body-sm text-mute mb-sm">{p.description || 'No description'}</p>
                <div className="flex gap-sm">
                  <span className="badge badge-pro text-caption-sm">{p.platform}</span>
                  <span className="badge badge-pro text-caption-sm">{p.tone}</span>
                  <span className="text-caption-sm text-ash">temp: {p.temperature}</span>
                </div>
              </div>
              <div className="flex gap-xs flex-shrink-0">
                <button onClick={() => handleEdit(p)} className="btn-tertiary">Edit</button>
                <button onClick={() => handleDelete(p._id)} className="btn-tertiary text-accent-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
