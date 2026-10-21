import React, { useState, useMemo, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle, Loader2, ArrowRight, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, ArrowDownUp, X, Save, Calendar,
  Unlink, Check, Target,
} from "lucide-react"
import { useObjective } from "@/features/objectives/hooks/useObjective"
import { useObjectiveRisks } from "@/features/objectives/hooks/useObjectiveRisks"
import { useRole } from "@/features/auth/hooks/useRole"
import {
  updateObjective,
  linkRiskToObjective,
  unlinkRiskFromObjective,
  getComponentRisks,
} from "@/features/objectives/api/objectivesApi"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ObjectiveCard from "../components/ObjectiveCard"

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "",                  label: "All statuses" },
  { value: "identified",        label: "Identified" },
  { value: "assessed",          label: "Assessed" },
  { value: "treatment_planned", label: "Treatment planned" },
  { value: "mitigated",         label: "Mitigated" },
  { value: "accepted",          label: "Accepted" },
  { value: "under_review",      label: "Under review" },
  { value: "closed",            label: "Closed" },
]

const SORT_OPTIONS = [
  { order_by: "created_at", direction: "desc", label: "Newest first" },
  { order_by: "created_at", direction: "asc",  label: "Oldest first" },
  { order_by: "score",      direction: "desc", label: "Highest score" },
  { order_by: "score",      direction: "asc",  label: "Lowest score" },
]

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

const INPUT_CLS =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"

const LABEL_CLS =
  "block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5"

function formatLabel(str) {
  if (!str) return "—"
  return str.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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

// ── Edit drawer ───────────────────────────────────────────────────────────────

function EditDrawer({ open, onClose, objective, onSaved }) {
  const [form, setForm]     = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  // init form when drawer opens
  useEffect(() => {
    if (open && objective) {
      setForm({
        description: objective.description ?? "",
        review_date: objective.review_date
          ? objective.review_date.split("T")[0]   // "2027-06-12"
          : "",
      })
      setError("")
    }
  }, [open, objective])

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const payload = {
        description: form.description || null,
        review_date: form.review_date ? `${form.review_date}T00:00:00` : null,
      }
      const res = await updateObjective(objective.id, payload)
      // Handle both axios shapes:
      // - standard axios: res.data is the body
      // - interceptor-unwrapped: res is already the body
      const updated = res?.data ?? res
      onSaved({ ...objective, ...updated })
      onClose()
    } catch (err) {
      // Only show error if it's a genuine error — not when the api
      // interceptor resolves with a meta-wrapped success response
      const detail = err?.response?.data?.detail ?? err?.message
      if (detail) setError(detail)
      else onClose() // meta-handled success — just close
    } finally {
      setSaving(false)
    }
  }

  if (!form) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-mono text-[#3B1F6A] dark:text-[#a78bdb]">
            {objective?.objective_reference}
          </SheetTitle>
          <SheetDescription>Update description and review date</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-5">

          {/* Description */}
          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={5}
              placeholder="Describe this objective…"
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          {/* Review date */}
          <div>
            <label className={LABEL_CLS}>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> Review date
              </span>
            </label>
            <input
              type="date"
              value={form.review_date}
              onChange={set("review_date")}
              className={INPUT_CLS}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] hover:bg-[#52298F] rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function ObjectiveHeader({ objective, isAdmin, onEdit }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate("/objectives")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border bg-card px-2.5 py-1.5 rounded-lg"
          >
            ← Objectives
          </button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
            {objective.objective_reference}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {objective.objective_reference}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review objective information and manage linked risks
        </p>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            <Pencil className="size-3.5" /> Edit
          </button>
          <button
            onClick={() => {/* delete */}}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 transition-colors"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const cfg =
    score >= 6 ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
    score >= 3 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                 "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg}`}>
      Score {score}
    </span>
  )
}

// ── DotBar (original) ─────────────────────────────────────────────────────────

function DotBar({ value, max = 3 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`size-2 rounded-sm ${
              i < value ? "bg-[#7B3FBE]" : "bg-muted border border-border"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{value} / {max}</span>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }) {
  // Hooks run before the early return so the hook order never changes between renders.
  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-border">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="size-3.5" />
      </button>
      {pages.map((p, i) => {
        const gap = pages[i - 1] !== undefined && p - pages[i - 1] > 1
        return (
          <React.Fragment key={p}>
            {gap && <span className="px-1.5 text-xs text-muted-foreground/50">…</span>}
            <button onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}
              className={`flex items-center justify-center size-8 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-[#3B1F6A] text-white"
                  : "border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}>
              {p}
            </button>
          </React.Fragment>
        )
      })}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page"
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  )
}

// ── Link-existing-risk drawer ─────────────────────────────────────────────────
// Lists the risks of the objective's component. Risks already linked show as
// "Linked". The mounted form resets every time the drawer opens.

const DRAWER_PAGE_SIZE = 10

function LinkRiskDrawer({ open, onOpenChange, objectiveId, componentId, linkedIds, onLinked }) {
  const [page, setPage]           = useState(1)
  const [data, setData]           = useState({ items: [], total: 0, size: DRAWER_PAGE_SIZE })
  const [loading, setLoading]     = useState(false)
  const [loadError, setLoadError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [addingId, setAddingId]   = useState(null)
  const [addError, setAddError]   = useState("")
  // Risks the backend told us are already linked to this objective (e.g. on another page).
  const [alsoLinked, setAlsoLinked] = useState(() => new Set())

  useEffect(() => {
    if (!open || !componentId) return
    let cancelled = false
    setLoading(true)
    setLoadError("")
    getComponentRisks(componentId, { page, size: DRAWER_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        setData({
          items: res?.items ?? [],
          total: res?.total ?? 0,
          size: res?.size ?? DRAWER_PAGE_SIZE,
        })
      })
      .catch(() => { if (!cancelled) setLoadError("Couldn’t load risks. Try again.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, page, reloadKey, componentId])

  const handleOpenChange = (val) => {
    if (!val) {
      setPage(1)
      setAddError("")
    }
    onOpenChange(val)
  }

  const handleAdd = async (risk) => {
    setAddingId(risk.id)
    setAddError("")
    try {
      await linkRiskToObjective(risk.id, objectiveId)
      onLinked(risk)
    } catch (err) {
      if (err?.response?.status === 409) {
        setAlsoLinked((prev) => new Set(prev).add(risk.id))
        setAddError(`Risk ${risk.risk_ref} is already linked to this objective.`)
      } else {
        setAddError(extractError(err, "Couldn’t link this risk. Try again."))
      }
    } finally {
      setAddingId(null)
    }
  }

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.size || DRAWER_PAGE_SIZE)))

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Add existing risk</SheetTitle>
          <SheetDescription>
            Risks from this objective’s component. Pick one to link it to this objective.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {addError && (
            <div role="alert" className="flex items-center gap-2 text-xs text-red-600 mb-3">
              <AlertCircle className="size-3.5 shrink-0" />
              {addError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading risks…</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <p className="text-sm text-destructive">{loadError}</p>
              <button onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-medium text-[#7B3FBE] hover:underline">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Target className="size-4 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No risks found for this component.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((risk) => {
                const linked = linkedIds.has(risk.id) || alsoLinked.has(risk.id)
                const adding = addingId === risk.id
                return (
                  <li key={risk.id} className={`flex items-start gap-3 py-3.5 ${linked ? "opacity-70" : ""}`}>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                          {risk.risk_ref}
                        </span>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {formatLabel(risk.status)}
                        </span>
                        <ScoreBadge score={risk.score} />
                      </div>
                      <p className="text-sm text-foreground/90 leading-snug line-clamp-2">
                        {risk.risk_description || <span className="italic text-muted-foreground">No description</span>}
                      </p>
                    </div>
                    {linked ? (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3.5" /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(risk)}
                        disabled={addingId !== null}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {adding ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                        Add
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || loading} aria-label="Previous page"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="size-3.5" />
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages || loading} aria-label="Next page"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ObjectiveDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()

  // Who may link / unlink risks. Change this one line if it shouldn't be admin-only.
  const canManageLinks = isAdmin

  const {
    objective,
    loading: objLoading,
    error: objError,
    setOjective,
    setObjective,
  } = useObjective(id)

  // useObjective may spell the setter with or without the 'c' — handle both
  const setObj = setOjective ?? setObjective ?? (() => {})

  const [editOpen,     setEditOpen]     = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [sortIndex,    setSortIndex]    = useState(0)
  const [page,         setPage]         = useState(1)

  // Link / unlink state
  const [linkOpen,      setLinkOpen]      = useState(false)
  const [riskToUnlink,  setRiskToUnlink]  = useState(null)
  const [unlinking,     setUnlinking]     = useState(false)
  const [unlinkError,   setUnlinkError]   = useState("")
  // useObjectiveRisks has no setter, so link/unlink changes are layered on top of
  // what it returned. Fresh data from the hook clears them.
  const [removedIds, setRemovedIds] = useState(() => new Set())
  const [addedRisks, setAddedRisks] = useState([])

  const sort = SORT_OPTIONS[sortIndex]

  const filters = useMemo(() => ({
    ...(statusFilter && { status: statusFilter }),
  }), [statusFilter])

  useEffect(() => { setPage(1) }, [statusFilter, sortIndex])

  const { risks, total, totalPages, loading: riskLoading, error: riskError } =
    useObjectiveRisks(id, filters, page, { order_by: sort.order_by, direction: sort.direction })

  useEffect(() => {
    setRemovedIds(new Set())
    setAddedRisks([])
  }, [risks])

  // What the table shows: server rows minus unlinked ones, plus risks linked this session.
  const serverRisks = risks ?? []
  const visibleRisks = serverRisks.filter((r) => !removedIds.has(r.id))
  const extraRisks =
    page === 1
      ? addedRisks.filter(
          (a) => !serverRisks.some((r) => r.id === a.id) && (!statusFilter || a.status === statusFilter)
        )
      : []
  const displayRisks = [...extraRisks, ...visibleRisks]
  const displayTotal = Math.max(0, (total ?? 0) + addedRisks.length - removedIds.size)

  const linkedIds = useMemo(
    () => new Set(displayRisks.map((r) => r.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [risks, removedIds, addedRisks]
  )

  const highestScore = displayRisks.length ? Math.max(...displayRisks.map((r) => r.score)) : 0
  const avgScore     = displayRisks.length
    ? (displayRisks.reduce((s, r) => s + r.score, 0) / displayRisks.length).toFixed(1)
    : "—"

  const componentId = objective?.component_id ?? objective?.component?.id ?? null

  const handleLinked = (risk) => {
    if (serverRisks.some((r) => r.id === risk.id)) {
      // Re-linking something we just unlinked: it is still in the server data.
      setRemovedIds((prev) => {
        const next = new Set(prev)
        next.delete(risk.id)
        return next
      })
    } else {
      setAddedRisks((prev) => (prev.some((r) => r.id === risk.id) ? prev : [risk, ...prev]))
    }
  }

  const openUnlink = (risk) => {
    setUnlinkError("")
    setRiskToUnlink(risk)
  }

  const closeUnlink = () => {
    if (unlinking) return
    setRiskToUnlink(null)
    setUnlinkError("")
  }

  const handleUnlink = async (e) => {
    e.preventDefault() // keep the dialog open until the request settles
    if (!riskToUnlink) return
    setUnlinking(true)
    setUnlinkError("")
    try {
      await unlinkRiskFromObjective(riskToUnlink.id, objective.id)
      const gone = riskToUnlink.id
      setAddedRisks((prev) => prev.filter((r) => r.id !== gone))
      setRemovedIds((prev) => new Set(prev).add(gone))
      setRiskToUnlink(null)
    } catch (err) {
      setUnlinkError(extractError(err, "Couldn’t remove this risk. Try again."))
    } finally {
      setUnlinking(false)
    }
  }

  if (objLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading objective…</span>
    </div>
  )

  if (objError || !objective) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" /><span className="text-sm">Objective not found.</span>
    </div>
  )

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <ObjectiveHeader
          objective={objective}
          isAdmin={isAdmin}
          onEdit={() => setEditOpen(true)}
        />

        {/* Objective info card */}
        <ObjectiveCard objective={objective} />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total risks",           value: displayTotal,       color: "text-foreground" },
            { label: "Highest score",         value: displayRisks.length ? highestScore : "—",
              color: highestScore >= 6 ? "text-red-600 dark:text-red-400"
                   : highestScore >= 3 ? "text-amber-600 dark:text-amber-400"
                   :                    "text-emerald-600 dark:text-emerald-400",
              suffix: displayRisks.length ? " / 9" : "" },
            { label: "Avg score (this page)", value: avgScore,          color: "text-amber-600 dark:text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>
                {s.value}
                {s.suffix && <span className="text-sm font-normal text-muted-foreground">{s.suffix}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Risks table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Linked risks</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All risks associated with this objective</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SELECT_CLS}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex items-center gap-1.5">
                <ArrowDownUp className="size-3.5 text-muted-foreground" />
                <select value={sortIndex} onChange={(e) => setSortIndex(Number(e.target.value))} className={SELECT_CLS}>
                  {SORT_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
                </select>
              </div>
              {canManageLinks && (
                <button
                  onClick={() => setLinkOpen(true)}
                  disabled={!componentId}
                  title={!componentId ? "This objective has no component" : undefined}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3" /> Add existing
                </button>
              )}
              <button
                onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
              >
                <Plus className="size-3" /> New risk
              </button>
            </div>
          </div>

          {riskLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading risks…</span>
            </div>
          ) : riskError ? (
            <div className="py-12 text-center text-destructive text-sm">Failed to load risks.</div>
          ) : !displayRisks.length ? (
            <div className="py-14 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {statusFilter ? "No risks match this filter." : "No risks linked to this objective yet."}
              </p>
              <div className="flex items-center justify-center gap-4">
                {canManageLinks && componentId && !statusFilter && (
                  <button
                    onClick={() => setLinkOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline"
                  >
                    <Plus className="size-3.5" /> Add an existing risk
                  </button>
                )}
                <button
                  onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline"
                >
                  <Plus className="size-3.5" /> Create a new risk
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      {["Ref", "Description", "Significance", "Occurrence", "Score", ""].map((h, i) => (
                        <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRisks.map((risk) => (
                      <tr
                        key={risk.id}
                        onClick={() => navigate(`/risks/${risk.id}`)}
                        className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                            {risk.risk_ref}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <span className="text-xs text-muted-foreground truncate block">{risk.risk_description ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3.5"><DotBar value={risk.significance} /></td>
                        <td className="px-4 py-3.5"><DotBar value={risk.occurence} /></td>
                        <td className="px-4 py-3.5"><ScoreBadge score={risk.score} /></td>
                        <td className="px-4 py-3.5 w-px">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/risks/${risk.id}`) }}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              <ArrowRight className="size-3.5" /> View
                            </button>
                            {canManageLinks && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openUnlink(risk) }}
                                aria-label={`Remove risk ${risk.risk_ref} from this objective`}
                                title="Remove from objective"
                                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 focus-visible:text-red-600 transition-colors"
                              >
                                <Unlink className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Edit drawer */}
      <EditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        objective={objective}
        onSaved={setObj}
      />

      {/* Link existing risk */}
      <LinkRiskDrawer
        open={linkOpen}
        onOpenChange={setLinkOpen}
        objectiveId={objective.id}
        componentId={componentId}
        linkedIds={linkedIds}
        onLinked={handleLinked}
      />

      {/* Unlink confirmation */}
      <AlertDialog open={!!riskToUnlink} onOpenChange={(open) => !open && closeUnlink()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove risk from this objective?</AlertDialogTitle>
            <AlertDialogDescription>
              Risk <span className="font-mono font-semibold">{riskToUnlink?.risk_ref}</span> will be unlinked
              from this objective. The risk itself isn’t deleted and can be linked again later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {unlinkError && (
            <div role="alert" className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {unlinkError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} disabled={unlinking} className="bg-red-600 hover:bg-red-700">
              {unlinking && <Loader2 className="size-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}