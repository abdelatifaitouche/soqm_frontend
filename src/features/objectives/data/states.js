import {
 CircleDashed, CheckCircle2,
  Activity, RefreshCw, PenLine, Shield, Archive, Pause, Replace,
} from "lucide-react"

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

export default STATUS_CONFIG