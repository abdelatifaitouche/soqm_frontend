import { Ban } from "lucide-react"

// Human labels for closure codes. Unknown codes fall back to a readable version
// of the code itself, so new codes still display sensibly. Add entries as needed.
const CLOSURE_CODE_LABEL = {
  ERR_ENTRY: "Entered in error",
}

function formatLabel(str) {
  if (!str) return ""
  return str.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

export function closureReasonLabel(closure) {
  const code = closure?.closure_code
  if (!code) return null
  return CLOSURE_CODE_LABEL[code] ?? formatLabel(code)
}

/** Status pill for a voided risk, for the masthead. */
export function VoidedPill() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Ban className="size-3.5" />
      Voided
    </span>
  )
}

/**
 * Replaces the workflow stepper on a voided risk (a stepper makes no sense once
 * the risk is out of the workflow). `closure` is risk.closure_reason, which may be null.
 */
export default function ClosureNotice({ closure }) {
  const reason = closureReasonLabel(closure)
  const comment = closure?.closure_reason_comment?.trim()

  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Ban className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          This risk was voided
          {reason && <span className="font-normal text-muted-foreground"> · {reason}</span>}
        </p>

        {comment ? (
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line break-words border-l-2 border-border pl-3">
            {comment}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No comment was recorded.</p>
        )}
      </div>
    </div>
  )
}