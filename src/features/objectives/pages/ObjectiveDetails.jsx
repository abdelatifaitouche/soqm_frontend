import React, { useState, useMemo, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle, Loader2, ArrowRight, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, ArrowDownUp, X, Save, Calendar,
} from "lucide-react"
import { useObjective } from "@/features/objectives/hooks/useObjective"
import { useObjectiveRisks } from "@/features/objectives/hooks/useObjectiveRisks"
import { useRole } from "@/features/auth/hooks/useRole"
import { updateObjective } from "@/features/objectives/api/objectivesApi"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
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
  if (totalPages <= 1) return null

  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-border">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="size-3.5" />
      </button>
      {pages.map((p, i) => {
        const gap = pages[i - 1] !== undefined && p - pages[i - 1] > 1
        return (
          <React.Fragment key={p}>
            {gap && <span className="px-1.5 text-xs text-muted-foreground/50">…</span>}
            <button onClick={() => onChange(p)}
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
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ObjectiveDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()

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

  const sort = SORT_OPTIONS[sortIndex]

  const filters = useMemo(() => ({
    ...(statusFilter && { status: statusFilter }),
  }), [statusFilter])

  useEffect(() => { setPage(1) }, [statusFilter, sortIndex])

  const { risks, total, totalPages, loading: riskLoading, error: riskError } =
    useObjectiveRisks(id, filters, page, { order_by: sort.order_by, direction: sort.direction })

  const highestScore = risks?.length ? Math.max(...risks.map((r) => r.score)) : 0
  const avgScore     = risks?.length
    ? (risks.reduce((s, r) => s + r.score, 0) / risks.length).toFixed(1)
    : "—"

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
            { label: "Total risks",           value: total ?? 0,       color: "text-foreground" },
            { label: "Highest score",         value: risks?.length ? highestScore : "—",
              color: highestScore >= 6 ? "text-red-600 dark:text-red-400"
                   : highestScore >= 3 ? "text-amber-600 dark:text-amber-400"
                   :                    "text-emerald-600 dark:text-emerald-400",
              suffix: risks?.length ? " / 9" : "" },
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
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SELECT_CLS}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex items-center gap-1.5">
                <ArrowDownUp className="size-3.5 text-muted-foreground" />
                <select value={sortIndex} onChange={(e) => setSortIndex(Number(e.target.value))} className={SELECT_CLS}>
                  {SORT_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
              >
                <Plus className="size-3" /> Add risk
              </button>
            </div>
          </div>

          {riskLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading risks…</span>
            </div>
          ) : riskError ? (
            <div className="py-12 text-center text-destructive text-sm">Failed to load risks.</div>
          ) : !risks?.length ? (
            <div className="py-14 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {statusFilter ? "No risks match this filter." : "No risks linked to this objective yet."}
              </p>
              <button
                onClick={() => navigate(`/risks/create?objective_id=${objective.id}`)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline"
              >
                <Plus className="size-3.5" /> Add the first risk
              </button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Ref", "Description", "Significance", "Occurrence", "Score", ""].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {risks.map((risk) => (
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
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/risks/${risk.id}`) }}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                          >
                            <ArrowRight className="size-3.5" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </>
  )
}