import { ShieldAlert,
  ClipboardList, CheckCircle2, ShieldCheck, Archive,
  RefreshCw, FileSearch, 
} from "lucide-react"


const STATUS_CONFIG = {
  identified:       { label: "Identified",       icon: ShieldAlert,   cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  assessed:         { label: "Assessed",          icon: FileSearch,    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  treatment_planned:{ label: "Treatment Planned", icon: ClipboardList, cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900" },
  mitigated:        { label: "Mitigated",         icon: ShieldCheck,   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  accepted:         { label: "Accepted",          icon: CheckCircle2,  cls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900" },
  closed:           { label: "Closed",            icon: Archive,       cls: "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" },
  under_review:     { label: "Under Review",      icon: RefreshCw,     cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
}

export default STATUS_CONFIG;