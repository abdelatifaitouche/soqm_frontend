import React from 'react'
import { formatDate } from '@/utils/formatDate'
const STATUS_CONFIG = {
  draft:        { label: "Draft",        cls: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",              dot: "bg-gray-400" },
  approved:     { label: "Approved",     cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",     dot: "bg-emerald-500" },
  active:       { label: "Active",       cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",                 dot: "bg-blue-500" },
  under_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",             dot: "bg-amber-500" },
  revised:      { label: "Revised",      cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",         dot: "bg-purple-500" },
  achieved:     { label: "Achieved",     cls: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",                 dot: "bg-teal-500" },
  superseded:   { label: "Superseded",   cls: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",         dot: "bg-orange-500" },
  suspended:    { label: "Suspended",    cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",                     dot: "bg-red-500" },
  archived:     { label: "Archived",     cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",              dot: "bg-gray-400" },
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
function ObjectiveCard({objective}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">

        <p className="text-[16px] font-semibold  tracking-widest text-muted-foreground mb-2">Objective : {objective.objective_reference}</p>
          <div>
        <p className="text-sm leading-relaxed text-muted-foreground">{objective.description}</p>
          </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Status</p>
            <StatusPill status={objective.status} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Review date</p>
            <p className="text-sm font-medium text-foreground">{formatDate(objective.review_date)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Last updated</p>
            <p className="text-sm font-medium text-foreground">{formatDate(objective.updated_at)}</p>
          </div>
        </div>
      </div>
  )
}

export default ObjectiveCard
