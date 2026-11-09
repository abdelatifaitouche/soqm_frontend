import { useState } from "react"
import {
  FileCheck2, CheckCircle2, Clock3, XCircle, CircleDashed,
  Plus, Loader2, AlertCircle, Check, Info,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSubmitEvidence } from "@/features/findings/hooks/useSubmitEvidence"
import { useAcceptEvidence } from "@/features/findings/hooks/useAcceptEvidence"

// ── Config ────────────────────────────────────────────────────────────────────
// Only ACCEPTED is confirmed by the backend so far. The others are likely
// states; anything unknown falls back to a readable label.

const EVIDENCE_STATUS_CONFIG = {
  ACCEPTED: {
    label: "Accepted",
    icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900",
    dot: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  PENDING: {
    label: "Pending review",
    icon: Clock3,
    badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900",
    dot: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900",
    dot: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  },
}

const FALLBACK_STATUS = {
  icon: CircleDashed,
  badge: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  dot: "bg-muted text-muted-foreground",
}

// Status shown for evidence that was just submitted, when the API doesn't send one back.
const NEW_EVIDENCE_STATUS = "PENDING"

const LONG_DESCRIPTION = 240

const FIELD_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLabel(str) {
  if (!str) return "Unknown"
  return str.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

function statusConfig(status) {
  return EVIDENCE_STATUS_CONFIG[status] ?? { ...FALLBACK_STATUS, label: formatLabel(status) }
}

function fmtDateTime(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const msg = detail.map((d) => d.msg).filter(Boolean).join(". ")
    if (msg) return msg
  }
  return fallback
}

// ── Small components ──────────────────────────────────────────────────────────

function EvidenceStatusBadge({ status }) {
  const cfg = statusConfig(status)
  return (
    <span className={cn("inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", cfg.badge)}>
      {cfg.label}
    </span>
  )
}

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > LONG_DESCRIPTION

  return (
    <div className="mt-1">
      <p
        className={cn(
          "whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground",
          isLong && !expanded && "line-clamp-3"
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function EvidenceItem({ item, accepting, disabled, error, onAccept }) {
  const cfg = statusConfig(item.status)
  const Icon = cfg.icon
  const submittedAt = fmtDateTime(item.created_at)
  const acceptedAt = fmtDateTime(item.accepted_at)
  // Items added locally after submit have no server id yet, so they can't be accepted.
  const canAccept = item.status !== "ACCEPTED" && !String(item.id).startsWith("local-")

  return (
    <li className="flex gap-3.5 px-5 py-4 sm:px-6">
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", cfg.dot)}>
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="break-words text-sm font-medium text-foreground">
            {item.title || "Untitled evidence"}
          </p>
          <EvidenceStatusBadge status={item.status} />
        </div>

        {item.description && <ExpandableText text={item.description} />}

        {(submittedAt || acceptedAt) && (
          <p className="mt-2 text-xs text-muted-foreground">
            {submittedAt && <>Submitted {submittedAt}</>}
            {submittedAt && acceptedAt && <span className="mx-1.5">·</span>}
            {acceptedAt && <>Accepted {acceptedAt}</>}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-px size-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      {canAccept && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 self-start px-2.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
          disabled={disabled}
          onClick={() => onAccept(item)}
        >
          {accepting ? <Loader2 className="animate-spin" /> : <Check />}
          Accept
        </Button>
      )}
    </li>
  )
}

// ── Submit drawer ─────────────────────────────────────────────────────────────
// The form is mounted only while the drawer is open, so it always starts empty.

function SubmitEvidenceForm({ actionId, onSubmitted, onClose }) {
  const { submit } = useSubmitEvidence(actionId)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const cleanTitle = title.trim()
  const cleanDescription = description.trim()
  const errors = {
    title: !cleanTitle ? "Give the evidence a short title." : "",
    description: !cleanDescription ? "Describe what was done and how it can be verified." : "",
  }
  const hasErrors = Object.values(errors).some(Boolean)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setError("")
    if (hasErrors) return

    setSaving(true)
    try {
      const result = await submit({
        evidence_title: cleanTitle,
        evidence_description: cleanDescription,
      })

      // Use what the API returns if it sends the created evidence back;
      // otherwise show what we just submitted.
      const created = result && typeof result === "object" && result.id ? result : null
      onSubmitted({
        id: `local-${Date.now()}`,
        action_id: actionId,
        status: NEW_EVIDENCE_STATUS,
        accepted_at: null,
        created_at: new Date().toISOString(),
        ...(created ?? {}),
        title: created?.title ?? cleanTitle,
        description: created?.description ?? cleanDescription,
      })
      onClose()
    } catch (err) {
      setError(extractError(err, "Couldn’t submit the evidence. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="evidence-title" className="text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="evidence-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            disabled={saving}
            autoFocus
            aria-invalid={submitted && !!errors.title}
            placeholder="e.g. Updated training attendance register"
            className={cn(FIELD_CLS, "h-10", submitted && errors.title && "border-destructive")}
          />
          {submitted && errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="evidence-description" className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="evidence-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            disabled={saving}
            aria-invalid={submitted && !!errors.description}
            placeholder="What was done, when, and where a reviewer can find the proof (document name, link, system, location)."
            className={cn(FIELD_CLS, "resize-y leading-relaxed", submitted && errors.description && "border-destructive")}
          />
          {submitted && errors.description ? (
            <p className="text-xs text-destructive">{errors.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A reviewer will use this to check that the action was carried out.
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button type="button" variant="ghost" size="lg" className="px-4" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="px-4" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Submit evidence
        </Button>
      </SheetFooter>
    </form>
  )
}

function SubmitEvidenceDrawer({ open, onOpenChange, actionId, onSubmitted }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Submit evidence</SheetTitle>
          <SheetDescription>Show that the work in this action was carried out.</SheetDescription>
        </SheetHeader>
        {open && (
          <SubmitEvidenceForm
            actionId={actionId}
            onSubmitted={onSubmitted}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
/**
 * Props
 *  - evidence:      action.action_completion_evidence (array, may be missing or empty)
 *  - actionId:      id of the action evidence is submitted to
 *  - blockedReason: string | null. When set, submitting is hidden and this explains why.
 *  - onSubmitted:   (evidence) => void. Add the new item to the page's copy of the action.
 *  - onAccepted:    (evidence) => void. Replace the item (matched by id) in the page's copy of the action.
 */
export default function ActionEvidenceSection({ evidence, actionId, blockedReason = null, onSubmitted, onAccepted }) {
  const [open, setOpen] = useState(false)
  const { accept } = useAcceptEvidence(actionId)
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptErrors, setAcceptErrors] = useState({})

  const items = Array.isArray(evidence) ? evidence : []
  const accepted = items.filter((e) => e.status === "ACCEPTED").length
  const blocked = !!blockedReason
  const progress = items.length ? Math.round((accepted / items.length) * 100) : 0

  async function handleAccept(item) {
    setAcceptingId(item.id)
    setAcceptErrors((prev) => ({ ...prev, [item.id]: "" }))
    try {
      const result = await accept(item.id)
      // Use what the API returns if it sends the updated evidence back;
      // otherwise mark the item as accepted locally.
      const updated = result && typeof result === "object" && result.id ? result : null
      onAccepted?.({
        ...item,
        status: "ACCEPTED",
        accepted_at: new Date().toISOString(),
        ...(updated ?? {}),
      })
    } catch (err) {
      setAcceptErrors((prev) => ({
        ...prev,
        [item.id]: extractError(err, "Couldn’t accept the evidence. Try again."),
      }))
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Evidence</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {items.length > 0
                ? `${accepted} of ${items.length} accepted`
                : "Proof that the work in this action was carried out."}
            </p>
          </div>

          {!blocked && items.length > 0 && (
            <Button variant="outline" size="lg" className="shrink-0 px-3" onClick={() => setOpen(true)}>
              <Plus /> Add evidence
            </Button>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 pt-3 sm:px-6">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Evidence accepted"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Body */}
        {items.length === 0 ? (
          <div className="m-5 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center sm:m-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <FileCheck2 className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No evidence yet</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              {blockedReason ?? "Submit evidence once the work is done so a reviewer can verify it."}
            </p>
            {!blocked && (
              <Button size="lg" className="mt-2 px-4" onClick={() => setOpen(true)}>
                <Plus /> Submit evidence
              </Button>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
              {items.map((e) => (
                <EvidenceItem
                  key={e.id}
                  item={e}
                  accepting={acceptingId === e.id}
                  disabled={acceptingId !== null}
                  error={acceptErrors[e.id]}
                  onAccept={handleAccept}
                />
              ))}
            </ul>
            {blocked && (
              <p className="flex items-center gap-2 border-t border-border/60 bg-muted/40 px-5 py-3 text-xs text-muted-foreground sm:px-6">
                <Info className="size-3.5 shrink-0" /> {blockedReason}
              </p>
            )}
          </>
        )}
      </section>

      <SubmitEvidenceDrawer
        open={open}
        onOpenChange={setOpen}
        actionId={actionId}
        onSubmitted={onSubmitted}
      />
    </>
  )
}
