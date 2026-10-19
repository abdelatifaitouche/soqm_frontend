import { useState, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft, Search, X, Upload, FileSpreadsheet, Loader2,
  AlertCircle, CheckCircle2, Microscope,
} from "lucide-react"
import { useRootCauseTaxonomy } from "@/features/findings/hooks/useRootCauseTaxomony"
import { useSeedRca } from "@/features/findings/hooks/useSeedRca"
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions"
import { normalizeTaxonomy } from "@/features/findings/pages/RootCauseAnalysis"

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_FILE_MB = 10

const plural = (n, word) => `${n} ${word}${n !== 1 ? "s" : ""}`
const categories = (n) => `${n} categor${n === 1 ? "y" : "ies"}`

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(". ")
  return "Couldn’t import the file. Check it and try again."
}

function countCauses(indicators) {
  return indicators.reduce((sum, i) => sum + i.causes.length, 0)
}

// Keeps categories / indicators / causes that match. A hit on a parent keeps its whole subtree.
function filterTaxonomy(taxonomy, query) {
  const q = query.toLowerCase()
  const has = (t) => t.toLowerCase().includes(q)

  return taxonomy
    .map((cat) => {
      const catHit = has(cat.name)
      const indicators = cat.indicators
        .map((ind) => {
          const indHit = catHit || has(ind.name)
          return { ...ind, causes: indHit ? ind.causes : ind.causes.filter((c) => has(c.name)) }
        })
        .filter((ind) => ind.causes.length > 0 || has(ind.name) || catHit)
      return { ...cat, indicators }
    })
    .filter((cat) => cat.indicators.length > 0)
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

// ── Upload card (shown only when there is no data yet) ────────────────────────

const EXPECTED_COLUMNS = ["root_cause_category", "root_cause_indicator", "potential_root_cause"]

function UploadCard({ onSubmit, seeding }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState("")

  const pick = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx files are supported.")
      return
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`The file is larger than ${MAX_FILE_MB} MB.`)
      return
    }
    setError("")
    setFile(f)
  }

  const submit = async () => {
    setError("")
    try {
      await onSubmit(file)
    } catch (err) {
      setError(extractError(err))
    }
  }

  return (
    <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted mb-4">
        <Microscope className="size-5 text-muted-foreground/60" />
      </div>
      <h2 className="text-base font-semibold text-foreground">No root cause taxonomy yet</h2>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        Import the quality team’s Excel file to create the categories, indicators and potential root causes.
        This can be done once, while the taxonomy is empty.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]) }}
        className={`mt-6 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
          dragging ? "border-[#7B3FBE] bg-[#EDE9F8]/50 dark:bg-accent/40" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }}
        />

        {file ? (
          <div className="flex items-center gap-3 text-left">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
              <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setError("") }}
              disabled={seeding}
              aria-label="Remove file"
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FBE]"
          >
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Drop an Excel file here, or click to browse</span>
            <span className="text-xs text-muted-foreground">.xlsx, up to {MAX_FILE_MB} MB</span>
          </button>
        )}
      </div>

      <div className="mt-4 text-left">
        <p className="text-xs text-muted-foreground mb-1.5">Expected columns</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPECTED_COLUMNS.map((c) => (
            <code key={c} className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-foreground/80">{c}</code>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 text-sm text-red-600 mt-4 text-left">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!file || seeding}
        className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#3B1F6A] rounded-xl hover:bg-[#52298F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {seeding && <Loader2 className="size-4 animate-spin" />}
        {seeding ? "Importing…" : "Import taxonomy"}
      </button>
    </div>
  )
}

// ── Taxonomy pieces ───────────────────────────────────────────────────────────

function ComponentChip({ cause, namesLoading }) {
  if (cause.component?.name) {
    return (
      <span className="shrink-0 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full max-w-[220px] truncate">
        {cause.component.name}
      </span>
    )
  }
  // No component at all is a data problem worth surfacing: such a cause can't be used in an analysis.
  if (!namesLoading && !cause.component_id) {
    return (
      <span className="shrink-0 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full">
        No component
      </span>
    )
  }
  return null
}

function IndicatorCard({ indicator, query, namesLoading }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-border bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground leading-snug">
          <Highlight text={indicator.name} query={query} />
        </h3>
        <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
          {plural(indicator.causes.length, "cause")}
        </span>
      </div>

      {indicator.causes.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground italic">No potential root causes.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {indicator.causes.map((cause) => (
            <li key={cause.id} className="flex items-center gap-3 px-5 py-3">
              <span className="size-1.5 rounded-full bg-[#7B3FBE]/60 shrink-0" />
              <span className="flex-1 min-w-0 text-sm text-foreground/90 leading-snug">
                <Highlight text={cause.name} query={query} />
              </span>
              <ComponentChip cause={cause} namesLoading={namesLoading} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6" aria-busy="true">
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-xl border border-border bg-card animate-pulse" />)}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function RcaTrackerPage() {
  const navigate = useNavigate()
  const { data: raw, loading, error, refetch } = useRootCauseTaxonomy()
  const { options: components, loading: componentsLoading } = useComponentsOptions()
  const { seed, loading: seeding } = useSeedRca()

  const taxonomy = useMemo(() => normalizeTaxonomy(raw, components ?? []), [raw, components])

  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState("")

  const totals = useMemo(() => {
    const indicators = taxonomy.reduce((n, c) => n + c.indicators.length, 0)
    const causes = taxonomy.reduce((n, c) => n + countCauses(c.indicators), 0)
    return { categories: taxonomy.length, indicators, causes }
  }, [taxonomy])

  const activeCat = taxonomy.find((c) => c.id === activeId) ?? taxonomy[0]
  const q = query.trim()
  const results = useMemo(() => (q ? filterTaxonomy(taxonomy, q) : []), [taxonomy, q])
  const resultCauseCount = results.reduce((n, c) => n + countCauses(c.indicators), 0)

  const isEmpty = !loading && !error && taxonomy.length === 0

  const handleSeed = async (file) => {
    await seed(file) // throws on failure; the upload card shows the error
    await refetch()
    setNotice("Taxonomy imported successfully.")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => navigate("/findings")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Findings
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Root cause taxonomy</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading…"
              : isEmpty
                ? "The reference list used for root cause analysis"
                : `${categories(totals.categories)} · ${plural(totals.indicators, "indicator")} · ${plural(totals.causes, "potential root cause")}`}
          </p>
        </div>

        {!loading && !error && !isEmpty && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories, indicators, causes…"
              aria-label="Search the taxonomy"
              className="w-full h-9 rounded-lg border border-input bg-card pl-9 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="hover:opacity-70">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <PageSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            <span className="text-sm">Couldn’t load the taxonomy.</span>
          </div>
          <button onClick={refetch} className="text-xs font-medium text-[#7B3FBE] hover:underline">Try again</button>
        </div>
      ) : isEmpty ? (
        <UploadCard onSubmit={handleSeed} seeding={seeding} />
      ) : q ? (
        /* Search results */
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? `Nothing matches “${q}”.`
              : `${plural(resultCauseCount, "potential root cause")} in ${categories(results.length)}`}
          </p>
          {results.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                <Highlight text={cat.name} query={q} />
              </h2>
              {cat.indicators.map((ind) => (
                <IndicatorCard key={ind.id} indicator={ind} query={q} namesLoading={componentsLoading} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Browse: category list + selected category's indicators */
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
          <nav aria-label="Categories" className="lg:sticky lg:top-4">
            <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {taxonomy.map((cat) => {
                const active = cat.id === activeCat?.id
                return (
                  <li key={cat.id} className="shrink-0 lg:shrink">
                    <button
                      onClick={() => setActiveId(cat.id)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full min-w-[200px] lg:min-w-0 text-left rounded-lg border px-4 py-3 transition-colors ${
                        active
                          ? "border-[#3B1F6A]/30 bg-[#EDE9F8] dark:bg-accent"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <span className={`block text-sm leading-snug ${active ? "font-semibold text-[#3B1F6A] dark:text-foreground" : "font-medium text-foreground"}`}>
                        {cat.name}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        {plural(cat.indicators.length, "indicator")} · {plural(countCauses(cat.indicators), "cause")}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {activeCat && (
            <div className="space-y-4 min-w-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">{activeCat.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {plural(activeCat.indicators.length, "indicator")} · {plural(countCauses(activeCat.indicators), "potential root cause")}
                </p>
              </div>
              {activeCat.indicators.map((ind) => (
                <IndicatorCard key={ind.id} indicator={ind} query="" namesLoading={componentsLoading} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RcaTrackerPage