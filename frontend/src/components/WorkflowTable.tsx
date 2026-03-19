import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Play, CheckCircle, XCircle, GitBranch, Trash2 } from 'lucide-react'
import { Workflow } from '../api/client'
import { useDeleteWorkflow } from '../hooks/useWorkflows'

interface WorkflowTableProps {
  workflows: Workflow[]
}

export default function WorkflowTable({ workflows }: WorkflowTableProps) {
  const navigate = useNavigate()
  const deleteWorkflow = useDeleteWorkflow()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    deleteWorkflow.mutate(id)
    setConfirmDeleteId(null)
  }

  if (workflows.length === 0) {
    return (
      <div className="py-20 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <GitBranch size={24} className="text-indigo-400" />
        </div>
        <p className="text-sm font-medium text-slate-400">No workflows yet</p>
        <p className="text-xs text-slate-600 mt-1">Create one to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Name</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Steps</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Version</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Status</th>
            <th className="px-5 py-3.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((workflow, idx) => (
            <tr
              key={workflow.id}
              className="group transition-all duration-200"
              style={{
                borderBottom: idx < workflows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <GitBranch size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{workflow.name}</p>
                    <p className="text-xs text-slate-600 font-mono">{workflow.id.slice(0, 8)}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm text-slate-400">{workflow._count?.steps ?? 0} steps</span>
              </td>
              <td className="px-5 py-4">
                <span
                  className="text-xs font-mono px-2 py-1 rounded-lg text-slate-400"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  v{workflow.version}
                </span>
              </td>
              <td className="px-5 py-4">
                {workflow.is_active ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <CheckCircle size={11} />
                    Active
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <XCircle size={11} />
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 rounded-lg transition-all duration-200 hover:text-slate-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/workflows/${workflow.id}/execute`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                      boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(99,102,241,0.5)'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(99,102,241,0.3)'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    }}
                  >
                    <Play size={11} />
                    Run
                  </button>
                  {confirmDeleteId === workflow.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200"
                        style={{ background: 'rgba(239,68,68,0.8)' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 rounded-lg transition-all duration-200"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(workflow.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 rounded-lg transition-all duration-200"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'
                      }}
                    >
                      <Trash2 size={11} />
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
