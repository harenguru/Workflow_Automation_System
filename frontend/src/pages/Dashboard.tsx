import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, GitBranch, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useWorkflows } from '../hooks/useWorkflows'
import WorkflowTable from '../components/WorkflowTable'
import CreateWorkflowModal from '../components/CreateWorkflowModal'
import { Workflow } from '../api/client'

const LIMIT = 10

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  glow,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  gradient: string
  glow: string
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: gradient, boxShadow: glow }}
        >
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1 cursor-default select-none">{value}</p>
      <p className="text-xs text-slate-500 font-medium cursor-default select-none">{label}</p>
      <div
        className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-5 -mr-8 -mb-8"
        style={{ background: gradient }}
      />
    </div>
  )
}

export default function Dashboard() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error } = useWorkflows({ page, limit: LIMIT, search })

  // Show "waking up" message if loading takes more than 4 seconds (Render cold start)
  useEffect(() => {
    if (isLoading) {
      slowTimer.current = setTimeout(() => setSlowLoad(true), 4000)
    } else {
      if (slowTimer.current) clearTimeout(slowTimer.current)
      setSlowLoad(false)
    }
    return () => { if (slowTimer.current) clearTimeout(slowTimer.current) }
  }, [isLoading])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1
  const allWorkflows: Workflow[] = data?.data ?? []
  const activeCount = allWorkflows.filter((w) => w.is_active).length
  const inactiveCount = allWorkflows.length - activeCount

  const handlePrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const handleNext = useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages])

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white cursor-default select-none">Workflows</h1>
          <p className="text-sm text-slate-500 mt-0.5 cursor-default select-none">Manage and run your automation workflows</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={15} />
          New Workflow
        </button>
      </div>

      {/* Cold start banner */}
      {isLoading && slowLoad && (
        <div className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-300"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <Loader2 size={15} className="animate-spin shrink-0" />
          <span>Backend is waking up on Render's free tier — this takes up to 30 seconds on first load. Please wait...</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl bg-white/5 mb-4" />
              <div className="h-8 bg-white/5 rounded w-16 mb-2" />
              <div className="h-3 bg-white/5 rounded w-24" />
            </div>
          ))
        ) : !isError ? (
          <>
            <StatCard label="Total Workflows" value={data?.total ?? 0} icon={GitBranch} gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" glow="0 4px 15px rgba(99,102,241,0.4)" />
            <StatCard label="Active" value={activeCount} icon={CheckCircle} gradient="linear-gradient(135deg, #10b981, #059669)" glow="0 4px 15px rgba(16,185,129,0.4)" />
            <StatCard label="Inactive" value={inactiveCount} icon={XCircle} gradient="linear-gradient(135deg, #475569, #334155)" glow="0 4px 15px rgba(71,85,105,0.3)" />
          </>
        ) : null}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search workflows..."
          className="input-royal"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-2 bg-white/5 rounded w-1/5" />
                </div>
                <div className="h-3 bg-white/5 rounded w-16" />
                <div className="h-3 bg-white/5 rounded w-12" />
                <div className="h-6 bg-white/5 rounded w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-400 text-sm">
            {(error as Error).message ?? 'Failed to load workflows.'}
          </div>
        ) : (
          <WorkflowTable workflows={allWorkflows} />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={page <= 1} className="btn-ghost px-3 py-2 disabled:opacity-30">
              <ChevronLeft size={14} />
              Prev
            </button>
            <button onClick={handleNext} disabled={page >= totalPages} className="btn-ghost px-3 py-2 disabled:opacity-30">
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {showModal && <CreateWorkflowModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
