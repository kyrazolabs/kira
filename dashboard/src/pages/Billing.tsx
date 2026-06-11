import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'

export default function Billing() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    authClient.subscription.list()
      .then((res: any) => {
        if (res?.data) setSubscriptions(res.data)
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const activeSub = subscriptions.find((s: any) =>
    s.status === 'active' || s.status === 'trialing'
  )

  const handleUpgrade = async () => {
    setActionError(null)
    try {
      await authClient.subscription.upgrade({
        plan: 'pro',
        annual: true,
        successUrl: window.location.origin + '/billing?success=true',
        cancelUrl: window.location.origin + '/billing?canceled=true'
      })
    } catch (e: any) {
      setActionError(e.message)
    }
  }

  const handleManage = async () => {
    try {
      const res: any = await authClient.subscription.billingPortal({
        returnUrl: window.location.origin + '/billing'
      })
      if (res?.data?.url) {
        window.location.href = res.data.url
      }
    } catch (e: any) {
      setActionError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-xl">
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="card h-48 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-xxl max-w-2xl">
      <div>
        <h1 className="text-heading-xl text-on-dark">Billing</h1>
        <p className="text-body-md text-mute mt-xs">Manage your subscription and payment methods</p>
      </div>

      {actionError && (
        <div className="bg-accent-red-soft border border-accent-red/25 rounded-md p-md text-accent-red text-body-sm">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-md underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-accent-red-soft border border-accent-red/25 rounded-md p-md text-accent-red text-body-sm">
          {error}
        </div>
      )}

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h2 className="text-heading-md text-on-dark">
              {activeSub ? 'Pro Plan' : 'Free Plan'}
            </h2>
            <p className="text-body-sm text-mute mt-xs">
              {activeSub
                ? `Status: ${activeSub.status}${activeSub.periodEnd ? ` · Renews ${new Date(activeSub.periodEnd).toLocaleDateString()}` : ''}`
                : '10 enhancements/day, Casual tone only'}
            </p>
          </div>
          <span className={`badge ${activeSub ? 'badge-info' : 'badge-pro'}`}>
            {activeSub ? 'Pro' : 'Free'}
          </span>
        </div>

        <div className="space-y-sm mb-xl">
          <div className="flex items-center gap-sm text-body-sm">
            <span className="text-accent-green">✓</span>
            <span>Unlimited enhancements</span>
          </div>
          <div className="flex items-center gap-sm text-body-sm">
            <span className={activeSub ? 'text-accent-green' : 'text-ash'}>✓</span>
            <span className={activeSub ? '' : 'text-ash'}>All 3 tones (Casual, Professional, Engaging)</span>
          </div>
          <div className="flex items-center gap-sm text-body-sm">
            <span className={activeSub ? 'text-accent-green' : 'text-ash'}>✓</span>
            <span className={activeSub ? '' : 'text-ash'}>All platforms + generic</span>
          </div>
          <div className="flex items-center gap-sm text-body-sm">
            <span className={activeSub ? 'text-accent-green' : 'text-ash'}>✓</span>
            <span className={activeSub ? '' : 'text-ash'}>Custom AI personas</span>
          </div>
        </div>

        {!activeSub ? (
          <button onClick={handleUpgrade} className="btn-primary w-full">
            Upgrade to Pro — $4.99/month
          </button>
        ) : (
          <div className="flex gap-sm">
            <button onClick={handleManage} className="btn-secondary flex-1">
              Manage Billing
            </button>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <div className="card">
          <div className="mb-lg">
            <span className="badge badge-pro mb-sm">Free</span>
            <p className="text-heading-xl text-on-dark mt-sm">$0</p>
            <p className="text-body-sm text-mute">forever</p>
          </div>
          <ul className="space-y-sm text-body-sm">
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> 10 enhancements/day</li>
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> X, LinkedIn, Reddit, Threads</li>
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> Casual tone</li>
            <li className="flex items-center gap-sm"><span className="text-ash">✓</span> <span className="text-ash">Professional & Engaging tones</span></li>
          </ul>
        </div>

        <div className="card-elevated relative">
          <div className="absolute -top-2 right-lg">
            <span className="badge badge-info">Popular</span>
          </div>
          <div className="mb-lg">
            <span className="badge badge-info mb-sm">Pro</span>
            <p className="text-heading-xl text-on-dark mt-sm">$4.99</p>
            <p className="text-body-sm text-mute">per month</p>
          </div>
          <ul className="space-y-sm text-body-sm">
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> Unlimited enhancements</li>
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> All 4 platforms + generic</li>
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> All 3 tones</li>
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> Custom AI personas</li>
            <li className="flex items-center gap-sm"><span className="text-accent-green">✓</span> 7-day free trial</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
