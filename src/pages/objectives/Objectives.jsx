import { useObjectives } from '@/hooks/useObjectives'
import { Avatar } from '@base-ui/react'
import { AlertCircle, ArrowBigRightDash, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

function Objectives() {
const { objectives, loading, error, setObjectives } = useObjectives()
    const navigate = useNavigate()    
if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading objectives…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive gap-2">
        <AlertCircle className="size-4" />
        <span className="text-sm">Failed to load objectives.</span>
      </div>
    )
  }
  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1E0A3C] tracking-tight">Quality Objectives</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage SOQM Objectives
          </p>
          </div>

          <button
          onClick={()=>navigate("/objectives/create")}
              className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <Plus className="size-3.5" /> add
            </button>

          
        </div>
      {/* Table */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">

          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">objective</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">status</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">review date</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">component</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">view</th>

              </tr>
            </thead>
            <tbody>
              {objectives.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-muted-foreground py-16">
                    No objective found.
                  </td>
                </tr>
              ) : (
                objectives.map((objective) => (
                  <tr key={objective.id} className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                   
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{objective.objective_reference}</span>
                    </td>
                    
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        objective.status == "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        <span className={`size-1.5 rounded-full ${objective.status == "active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {objective.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{objective.review_date}</span>
                    </td>
                     <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{objective.component_id}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                        <button
                        onClick={() => navigate(`/objectives/${objective.id}`)}
                        className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <ArrowBigRightDash className="size-3.5" /> view
            </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          
        </div>
    </div>
  )
}

export default Objectives
