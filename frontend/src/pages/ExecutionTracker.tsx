import { useParams, useNavigate } from 'react-router-dom'
import { useExecution, useCancelExecution, useRetryExecution } from '../hooks/useExecution'
import ExecutionLog from '../components/ExecutionLog'
import { ArrowLeft, Clock, RefreshCw, XCircle, CheckCircle, Loader, Ban } from 'lucide-react'

const STATUS_CONFIG: Record<string, {
  label: string
  gradient: string
  glow: string
  icon: React.ElementType
  pulse?: boolean
}> = {
  pending:     { label: 'Pending',     gradient: 'linear-gradient(135deg, #64748b, #475569)', glow: '0 4px 15px rgba(100,116,139,0.3)', icon: Clock },
  in_progress: { label: 'In Progress', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: '0 4px 15px rgba(59,130,246,0.4)',  icon: Loader, pulse: true },
  completed:   { label: 'Completed',   gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: '0 4px 15px rgba(16,185,129,0.4)',  icon: CheckCircle },
  failed:      { label: 'Failed',      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: '0 4px 15px rgba(239,68,68,0.4)',   icon: XCircle },
  canceled:    { label: 'Canceled',    gradient: 'linear-gradient(135deg, #f97316, #ea580c)', glow: '0 4px 15px rgba(249,115,22,0.3)',  icon: Ban },
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 cursor-default select-none">{label}</p>
      <p className="text-sm font-semibold text-slate-200 cursor-default select-none">{value}</p>
    </div>
  )
}

export default function ExecutionTracker() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: execution, isLoading, error } = useExecution(id!)
  const cancel = useCancelExecution()
  const retry = useRetryExecution()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !execution) {
    return (
      <div className="p-8 text-center text-red-400 text-sm">
        {error instanceof Error ? error.message : 'Execution not found.'}
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[execution.status] ?? STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const isActive = execution.status === 'pending' || execution.status === 'in_progress'
  const isFailed = execution.status === 'failed'

  const handleCancel = async () => {
    await cancel.mutateAsync(execution.id)
  }

  const handleRetry = async () => {
    const newExecution = await retry.mutateAsync(execution.id)
    navigate(`/executions/${newExecution.id}`)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to dashboard
      </button>

      <div
        className="rounded-2xl p-6 mb-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Execution Details</h1>
            <p className="text-xs font-mono text-slate-600 mt-1">{execution.id}</p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: statusCfg.gradient, boxShadow: statusCfg.glow }}
          >
            <StatusIcon size={12} className={statusCfg.pulse ? 'animate-spin' : ''} />
            {statusCfg.label}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <MetaItem label="Retries" value={execution.retries} />
          <MetaItem label="Started" value={formatDateTime(execution.started_at)} />
          <MetaItem label="Ended" value={formatDateTime(execution.ended_at)} />
        </div>

        {(isActive || isFailed) && (
          <div className="flex gap-2 mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {isActive && (
              <button
                onClick={handleCancel}
                disabled={cancel.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
              >
                <Ban size={14} />
                {cancel.isPending ? 'Canceling...' : 'Cancel'}
              </button>
            )}
            {isFailed && (
              <button onClick={handleRetry} disabled={retry.isPending} className="btn-primary">
                <RefreshCw size={14} />
                {retry.isPending ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h2 className="text-sm font-semibold text-slate-300 mb-6 cursor-default select-none">Execution Timeline</h2>
        <ExecutionLog logs={execution.logs ?? []} />
      </div>
    </div>
  )
}
