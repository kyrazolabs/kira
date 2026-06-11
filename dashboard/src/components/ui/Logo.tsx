export function Logo({ className = 'w-6 h-6', variant = 'line' }: { className?: string; variant?: 'line' | 'filled' }) {
  const filled = variant === 'filled'
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className}>
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12c6.268 0 9-2.637 9-9c0 6.363 2.713 9 9 9c-6.287 0-9 2.713-9 9c0-6.287-2.732-9-9-9Z"
      />
    </svg>
  )
}

export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <div
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: '#0d0d0d',
        border: '1px solid #242728'
      }}
    >
      <Logo className="text-accent-yellow" style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  )
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo className="text-accent-yellow w-5 h-5" />
      <span>Kira</span>
    </span>
  )
}
