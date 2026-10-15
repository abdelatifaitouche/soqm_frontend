import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search, X, ChevronRight, Check, Loader2,
  AlertCircle, Microscope, Pencil,
} from "lucide-react"

// ── Taxonomy & components ─────────────────────────────────────────────────────

const TAXONOMY = [
  {
    id: "cat-people", name: "People and competence",
    indicators: [
      { id: "ind-knowledge", name: "Insufficient technical knowledge", causes: [
        { id: "rc-01", name: "Training not tailored to the role" },
        { id: "rc-02", name: "Limited exposure to complex or specialised areas" },
        { id: "rc-03", name: "Knowledge not refreshed after a standard changed" },
      ]},
      { id: "ind-supervision", name: "Inadequate supervision and review", causes: [
        { id: "rc-04", name: "Reviewer workload too high" },
        { id: "rc-05", name: "Review started too late in the engagement" },
        { id: "rc-06", name: "Review expectations not clearly communicated" },
      ]},
      { id: "ind-capacity", name: "Staffing and capacity", causes: [
        { id: "rc-07", name: "Resource planning not aligned with engagement timing" },
        { id: "rc-08", name: "High turnover in key roles" },
      ]},
    ],
  },
  {
    id: "cat-method", name: "Methodology and tools",
    indicators: [
      { id: "ind-guidance", name: "Unclear methodology or guidance", causes: [
        { id: "rc-09", name: "Guidance ambiguous or open to interpretation" },
        { id: "rc-10", name: "Templates not updated for a revised standard" },
        { id: "rc-11", name: "Guidance difficult to find or too long to apply" },
      ]},
      { id: "ind-tools", name: "Tool limitations", causes: [
        { id: "rc-12", name: "Tool does not enforce the required step" },
        { id: "rc-13", name: "Manual workaround used outside the tool" },
      ]},
    ],
  },
  {
    id: "cat-governance", name: "Governance and leadership",
    indicators: [
      { id: "ind-accountability", name: "Tone and accountability", causes: [
        { id: "rc-14", name: "Quality not reflected in performance evaluation" },
        { id: "rc-15", name: "Leadership follow-up on prior findings was insufficient" },
        { id: "rc-16", name: "Commercial priorities outweighed quality considerations" },
      ]},
      { id: "ind-roles", name: "Roles and responsibilities", causes: [
        { id: "rc-17", name: "Ownership of the quality objective not clearly assigned" },
        { id: "rc-18", name: "Responsibility delegated without adequate oversight" },
      ]},
    ],
  },
  {
    id: "cat-execution", name: "Time and planning",
    indicators: [
      { id: "ind-time", name: "Time pressure", causes: [
        { id: "rc-19", name: "Budget or fee constraints" },
        { id: "rc-20", name: "Client information received late" },
        { id: "rc-21", name: "Compressed reporting deadline" },
      ]},
      { id: "ind-planning", name: "Inadequate planning", causes: [
        { id: "rc-22", name: "Risks not identified early enough" },
        { id: "rc-23", name: "Planning not updated when circumstances changed" },
      ]},
    ],
  },
  {
    id: "cat-monitoring", name: "Monitoring and remediation",
    indicators: [
      { id: "ind-remediation", name: "Prior remediation was ineffective", causes: [
        { id: "rc-24", name: "Action plan did not address the root cause" },
        { id: "rc-25", name: "Remediation was never verified" },
      ]},
      { id: "ind-detection", name: "Issue detected late", causes: [
        { id: "rc-26", name: "Monitoring scope did not cover the area" },
        { id: "rc-27", name: "Monitoring performed too infrequently" },
      ]},
    ],
  },
]

const COMPONENTS = [
  { id: "cmp-governance",  name: "Governance and leadership" },
  { id: "cmp-risk",        name: "The firm's risk assessment process" },
  { id: "cmp-ethics",      name: "Relevant ethical requirements" },
  { id: "cmp-acceptance",  name: "Acceptance and continuance" },
  { id: "cmp-engagement",  name: "Engagement performance" },
  { id: "cmp-resources",   name: "Resources" },
  { id: "cmp-information", name: "Information and communication" },
  { id: "cmp-monitoring",  name: "Monitoring and remediation" },
]

// ── Config ────────────────────────────────────────────────────────────────────

const RCA_STATUS = {
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  in_progress:  { label: "In progress", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  completed:    { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
}

const INPUT = "w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] focus:bg-card transition-colors disabled:opacity-60"

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildLeaves(taxonomy) {
  return taxonomy.flatMap((cat) =>
    cat.indicators.flatMap((ind) =>
      ind.causes.map((cause) => ({ cat, ind, cause }))
    )
  )
}

function fmtDate(val) {
  if (!val) return "—"
  const d = new Date(val)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
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

// ── Three-pane picker (inside modal — can be wide) ────────────────────────────

function ThreePanePicker({ taxonomy, value, onChange }) {
  const leaves   = useMemo(() => buildLeaves(taxonomy), [taxonomy])
  const [catId, setCatId] = useState(value.categoryId ?? taxonomy[0]?.id ?? null)
  const [indId, setIndId] = useState(value.indicatorId ?? null)
  const [query, setQuery] = useState("")

  const cat = taxonomy.find((c) => c.id === catId)
  const ind = cat?.indicators.find((i) => i.id === indId)
  const q   = query.trim()

  const results = q
    ? leaves.filter((l) =>
        [l.cause.name, l.ind.name, l.cat.name].some((t) =>
          t.toLowerCase().includes(q.toLowerCase())
        )
      )
    : []

  const choose = (leaf) => {
    onChange({ categoryId: leaf.cat.id, indicatorId: leaf.ind.id, causeId: leaf.cause.id })
    setCatId(leaf.cat.id)
    setIndId(leaf.ind.id)
    setQuery("")
  }

  const PANE_H = "h-72"
  const pane   = "overflow-y-auto divide-y divide-border flex-1"

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search causes, indicators, categories…"
          className={`${INPUT} pl-11 ${query ? "pr-10" : ""}`}
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {q ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          </div>
          <ul className="divide-y divide-border max-h-72 overflow-y-auto bg-card">
            {results.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">Nothing matches "{q}"</li>
            ) : results.map((l) => (
              <li key={l.cause.id}>
                <button type="button" onClick={() => choose(l)}
                  className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-muted/40 ${
                    l.cause.id === value.causeId ? "bg-[#EDE9F8] dark:bg-accent" : ""
                  }`}>
                  <p className="text-sm font-medium text-foreground">
                    <Highlight text={l.cause.name} query={q} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Highlight text={l.cat.name} query={q} /> › <Highlight text={l.ind.name} query={q} />
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Three-pane panel */
        <div className={`grid grid-cols-[220px_220px_1fr] gap-0 rounded-xl border border-border overflow-hidden divide-x divide-border bg-card ${PANE_H}`}>

          {/* Pane 1 — Category */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Category</p>
            </div>
            <ul className={pane}>
              {taxonomy.map((c) => (
                <li key={c.id}>
                  <button type="button"
                    onClick={() => { setCatId(c.id); setIndId(null) }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                      c.id === catId ? "bg-[#EDE9F8] dark:bg-accent" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className={`text-sm leading-snug ${
                      c.id === catId ? "font-semibold text-[#3B1F6A] dark:text-foreground" : "text-foreground"
                    }`}>{c.name}</span>
                    <ChevronRight className={`size-3.5 shrink-0 ${
                      c.id === catId ? "text-[#3B1F6A] dark:text-foreground" : "text-muted-foreground/30"
                    }`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Pane 2 — Indicator */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Indicator</p>
            </div>
            <ul className={pane}>
              {!cat ? (
                <li className="px-4 py-6 text-sm text-muted-foreground/50">Pick a category first</li>
              ) : cat.indicators.map((i) => (
                <li key={i.id}>
                  <button type="button"
                    onClick={() => setIndId(i.id)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                      i.id === indId ? "bg-[#EDE9F8] dark:bg-accent" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className={`text-sm leading-snug ${
                      i.id === indId ? "font-semibold text-[#3B1F6A] dark:text-foreground" : "text-foreground"
                    }`}>{i.name}</span>
                    <ChevronRight className={`size-3.5 shrink-0 ${
                      i.id === indId ? "text-[#3B1F6A] dark:text-foreground" : "text-muted-foreground/30"
                    }`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Pane 3 — Root cause */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Root cause</p>
            </div>
            <ul className={pane}>
              {!ind ? (
                <li className="px-4 py-6 text-sm text-muted-foreground/50">
                  {!cat ? "Pick a category" : "Pick an indicator"}
                </li>
              ) : ind.causes.map((rc) => {
                const isSel = rc.id === value.causeId
                return (
                  <li key={rc.id}>
                    <button type="button"
                      onClick={() => choose({ cat, ind, cause: rc })}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        isSel ? "bg-[#3B1F6A]" : "hover:bg-muted/40"
                      }`}
                    >
                      <span className={`text-sm leading-snug flex-1 ${isSel ? "text-white font-medium" : "text-foreground"}`}>
                        {rc.name}
                      </span>
                      {isSel && <Check className="size-4 text-white shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const esc     = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", esc)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
      {/* Dialog */}
      <div
        ref={ref}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {children}
      </div>
    </div>
  )
}

// ── RCA Form (inside modal) ───────────────────────────────────────────────────

function RCAModal({ open, onClose, initial, taxonomy, components, onSave }) {
  const [sel, setSel]               = useState({
    categoryId:  initial.category_id ?? null,
    indicatorId: initial.indicator_id ?? null,
    causeId:     initial.potential_root_cause_id ?? null,
  })
  const [componentId, setComponentId] = useState(initial.soqm_component_id ?? "")
  const [analysis, setAnalysis]       = useState(initial.analysis ?? "")
  const [saving, setSaving]           = useState(null)
  const [showErrors, setShowErrors]   = useState(false)
  const [apiError, setApiError]       = useState("")

  const leaves   = useMemo(() => buildLeaves(taxonomy), [taxonomy])
  const selected = leaves.find((l) => l.cause.id === sel.causeId)

  const errors = {
    cause:     !sel.causeId,
    component: !componentId,
    analysis:  !analysis.trim(),
  }

  const submit = async (complete) => {
    setApiError("")
    if (complete && Object.values(errors).some(Boolean)) { setShowErrors(true); return }
    setSaving(complete ? "complete" : "draft")
    try {
      await onSave({
        category_id:             sel.categoryId,
        indicator_id:            sel.indicatorId,
        potential_root_cause_id: sel.causeId,
        soqm_component_id:       componentId || null,
        analysis:                analysis.trim() || null,
        cause_analysis_status:   complete ? "completed" : "in_progress",
      })
      onClose()
    } catch (err) {
      setApiError(err?.response?.data?.detail ?? "Couldn't save. Please try again.")
    } finally {
      setSaving(null)
    }
  }

  const busy = saving !== null

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5 border-b border-border shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Root cause analysis</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identify why this finding occurred. Save a draft at any time.
          </p>
        </div>
        <button onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="size-4" />
        </button>
      </div>

      {/* Two-column body — left: picker + component, right: analysis */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-[1fr_340px] divide-x divide-border min-h-full">

          {/* Left — taxonomy picker + component */}
          <div className="px-7 py-6 space-y-6">

            {/* Selected cause banner */}
            {selected ? (
              <div className="flex items-start gap-3 rounded-xl border border-[#7B3FBE]/30 bg-[#EDE9F8]/60 dark:bg-accent/40 px-4 py-3.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#3B1F6A] text-white shrink-0 mt-0.5">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                    {selected.cat.name} · {selected.ind.name}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{selected.cause.name}</p>
                </div>
                <button type="button"
                  onClick={() => setSel({ categoryId: null, indicatorId: null, causeId: null })}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className={`rounded-xl border px-4 py-3 ${
                showErrors && errors.cause
                  ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                  : "border-dashed border-border"
              }`}>
                <p className={`text-sm ${showErrors && errors.cause ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                  {showErrors && errors.cause ? "Select a root cause to continue" : "Browse the taxonomy below or search"}
                </p>
              </div>
            )}

            {/* Picker */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Root cause taxonomy <span className="text-destructive normal-case font-normal">*</span>
              </p>
              <ThreePanePicker taxonomy={taxonomy} value={sel} onChange={setSel} />
            </div>

            {/* Component */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Affected component <span className="text-destructive normal-case font-normal">*</span>
              </p>
              <p className="text-xs text-muted-foreground mb-2.5">
                Which component of the system of quality management does this weakness sit in?
              </p>
              <select
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
                disabled={busy}
                className={`${INPUT} cursor-pointer ${showErrors && errors.component ? "border-red-400 dark:border-red-700" : ""}`}
              >
                <option value="">Select a component…</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {showErrors && errors.component && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">Select the affected component.</p>
              )}
            </div>
          </div>

          {/* Right — analysis */}
          <div className="px-7 py-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Analysis <span className="text-destructive normal-case font-normal">*</span>
              </p>
              <p className="text-xs text-muted-foreground">
                How did this cause lead to the finding? Include the evidence you relied on.
              </p>
            </div>
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              disabled={busy}
              placeholder="Describe the chain of events, the evidence you reviewed, and how you linked the cause to the finding…"
              className={`${INPUT} resize-none leading-relaxed flex-1 min-h-[200px] ${
                showErrors && errors.analysis ? "border-red-400 dark:border-red-700" : ""
              }`}
            />
            {showErrors && errors.analysis && (
              <p className="text-xs text-red-600 dark:text-red-400 -mt-2">
                Explain how this cause led to the finding.
              </p>
            )}

            {apiError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                {apiError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-border shrink-0">
        <button type="button" onClick={onClose} disabled={busy}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60">
          Cancel
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => submit(false)} disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-60">
            {saving === "draft" && <Loader2 className="size-4 animate-spin" />}
            Save draft
          </button>
          <button type="button" onClick={() => submit(true)} disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#3B1F6A] rounded-xl hover:bg-[#52298F] transition-colors disabled:opacity-60">
            {saving === "complete" && <Loader2 className="size-4 animate-spin" />}
            Complete analysis
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Read view ─────────────────────────────────────────────────────────────────

function RootCauseTrail({ cat, ind, cause }) {
  return (
    <div>
      {[
        { label: "Category",  value: cat.name,   strong: false },
        { label: "Indicator", value: ind.name,   strong: false },
        { label: "Root cause", value: cause.name, strong: true },
      ].map((row, i, arr) => (
        <div key={row.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0 pt-1.5">
            <div className={`rounded-full ${row.strong ? "size-3 bg-[#3B1F6A] dark:bg-[#7B3FBE]" : "size-2 bg-border mt-0.5"}`} />
            {i < arr.length - 1 && <div className="w-px bg-border mt-1 mb-0" style={{ height: 24 }} />}
          </div>
          <div className="pb-3 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{row.label}</p>
            <p className={`mt-0.5 ${row.strong ? "text-base font-semibold text-foreground" : "text-sm text-foreground/80"}`}>
              {row.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RootCauseSection({ rca, onSave, taxonomy = TAXONOMY, components = COMPONENTS }) {
  const [data, setData] = useState(rca ?? {})
  const [open, setOpen] = useState(false)

  useEffect(() => { if (rca) setData(rca) }, [rca])

  const leaves    = useMemo(() => buildLeaves(taxonomy), [taxonomy])
  const path      = leaves.find((l) => l.cause.id === data.potential_root_cause_id)
  const component = components.find((c) => c.id === data.soqm_component_id)

  const status  = data.cause_analysis_status ?? "not_started"
  const cfg     = RCA_STATUS[status] ?? RCA_STATUS.not_started
  const started = status !== "not_started" || !!path || !!data.analysis

  const handleSave = async (payload) => {
    if (onSave) return onSave(payload)
    await new Promise((r) => setTimeout(r, 500))
    setData((prev) => ({
      ...prev, ...payload,
      analysis_completed_at: payload.cause_analysis_status === "completed"
        ? new Date().toISOString() : null,
    }))
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Microscope className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Root cause analysis</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
              {cfg.label}
            </span>
            {started && (
              <button onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                <Pencil className="size-3" /> Edit
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
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
              <button onClick={() => setOpen(true)}
                className="mt-1 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors">
                Start analysis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8">
              <div className="space-y-6">
                {path
                  ? <RootCauseTrail {...path} />
                  : <p className="text-sm text-muted-foreground italic">No root cause selected yet.</p>}
                {data.analysis && (
                  <div className="pt-5 border-t border-border">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Analysis</p>
                    <p className="text-sm text-foreground/90 leading-7 whitespace-pre-line border-l-2 border-[#7B3FBE]/50 pl-4">
                      {data.analysis}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-5 lg:border-l lg:border-border lg:pl-6">
                {component && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Component</p>
                    <p className="text-sm text-foreground">{component.name}</p>
                  </div>
                )}
                {data.analysis_completed_at && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Completed</p>
                    <p className="text-sm text-foreground">{fmtDate(data.analysis_completed_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <RCAModal
        open={open}
        onClose={() => setOpen(false)}
        initial={data}
        taxonomy={taxonomy}
        components={components}
        onSave={handleSave}
      />
    </>
  )
}

export default RootCauseSection