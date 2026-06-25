import { ShieldCheck } from 'lucide-react'
import React from 'react'

const STATUS_CONFIG = {
  draft:        { label: "Draft",        cls: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",              dot: "bg-gray-400" },
  approved:     { label: "Approved",     cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",     dot: "bg-emerald-500" },
  active:       { label: "Active",       cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",     dot: "bg-emerald-500" },
  under_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",             dot: "bg-amber-500" },
  revised:      { label: "Revised",      cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",         dot: "bg-purple-500" },
  achieved:     { label: "Achieved",     cls: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",                 dot: "bg-teal-500" },
  archived:     { label: "Archived",     cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",              dot: "bg-gray-400" },
}

function StatusPill({ status }) {
  const s = status?.toLowerCase()
  const cfg = STATUS_CONFIG[s] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",
    dot: "bg-gray-400",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}


function ComponentInfo({component , totalObjectives}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            {/* Order badge */}
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B1F6A] text-white text-sm font-semibold shrink-0">
              {component.display_order}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#EDE9F8] text-[#7B3FBE] dark:bg-accent dark:text-foreground">
                  <ShieldCheck className="size-3" /> {component.isqm_reference}
                </span>
                <StatusPill status={component.status} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {component.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Display order</p>
              <p className="text-sm font-medium text-foreground">#{component.display_order}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Status</p>
              <StatusPill status={component.status} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Total objectives</p>
              <p className="text-sm font-medium text-[#7B3FBE]">{totalObjectives} objectives</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">ISQM reference</p>
              <p className="text-sm font-medium text-foreground">{component.isqm_reference}</p>
            </div>
          </div>
        </div>
  )
}

export default ComponentInfo
