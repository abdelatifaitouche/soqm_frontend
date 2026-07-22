import { ShieldCheck, Hash, Target, BookOpen } from 'lucide-react'
import React from 'react'

const STATUS_CONFIG = {
  draft:        { label: "Draft",        cls: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",          dot: "bg-gray-400" },
  approved:     { label: "Approved",     cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  active:       { label: "Active",       cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  under_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",         dot: "bg-amber-500" },
  revised:      { label: "Revised",      cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",     dot: "bg-purple-500" },
  achieved:     { label: "Achieved",     cls: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",             dot: "bg-teal-500" },
  archived:     { label: "Archived",     cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",          dot: "bg-gray-400" },
}

function StatusPill({ status }) {
  const s   = status?.toLowerCase()
  const cfg = STATUS_CONFIG[s] ?? { label: status, cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground", dot: "bg-gray-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function Stat({ icon: Icon, label, value, valueClass = "text-foreground" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none mb-1">
          {label}
        </p>
        <p className={`text-sm font-medium leading-none ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}

function ComponentInfo({ component, totalObjectives }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">

      {/* Top section — order + description */}
      <div className="flex items-start gap-5 p-6">

        {/* Order badge */}
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#3B1F6A] text-white text-sm font-bold shrink-0 tabular-nums">
          {String(component.display_order).padStart(2, "0")}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EDE9F8] text-[#7B3FBE] dark:bg-accent dark:text-foreground">
              <ShieldCheck className="size-3" />
              {component.isqm_reference}
            </span>
            <StatusPill status={component.status} />
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {component.description || (
              <span className="italic text-muted-foreground/50">No description provided.</span>
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
        <div className="bg-card px-6 py-4">
          <Stat
            icon={Hash}
            label="Display order"
            value={`#${component.display_order}`}
          />
        </div>
        <div className="bg-card px-6 py-4">
          <Stat
            icon={Target}
            label="Objectives"
            value={`${totalObjectives ?? 0} total`}
            valueClass="text-[#7B3FBE]"
          />
        </div>
        <div className="bg-card px-6 py-4 col-span-2 sm:col-span-1">
          <Stat
            icon={BookOpen}
            label="ISQM reference"
            value={component.isqm_reference}
          />
        </div>
      </div>
    </div>
  )
}

export default ComponentInfo