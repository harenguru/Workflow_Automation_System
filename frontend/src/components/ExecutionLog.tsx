import { useState } from 'react'
import { CheckCircle2, XCircle, Ban, AlertTriangle, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react'
import { ExecutionLogEntry } from '../api/client'

function formatTime(timestamp: string): string {
  return new Date(timestamp).toTimeString().slice(0, 8)
}

function StepEntry({ entry, isLast }: { entry: ExecutionLogEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const hasRules = entry.rulesEvaluated && entry.rulesEvaluated.length > 0

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '2px solid rgba(16,185,129,0.5)',
          }}
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1 mb-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
        )}
      </div>

      <div className={`${isLast ? 'pb-0' : 'pb-5'} flex-1 min-w-0`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-200">{entry.stepName ?? entry.stepId}</span>
          {entry.durationMs != null && (
            <span
              className="text-xs text-slate-500 px-1.5 py-0.5 rounded-lg font-mono"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {entry.durationMs}ms
            </span>
          )}
          <span className="text-xs text-slate-600 ml-auto">{formatTime(entry.timestamp)}</span>
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
          <ArrowRight size={10} />
          {entry.nextStepId
            ? <span className="font-mono text-slate-500">{entry.nextStepId.slice(0, 8)}…</span>
            : <span className="text-slate-400 font-medium">End of Workflow</span>
          }
        </div>

        {hasRules && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            {expanded ? 'Hide' : 'Show'} rules ({entry.rulesEvaluated!.length})
          </button>
        )}

        {expanded && hasRules && (
          <div
            className="mt-2 space-y-1.5 pl-3"
            style={{ borderLeft: '2px solid rgba(99,102,241,0.2)' }}
          >
            {entry.rulesEvaluated!.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className="font-mono text-slate-400 px-1.5 py-0.5 rounded-lg border truncate max-w-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  {rule.condition}
                </span>
                <span className={`font-semibold shrink-0 ${
                  rule.result === true ? 'text-emerald-400' : rule.result === false ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {rule.result === null ? 'null' : String(rule.result)}
                </span>
                {rule.error && <span className="text-red-400 shrink-0">({rule.error})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ExecutionLogProps {
  logs: ExecutionLogEntry[]
}

export default function ExecutionLog({ logs }: ExecutionLogProps) {
  if (logs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-600 italic">No log entries yet — waiting for execution to start</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {logs.map((entry, i) => {
        const isLast = i === logs.length - 1

        if (entry.type === 'step') {
          return <StepEntry key={i} entry={entry} isLast={isLast} />
        }

        if (entry.type === 'error') {
          return (
            <div key={i} className="flex gap-4 pb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)' }}
              >
                <XCircle size={14} className="text-red-400" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-400">Error</span>
                  <span className="text-xs text-slate-600">{formatTime(entry.timestamp)}</span>
                </div>
                <p
                  className="text-xs text-red-400 mt-1 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)' }}
                >
                  {entry.errorMessage}
                </p>
              </div>
            </div>
          )
        }

        if (entry.type === 'cancel') {
          return (
            <div key={i} className="flex gap-4 pb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(249,115,22,0.15)', border: '2px solid rgba(249,115,22,0.4)' }}
              >
                <Ban size={14} className="text-orange-400" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-orange-400">Execution canceled</span>
                  <span className="text-xs text-slate-600">{formatTime(entry.timestamp)}</span>
                </div>
              </div>
            </div>
          )
        }

        if (entry.type === 'loop_limit') {
          return (
            <div key={i} className="flex gap-4 pb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(234,179,8,0.15)', border: '2px solid rgba(234,179,8,0.4)' }}
              >
                <AlertTriangle size={14} className="text-yellow-400" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-yellow-400">Max iterations reached (50)</span>
                  <span className="text-xs text-slate-600">{formatTime(entry.timestamp)}</span>
                </div>
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
