import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { executionsApi, Execution } from '../api/client'
import { ClipboardList, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const STATUS_CONFIG: Record<Execution['status'], { label: string; color: string; dot: string }> = {
  pending:     { label: 'Pending',     color: 'text-yellow-400', dot: 'bg-yellow-400' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',   dot: 'bg-blue-400' },
  completed:   { label: 'Completed',   color: 'text-emerald-400', dot: 'bg-emerald-400' },
  failed:      { label: 'Failed',      color: 'text-red-400',    dot: 'bg-red-400' },
  canceled:    { label: 'Canceled',    color: 'text-slate-500',  dot: 'bg-slate-500' },
}

export default function AuditLog() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: ['executions', 'list', page],
    queryFn: () => executionsApi.list({ page, limit }),
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 1

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <ClipboardList size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white cursor-default select-none">Audit Log</h1>
            <p className="text-sm text-slate-500 mt-0.5 cursor-default select-none">All workflow execution history</p>
          </div>
        </div>
        {data && (
          <span
            className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {data.total} total
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-red-400 text-sm">Failed to load executions.</div>
      )}

      {data && data.data.length === 0 && (
        <div className="text-center py-20">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <ClipboardList size={24} className="text-indigo-500" />
          </div>
          <p className="text-sm text-slate-400">No executions yet</p>
          <p className="text-xs text-slate-600 mt-1">Run a workflow to see history here</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">ID</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">Workflow</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">Triggered By</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">Status</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">Started</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">Ended</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-default select-none">Retries</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((ex, idx) => {
                  const cfg = STATUS_CONFIG[ex.status]
                  return (
                    <tr
                      key={ex.id}
                      className="transition-all duration-150 cursor-pointer"
                      style={{ borderBottom: idx < data.data.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      onClick={() => navigate(`/executions/${ex.id}`)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{ex.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-300">
                        {ex.workflow?.name ?? ex.workflow_id.slice(0, 8) + '…'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{ex.triggered_by}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {ex.started_at ? new Date(ex.started_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {ex.ended_at ? new Date(ex.ended_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 text-center">{ex.retries}</td>
                      <td className="px-5 py-3.5">
                        <ExternalLink size={13} className="text-indigo-500 hover:text-indigo-300 transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
