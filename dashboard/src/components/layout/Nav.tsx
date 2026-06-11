import { signOut } from '../../lib/auth-client'
import { LogoWordmark } from '../ui/Logo'

interface NavProps {
  user: {
    name?: string
    email?: string
    image?: string
    tier?: string
  }
}

export function Nav({ user }: NavProps) {
  return (
    <nav className="h-14 border-b border-hairline bg-canvas flex items-center justify-between px-xl flex-shrink-0">
      <div className="md:hidden text-on-dark">
        <LogoWordmark className="text-on-dark text-body-strong" />
      </div>
      <div className="flex-1 md:hidden" />
      <div className="flex items-center gap-md">
        {user.tier === 'pro' && (
          <span className="badge badge-info hidden sm:inline-flex">Pro</span>
        )}
        <span className="text-body-sm text-mute hidden sm:inline">
          {user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="btn-tertiary text-sm"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
