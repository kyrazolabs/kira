import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: Toast[]
  toast: (message: string, type?: ToastType) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  const colors = {
    success: { bg: 'rgba(89,212,153,0.15)', border: 'rgba(89,212,153,0.25)', text: '#59d499', icon: 'M5 13l4 4L19 7' },
    error:   { bg: 'rgba(255,97,97,0.15)',  border: 'rgba(255,97,97,0.25)',  text: '#ff6161', icon: 'M18 6L6 18M6 6l12 12' },
    info:    { bg: 'rgba(87,193,255,0.15)',  border: 'rgba(87,193,255,0.25)',  text: '#57c1ff', icon: 'M12 16v-4M12 8h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z' }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => {
        const c = colors[t.type]
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto cursor-pointer flex items-center gap-2 px-md py-sm rounded-md text-body-sm border animate-[slide-up_200ms_ease]"
            style={{
              background: '#101111',
              borderColor: '#242728',
              color: '#cdcdcd',
              maxWidth: 380,
              fontFeatureSettings: '"calt","kern","liga","ss03"'
            }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-xs text-xs font-semibold flex-shrink-0"
              style={{ background: c.bg, color: c.text }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.icon}/>
              </svg>
            </span>
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
