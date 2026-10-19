import { useState, useMemo, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Search, X, ChevronRight, Check, Loader2,
  AlertCircle, Microscope, Pencil,
} from "lucide-react"
import { useRootCauseTaxonomy } from "@/features/findings/hooks/useRootCauseTaxomony"
import { useStartRootCauseAnalysis } from "@/features/findings/hooks/useStartRootCauseAnalysis"
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions"

// ── Config ────────────────────────────────────────────────────────────────────

const RCA_STATUS = {
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  in_progress: { label: "In progress", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  completed:   { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
}

const INPUT = "w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] focus:bg-card transition-colors disabled:opacity-60"

const LABEL = "text-xs font-semibold uppercase tracking-widest text-muted-foreground"

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildLeaves(taxonomy) {
  return taxonomy.flatMap((cat) =>
    cat.indicators.flatMap((ind) => ind.causes.map((cause) => ({ cat, ind, cause })))
  )
}

// Converts the API taxonomy payload into the shape this UI uses.
//   raw:        the array returned by the taxonomy endpoint
//   components: [{ id, name }], used to resolve each cause's component_id to a name
// Tolerates both `[{ RootCauseCategory: {...} }]` (row-wrapped) and `[{...}]`.
export function normalizeTaxonomy(raw, components = []) {
  const byId = new Map(components.map((c) => [c.id, c]))
  return (raw ?? []).map((row) => {
    const cat = row.RootCauseCategory ?? row
    return {
      id: cat.id,
      name: cat.category,
      indicators: (cat.root_cause_indicators ?? []).map((ind) => ({
        id: ind.id,
        name: ind.indicator,
        causes: (ind.potential_root_causes ?? []).map((rc) => ({
          id: rc.id,
          name: rc.potential_root_cause,
          component_id: rc.component_id ?? rc.component?.id ?? null,
          component: rc.component ?? byId.get(rc.component_id) ?? null,
        })),
      })),
    }
  })
}

// Works with both API shapes: a nested `potential_root_cause` object (recommended),
// or just `potential_root_cause_id` looked up in the taxonomy.
function resolvePath(data, leaves) {
  const nested = data?.potential_root_cause
  if (nested?.id && nested.indicator && nested.category) {
    return { cat: nested.category, ind: nested.indicator, cause: nested, component: nested.component ?? null }
  }
  const id = nested?.id ?? data?.potential_root_cause_id
  const leaf = leaves.find((l) => l.cause.id === id)
  return leaf ? { ...leaf, component: leaf.cause.component ?? null } : null
}

function fmtDate(val) {
  if (!val) return "—"
  const d = new Date(val)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(". ")
  return "Couldn’t save. Please try again."
}

function Highlight({ text, query }) {
  if (!query) return text
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-[#EDE9F8] dark:bg-violet-500/25 text-inherit rounded-sm px-0.5">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────
// Portalled to <body>, locks page scroll, traps focus, restores focus on close.
// Backdrop closes only when the press *starts* on the backdrop, so dragging a
// text selection out of the dialog doesn't dismiss it.

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function Modal({ onClose, labelledBy, children }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose // always call the latest handler without re-running the effect

  useEffect(() => {
    const el = ref.current
    const previouslyFocused = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    el?.focus()

    const onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== "Tab" || !el) return
      const items = [...el.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === el)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeRef.current() }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="relative w-full max-w-6xl max-h-[92vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden outline-none"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

// ── Picker ────────────────────────────────────────────────────────────────────

function PaneItem({ label, sub, count, active, selected, onClick }) {
  const ref = useRef(null)
  // Bring an already-chosen item into view when its pane first renders (e.g. when editing).
  useEffect(() => {
    if (active || selected) ref.current?.scrollIntoView?.({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <li>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-pressed={active || selected}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          selected ? "bg-[#3B1F6A]" : active ? "bg-[#EDE9F8] dark:bg-accent" : "hover:bg-muted/40"
        }`}
      >
        <span className="flex-1 min-w-0">
          <span
            className={`block text-sm leading-snug ${
              selected
                ? "text-white font-medium"
                : active
                  ? "font-semibold text-[#3B1F6A] dark:text-foreground"
                  : "text-foreground"
            }`}
          >
            {label}
          </span>
          {sub && (
            <span className={`block text-[11px] mt-0.5 ${selected ? "text-white/70" : "text-muted-foreground"}`}>
              {sub}
            </span>
          )}
        </span>
        {count != null && !selected && (
          <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">{count}</span>
        )}
        {selected ? (
          <Check className="size-4 text-white shrink-0" />
        ) : count != null ? (
          <ChevronRight
            className={`size-3.5 shrink-0 ${active ? "text-[#3B1F6A] dark:text-foreground" : "text-muted-foreground/30"}`}
          />
        ) : null}
      </button>
    </li>
  )
}

function Pane({ title, count, children, empty }) {
  return (
    <div className="flex flex-col min-h-0 min-w-0">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
        {count != null && <span className="text-[11px] tabular-nums text-muted-foreground">{count}</span>}
      </div>
      <ul className="overflow-y-auto flex-1 divide-y divide-border max-h-44 md:max-h-none">
        {empty ? <li className="px-4 py-6 text-sm text-muted-foreground/60">{empty}</li> : children}
      </ul>
    </div>
  )
}

function ThreePanePicker({ taxonomy, value, onChange }) {
  const leaves = useMemo(() => buildLeaves(taxonomy), [taxonomy])
  const [catId, setCatId] = useState(value.categoryId ?? null)
  const [indId, setIndId] = useState(value.indicatorId ?? null)
  const [query, setQuery] = useState("")

  const cat = taxonomy.find((c) => c.id === catId)
  const ind = cat?.indicators.find((i) => i.id === indId)
  const q = query.trim()

  const results = q
    ? leaves.filter((l) =>
        [l.cause.name, l.ind.name, l.cat.name].some((t) => t.toLowerCase().includes(q.toLowerCase()))
      )
    : []

  const choose = (leaf) => {
    onChange({ categoryId: leaf.cat.id, indicatorId: leaf.ind.id, causeId: leaf.cause.id })
    setCatId(leaf.cat.id)
    setIndId(leaf.ind.id)
    setQuery("")
  }

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter" && results[0]) {
      e.preventDefault()
      choose(results[0])
    } else if (e.key === "Escape" && query) {
      e.preventDefault() // clear the search first; a second Escape closes the dialog
      setQuery("")
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search causes, indicators, categories…"
          aria-label="Search the root cause taxonomy"
          className={`${INPUT} pl-11 ${query ? "pr-10" : ""}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {q ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
            {results.length > 0 && <span className="text-[11px] text-muted-foreground">Press Enter to pick the first</span>}
          </div>
          <ul className="divide-y divide-border h-64 md:h-[272px] overflow-y-auto bg-card">
            {results.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">Nothing matches “{q}”</li>
            ) : (
              results.map((l) => (
                <li key={l.cause.id}>
                  <button
                    type="button"
                    onClick={() => choose(l)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/40 ${
                      l.cause.id === value.causeId ? "bg-[#EDE9F8] dark:bg-accent" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">
                      <Highlight text={l.cause.name} query={q} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Highlight text={l.cat.name} query={q} /> › <Highlight text={l.ind.name} query={q} />
                      {l.cause.component && <> · {l.cause.component.name}</>}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.3fr)] divide-y md:divide-y-0 md:divide-x divide-border rounded-xl border border-border overflow-hidden bg-card md:h-[320px]">
          <Pane title="Category" count={taxonomy.length}>
            {taxonomy.map((c) => (
              <PaneItem
                key={c.id}
                label={c.name}
                count={c.indicators.length}
                active={c.id === catId}
                onClick={() => {
                  if (c.id !== catId) setIndId(null)
                  setCatId(c.id)
                }}
              />
            ))}
          </Pane>

          <Pane title="Indicator" count={cat?.indicators.length} empty={!cat && "Pick a category first"}>
            {cat?.indicators.map((i) => (
              <PaneItem
                key={i.id}
                label={i.name}
                count={i.causes.length}
                active={i.id === indId}
                onClick={() => setIndId(i.id)}
              />
            ))}
          </Pane>

          <Pane
            title="Root cause"
            count={ind?.causes.length}
            empty={!ind && (!cat ? "Pick a category" : "Pick an indicator")}
          >
            {ind?.causes.map((rc) => (
              <PaneItem
                key={rc.id}
                label={rc.name}
                sub={rc.component?.name}
                selected={rc.id === value.causeId}
                onClick={() => choose({ cat, ind, cause: rc })}
              />
            ))}
          </Pane>
        </div>
      )}
    </div>
  )
}

// ── Form (rendered only while the dialog is open, so it always starts fresh) ──

function Requirement({ done, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${done ? "text-foreground" : "text-muted-foreground"}`}>
      {done ? (
        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      ) : (
        <span className="size-4 rounded-full border border-border" />
      )}
      {label}
    </span>
  )
}

function RCAForm({ onClose, initial, taxonomy, onSave }) {
  const leaves = useMemo(() => buildLeaves(taxonomy), [taxonomy])

  const initialCauseId = initial.potential_root_cause?.id ?? initial.potential_root_cause_id ?? null
  const initialLeaf = leaves.find((l) => l.cause.id === initialCauseId)
  const initialSel = {
    categoryId: initialLeaf?.cat.id ?? null,
    indicatorId: initialLeaf?.ind.id ?? null,
    causeId: initialCauseId,
  }

  const [sel, setSel] = useState(initialSel)
  const [analysis, setAnalysis] = useState(initial.analysis ?? "")
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [apiError, setApiError] = useState("")
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const selected = leaves.find((l) => l.cause.id === sel.causeId)
  const derivedComponent = selected?.cause.component

  const isEdit = !!initialCauseId || !!initial.analysis
  const ok = { cause: !!sel.causeId, analysis: !!analysis.trim() }
  const canSave = ok.cause && ok.analysis
  const dirty = sel.causeId !== initialCauseId || analysis !== (initial.analysis ?? "")

  const requestClose = () => {
    if (saving) return
    if (confirmDiscard) { setConfirmDiscard(false); return } // Escape backs out of the prompt
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const submit = async () => {
    setApiError("")
    if (!canSave) { setShowErrors(true); return }

    // The API takes every id explicitly; they are all derived from the chosen cause.
    const componentId = selected.cause.component_id ?? selected.cause.component?.id ?? null
    if (!componentId) {
      setApiError("This root cause has no component assigned, so the analysis can’t be saved. Contact an administrator.")
      return
    }

    setSaving(true)
    try {
      await onSave({
        category_id: selected.cat.id,
        indicator_id: selected.ind.id,
        potential_root_cause_id: selected.cause.id,
        component_id: componentId,
        analysis: analysis.trim(),
      })
      onClose()
    } catch (err) {
      setApiError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  const causeError = showErrors && !ok.cause

  return (
    <Modal onClose={requestClose} labelledBy="rca-title">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-5 border-b border-border shrink-0">
        <div>
          <h2 id="rca-title" className="text-lg font-semibold text-foreground">Root cause analysis</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Identify why this finding occurred.</p>
        </div>
        <button
          onClick={requestClose}
          aria-label="Close"
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x divide-border min-h-full">
          {/* Left: taxonomy */}
          <div className="px-6 sm:px-8 py-6 space-y-4 min-w-0">
            <p className={LABEL}>
              Root cause <span className="text-destructive normal-case font-normal">*</span>
            </p>

            {selected ? (
              <div className="flex items-start gap-3 rounded-xl border border-[#7B3FBE]/30 bg-[#EDE9F8]/60 dark:bg-accent/40 px-4 py-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#3B1F6A] text-white shrink-0 mt-0.5">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {selected.cat.name} › {selected.ind.name}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{selected.cause.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSel({ categoryId: null, indicatorId: null, causeId: null })}
                  aria-label="Clear selected root cause"
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div
                className={`rounded-xl border px-4 py-3 ${
                  causeError ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" : "border-dashed border-border"
                }`}
              >
                <p className={`text-sm ${causeError ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                  {causeError ? "Select a root cause to continue" : "Browse the taxonomy below, or search"}
                </p>
              </div>
            )}

            <ThreePanePicker taxonomy={taxonomy} value={sel} onChange={setSel} />
          </div>

          {/* Right: derived component + analysis */}
          <div className="px-6 sm:px-8 py-6 flex flex-col gap-6 min-w-0 border-t lg:border-t-0 border-border">
            <div>
              <p className={`${LABEL} mb-1.5`}>Affected component</p>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 min-h-[46px] flex items-center">
                {derivedComponent?.name ? (
                  <span className="text-sm font-medium text-foreground">{derivedComponent.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground/70">
                    {selected ? "Assigned automatically" : "Set automatically from the root cause you select"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <p className={`${LABEL} mb-1.5`}>
                Analysis <span className="text-destructive normal-case font-normal">*</span>
              </p>
              <p className="text-xs text-muted-foreground mb-2.5">
                How did this cause lead to the finding? Include the evidence you relied on.
              </p>
              <textarea
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                disabled={saving}
                placeholder="Describe the chain of events and the evidence you reviewed…"
                className={`${INPUT} resize-none leading-relaxed flex-1 min-h-[220px] ${
                  showErrors && !ok.analysis ? "border-red-400 dark:border-red-700" : ""
                }`}
              />
              {showErrors && !ok.analysis && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                  Explain how this cause led to the finding.
                </p>
              )}
            </div>

            {apiError && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                {apiError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-x-6 gap-y-3 flex-wrap px-6 sm:px-8 py-4 border-t border-border shrink-0">
        {confirmDiscard ? (
          <>
            <p className="text-sm text-foreground">Discard your unsaved changes?</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-4" aria-label="Required to save">
              <Requirement done={ok.cause} label="Root cause" />
              <Requirement done={ok.analysis} label="Analysis" />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={requestClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#3B1F6A] rounded-xl hover:bg-[#52298F] transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Save analysis"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function RCAModal({ open, ...rest }) {
  if (!open) return null
  return <RCAForm {...rest} />
}

// ── Read view ─────────────────────────────────────────────────────────────────

function RootCauseTrail({ cat, ind, cause }) {
  const rows = [
    { label: "Category", value: cat.name },
    { label: "Indicator", value: ind.name },
    { label: "Root cause", value: cause.name, strong: true },
  ]
  return (
    <ol className="relative ml-1 border-l border-border pl-5 space-y-4">
      {rows.map((r) => (
        <li key={r.label} className="relative">
          <span
            className={`absolute rounded-full ${
              r.strong
                ? "size-3 -left-[27px] top-1 bg-[#3B1F6A] dark:bg-[#7B3FBE]"
                : "size-2 -left-[25px] top-1.5 bg-border"
            }`}
          />
          <p className="text-xs text-muted-foreground">{r.label}</p>
          <p className={`mt-0.5 ${r.strong ? "text-base font-semibold text-foreground" : "text-sm text-foreground/80"}`}>
            {r.value}
          </p>
        </li>
      ))}
    </ol>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Props
 *  - rca:       finding.root_cause_analysis
 *  - findingId: id of the finding the analysis belongs to
 *  - onSaved:   optional (result) => void, called after a successful save (e.g. to refetch the finding)
 */
export function RootCauseSection({ rca, findingId, onSaved }) {
  const { data: rawTaxonomy, loading: taxonomyLoading, error: taxonomyError } = useRootCauseTaxonomy()
  // The taxonomy payload only carries `component_id`; names come from the components list.
  // Remove this once the API nests `component: { id, name }` on each cause.
  const { options: components } = useComponentsOptions()
  const { start } = useStartRootCauseAnalysis(findingId)

  const taxonomy = useMemo(() => normalizeTaxonomy(rawTaxonomy, components ?? []), [rawTaxonomy, components])
  const blocked = taxonomyLoading || !!taxonomyError

  const [data, setData] = useState(rca ?? {})
  const [open, setOpen] = useState(false)

  useEffect(() => { if (rca) setData(rca) }, [rca])

  const leaves = useMemo(() => buildLeaves(taxonomy), [taxonomy])
  const path = resolvePath(data, leaves)
  const component = path?.component

  const status = data.cause_analysis_status ?? "not_started"
  const cfg = RCA_STATUS[status] ?? RCA_STATUS.not_started
  const started = status !== "not_started" || !!data.potential_root_cause_id || !!data.analysis

  const handleSave = async (payload) => {
    const result = await start(payload)

    // Prefer what the API returns; otherwise fall back to what we just sent.
    const fromApi = result?.root_cause_analysis ?? (result?.cause_analysis_status ? result : null)
    setData((prev) =>
      fromApi
        ? { ...prev, ...fromApi }
        : {
            ...prev,
            potential_root_cause_id: payload.potential_root_cause_id,
            analysis: payload.analysis,
            cause_analysis_status: prev.cause_analysis_status === "completed" ? "completed" : "in_progress",
          }
    )
    onSaved?.(result)
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-sm font-semibold text-foreground">Root cause analysis</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${cfg.cls}`}>
              {cfg.label}
            </span>
            {started && (
              <button
                onClick={() => setOpen(true)}
                disabled={blocked}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                <Pencil className="size-3" /> Edit
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-5">
          {taxonomyError && (
            <div role="alert" className="flex items-center gap-2 text-xs text-red-600 mb-4">
              <AlertCircle className="size-3.5 shrink-0" />
              Couldn’t load the root cause taxonomy. Refresh to try again.
            </div>
          )}

          {!started ? (
            <div className="flex flex-col items-center text-center gap-3 py-8">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Microscope className="size-5 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Analysis not started</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Understanding why this happened makes remediation effective and prevents recurrence.
                </p>
              </div>
              <button
                onClick={() => setOpen(true)}
                disabled={blocked}
                className="mt-1 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors disabled:opacity-50"
              >
                {taxonomyLoading ? "Loading…" : "Start analysis"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8">
              <div className="space-y-6 min-w-0">
                {path ? (
                  <RootCauseTrail {...path} />
                ) : taxonomyLoading ? (
                  <div className="space-y-3" aria-busy="true">
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-56 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-64 rounded bg-muted animate-pulse" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No root cause selected yet.</p>
                )}

                {data.analysis && (
                  <div className="pt-5 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-2">Analysis</p>
                    <p className="text-[15px] text-foreground/90 leading-7 max-w-[68ch] whitespace-pre-line border-l-2 border-[#7B3FBE]/60 pl-4">
                      {data.analysis}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5 lg:border-l lg:border-border lg:pl-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Component</p>
                  <p className="text-sm text-foreground">
                    {component?.name ?? <span className="text-muted-foreground italic">{path ? "Not available" : "Not selected"}</span>}
                  </p>
                </div>
                {data.analysis_completed_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                    <p className="text-sm text-foreground">{fmtDate(data.analysis_completed_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <RCAModal
        open={open && !blocked}
        onClose={() => setOpen(false)}
        initial={data}
        taxonomy={taxonomy}
        onSave={handleSave}
      />
    </>
  )
}

export default RootCauseSection