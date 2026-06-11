import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './lib/auth-client'
import { ToastProvider } from './components/ui/Toast'
import { Sidebar } from './components/layout/Sidebar'
import { Nav } from './components/layout/Nav'
import Dashboard from './pages/Dashboard'
import Personas from './pages/Personas'
import Usage from './pages/Usage'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import Login from './pages/Login'

export default function App() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-mute animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Nav user={session.user} />
          <main className="flex-1 p-xl lg:p-xxl max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/personas" element={<Personas />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
