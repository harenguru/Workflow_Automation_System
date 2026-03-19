import { lazy, Suspense, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Menu, X, Zap } from 'lucide-react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const WorkflowEditor = lazy(() => import('./pages/WorkflowEditor'))
const ExecutionRunner = lazy(() => import('./pages/ExecutionRunner'))
const ExecutionTracker = lazy(() => import('./pages/ExecutionTracker'))
const AuditLog = lazy(() => import('./pages/AuditLog'))

const navItems = [
  { to: '/', label: 'Workflows', icon: LayoutDashboard, end: true },
  { to: '/audit', label: 'Audit Log', icon: ClipboardList, end: false },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        style={{
          background: 'linear-gradient(180deg, #0d0f18 0%, #111320 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
          >
            <Zap size={17} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-wide">FlowEngine</span>
            <p className="text-xs text-slate-500 mt-0.5">Workflow Automation</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-600 hover:text-slate-400 lg:hidden transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Navigation</p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                      border: '1px solid rgba(99,102,241,0.3)',
                      boxShadow: '0 2px 10px rgba(99,102,241,0.1)',
                    }
                  : { background: 'transparent', border: '1px solid transparent' }
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>


      </aside>
    </>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#0d0f18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-300 transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm text-white">FlowEngine</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workflows/:id/edit" element={<WorkflowEditor />} />
              <Route path="/workflows/:id/execute" element={<ExecutionRunner />} />
              <Route path="/executions/:id" element={<ExecutionTracker />} />
              <Route path="/audit" element={<AuditLog />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
