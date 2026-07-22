import { ArrowUpRight, Calendar, CircleDashed, CheckCircle2, Activity, RefreshCw, PenLine, Archive, Pause, Replace, Shield } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formatDate";

const STATUS_CONFIG = {
  draft:        { label: "Draft",        icon: CircleDashed,  cls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  approved:     { label: "Approved",     icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  active:       { label: "Active",       icon: Activity,      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  under_review: { label: "Under Review", icon: RefreshCw,     cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  revised:      { label: "Revised",      icon: PenLine,       cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900" },
  achieved:     { label: "Achieved",     icon: Shield,        cls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900" },
  superseded:   { label: "Superseded",   icon: Replace,       cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900" },
  suspended:    { label: "Suspended",    icon: Pause,         cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
  archived:     { label: "Archived",     icon: Archive,       cls: "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" },
}

function StatusPill({ status }) {
  const key = status?.toLowerCase()
  const cfg = STATUS_CONFIG[key] ?? { label: status ?? "—", icon: CircleDashed, cls: "bg-slate-100 text-slate-400 border-slate-200" }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="size-2.5" />
      {cfg.label}
    </span>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={4} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <CircleDashed className="size-4 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">No objectives yet.</p>
        </div>
      </td>
    </tr>
  )
}

function ObjectiveTable({ objectives }) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {["Objective", "Status", "Review date", ""].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!objectives?.length ? (
            <EmptyState />
          ) : (
            objectives.map((obj) => (
              <tr
                key={obj.id}
                onClick={() => navigate(`/objectives/${obj.id}`)}
                className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                {/* Objective text */}
                <td className="px-5 py-4 max-w-sm">
                  <p className="text-sm text-foreground line-clamp-2 leading-snug">
                    {obj.objective_reference}
                  </p>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <StatusPill status={obj.status} />
                </td>

                {/* Review date */}
                <td className="px-5 py-4">
                  {obj.review_date ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3 shrink-0" />
                      {formatDate(obj.review_date)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </td>

                {/* Action */}
                <td className="px-5 py-4 w-px">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/objectives/${obj.id}`); }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                    >
                      <ArrowUpRight className="size-3" /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ObjectiveTable