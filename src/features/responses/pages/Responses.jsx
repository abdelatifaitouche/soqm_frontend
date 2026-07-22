import React, { useState, useMemo, useEffect } from "react";
import { useResponses } from "@/features/responses/hooks/useResponses";
import { useComponentsOptions } from "@/features/isqm_components/hooks/useComponentsOptions";
import { ShieldCheck, Plus, XCircle, AlertCircle, ChevronLeft, ChevronRight, ArrowDownUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResponsesList from "./ResponsesList";
import Pagination from "@/shared/components/Pagination";
// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "",           label: "All types" },
  { value: "DETECTIVE",  label: "Detective" },
  { value: "PREVENTIVE", label: "Preventive" },
  { value: "CORRECTIVE", label: "Corrective" },
];

const STATUS_OPTIONS = [
  { value: "",            label: "All statuses" },
  { value: "DRAFT",       label: "Draft" },
  { value: "PLANNED",     label: "Planned" },
  { value: "IMPLEMENTED", label: "Implemented" },
  { value: "EFFECTIVE",   label: "Effective" },
  { value: "RETIRED",     label: "Retired" },
];

// Matches backend ExecutionType enum
const EXECUTION_OPTIONS = [
  { value: "",          label: "All executions" },
  { value: "MANUAL",    label: "Manual" },
  { value: "AUTOMATED", label: "Automated" },
  { value: "HYBRID",    label: "Hybrid" },
];

// Matches backend Frequency enum
const FREQUENCY_OPTIONS = [
  { value: "",             label: "All frequencies" },
  { value: "continuous",   label: "Continuous" },
  { value: "daily",        label: "Daily" },
  { value: "weekly",       label: "Weekly" },
  { value: "biweekly",     label: "Biweekly" },
  { value: "monthly",      label: "Monthly" },
  { value: "bimonthly",    label: "Bimonthly" },
  { value: "quarterly",    label: "Quarterly" },
  { value: "semiannually", label: "Semiannually" },
  { value: "annually",     label: "Annually" },
  { value: "ad_hoc",       label: "Ad hoc" },
  { value: "event_driven", label: "Event driven" },
];

// Backend only supports order_by=created_at, so we don't expose "sort by field" —
// just the direction, phrased in terms a user cares about (not the column name).
const SORT_OPTIONS = [
  { value: "desc", label: "Latest first" },
  { value: "asc",  label: "Earliest first" },
];

// ─── Shared select style ──────────────────────────────────────────────────────

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, dot }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
}




// ─── Main ─────────────────────────────────────────────────────────────────────

function Responses() {
  const navigate = useNavigate();

  const [statusFilter,    setStatusFilter]    = useState("");
  const [typeFilter,      setTypeFilter]      = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("");
  const [executionFilter, setExecutionFilter] = useState("");
  // Store component_id as a string to avoid number/string mismatch with the backend
  const [componentFilter, setComponentFilter] = useState("");
  const [sortDirection,   setSortDirection]   = useState("desc"); // latest first by default
  const [page, setPage] = useState(1);

  const { options: components, loading: componentsLoading } = useComponentsOptions();

  // useMemo keeps the object reference stable between renders.
  // Without this, hooks that do `JSON.stringify(filters)` in their dep array
  // would still work, but hooks comparing by reference would re-fire every render.
  const backendFilters = useMemo(() => ({
    ...(statusFilter    && { status:         statusFilter }),
    ...(componentFilter && { component_id:   componentFilter }),
    ...(frequencyFilter && { frequency:      frequencyFilter }),
    ...(executionFilter && { execution_type: executionFilter }),
    // order_by only ever supports "created_at" on the backend, so it's not a
    // user-facing choice — always sent alongside whichever direction is picked.
    order_by:  "created_at",
    direction: sortDirection,
  }), [statusFilter, componentFilter, frequencyFilter, executionFilter, sortDirection]);

  // Any filter/sort change invalidates the current page — e.g. page 3 of "all"
  // may not exist once you're down to a filtered set of 4 items.
  useEffect(() => {
    setPage(1);
  }, [backendFilters]);

  const {
    responses, loading, error,
    total, totalPages
  } = useResponses(backendFilters, page);

  // type is client-side only (not in backend ResponseFilters) — applied on top
  // of the already-paginated page of results returned by the backend.
  const visible = typeFilter
    ? responses?.filter((r) => r.response_type === typeFilter)
    : responses;

  const isFiltered = !!(
    statusFilter || typeFilter || componentFilter || frequencyFilter || executionFilter
  );

  const clearAll = () => {
    setStatusFilter("");
    setTypeFilter("");
    setComponentFilter("");
    setFrequencyFilter("");
    setExecutionFilter("");
  };

  // Counts reflect only the current page (backend doesn't return status
  // breakdowns for the full filtered set), so label them accordingly.
  const counts = {
    effective:   responses?.filter((r) => r.status === "EFFECTIVE").length   ?? 0,
    implemented: responses?.filter((r) => r.status === "IMPLEMENTED").length ?? 0,
    draft:       responses?.filter((r) => r.status === "DRAFT").length       ?? 0,
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Responses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading…"
              : `${total} control measure${total !== 1 ? "s" : ""} registered`}
          </p>
        </div>
        <button
          onClick={() => navigate("/responses/create")}
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors shrink-0"
        >
          <Plus className="size-3.5" /> Add response
        </button>
      </div>

      {/* Stats strip — reflects current page only */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Effective (page)"   value={counts.effective}   dot="bg-emerald-400" />
        <StatCard label="Implemented (page)" value={counts.implemented} dot="bg-blue-400" />
        <StatCard label="Draft (page)"       value={counts.draft}       dot="bg-slate-300" />
      </div>

      {/* Filter + sort bar */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={SELECT_CLS}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Type — client-side */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={SELECT_CLS}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Frequency — backend filter */}
        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          className={SELECT_CLS}
        >
          {FREQUENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Execution type — backend filter */}
        <select
          value={executionFilter}
          onChange={(e) => setExecutionFilter(e.target.value)}
          className={SELECT_CLS}
        >
          {EXECUTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Component — backend filter via component_id */}
        <select
          value={componentFilter}
          onChange={(e) => setComponentFilter(e.target.value)}
          disabled={componentsLoading}
          className={SELECT_CLS}
        >
          <option value="">All components</option>
          {components?.map((c) => (
            // coerce id to string so value comparison is always string === string
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>

        {/* Clear */}
        {isFiltered && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="size-3.5" /> Clear filters
          </button>
        )}

        {/* Sort — pushed to the far right, visually separated from the filters */}
        <div className="ml-auto flex items-center gap-1.5">
          <ArrowDownUp className="size-3.5 text-muted-foreground" />
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            className={SELECT_CLS}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load responses. Please refresh and try again.
        </div>
      )}

      {/* Table — key forces a clean remount when filters/sort/page change so stale rows don't linger */}
      <ResponsesList
        key={`${statusFilter}|${typeFilter}|${componentFilter}|${frequencyFilter}|${executionFilter}|${sortDirection}|${page}`}
        responses={visible}
      />

      {/* Pagination */}
      {!loading && !error && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      )}

      {/* Footer count */}
      {!loading && (visible?.length ?? 0) > 0 && (
        <p className="text-center text-xs text-muted-foreground pb-2">
          Showing {visible.length} of {total} response{total !== 1 ? "s" : ""} · page {page} of {totalPages}
          {isFiltered ? " · filtered" : ""}
        </p>
      )}
    </div>
  );
}

export default Responses;