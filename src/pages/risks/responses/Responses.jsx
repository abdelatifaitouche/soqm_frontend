import React, { useState } from "react";
import { useResponses } from "@/hooks/useResponses";
import {
  ShieldCheck,
  Eye,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  User,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle2,
  CircleDashed,
  XCircle,
  Archive,
  Rocket,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResponsesList from "./ResponsesList";

// ─── Config maps ──────────────────────────────────────────────────────────────

const RESPONSE_TYPE_CONFIG = {
  DETECTIVE: {
    label: "Detective",
    icon: Eye,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  PREVENTIVE: {
    label: "Preventive",
    icon: ShieldCheck,
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  CORRECTIVE: {
    label: "Corrective",
    icon: AlertTriangle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: CircleDashed,
    pill: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PLANNED: {
    label: "Planned",
    icon: Rocket,
    pill: "bg-sky-50 text-sky-700 border-sky-200",
  },
  IMPLEMENTED: {
    label: "Implemented",
    icon: ClipboardCheck,
    pill: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EFFECTIVE: {
    label: "Effective",
    icon: CheckCircle2,
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  RETIRED: {
    label: "Retired",
    icon: Archive,
    pill: "bg-rose-50 text-rose-600 border-rose-200",
  },
};

const TYPE_KEYS = ["DETECTIVE", "PREVENTIVE", "CORRECTIVE"];
const STATUS_KEYS = ["DRAFT", "PLANNED", "IMPLEMENTED", "EFFECTIVE", "RETIRED"];

function getType(type) {
  return (
    RESPONSE_TYPE_CONFIG[type] || {
      label: type || "—",
      icon: ShieldCheck,
      bg: "bg-slate-50",
      text: "text-slate-500",
      border: "border-slate-200",
      dot: "bg-slate-300",
    }
  );
}
function getStatus(status) {
  return (
    STATUS_CONFIG[status] || {
      label: "No status",
      icon: CircleDashed,
      pill: "bg-slate-50 text-slate-400 border-slate-100",
    }
  );
}

function shortId(id) {
  return id?.slice(0, 8)?.toUpperCase();
}
function fmtDate(val) {
  return val
    ? new Date(val).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({ active, onClick, activeClass, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
        active
          ? activeClass || "bg-[#3B1F6A] text-white border-[#3B1F6A]"
          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ─── ResponseCard ─────────────────────────────────────────────────────────────

function ResponseCard({ response, onClick }) {
  const navigate = useNavigate();
  const type = getType(response.response_type);
  const status = getStatus(response.status);
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  const dates = [
    { label: "Implementation", value: fmtDate(response.date_implementation) },
    { label: "Design check", value: fmtDate(response.date_monitored_design) },
    {
      label: "Operating check",
      value: fmtDate(response.date_monitored_operating),
    },
  ].filter((d) => d.value);

  return (
    <div
      onClick={() => navigate(`/responses/${response.id}`)}
      className="group relative bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-[#3B1F6A]/40 hover:shadow-md transition-all duration-200 flex flex-col gap-4 overflow-hidden"
    >
      {/* Left accent */}
      <div
        className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${type.dot}`}
      />

      {/* Badges + ID */}
      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${type.bg} ${type.text} ${type.border}`}
          >
            <TypeIcon className="size-3" />
            {type.label}
          </span>
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.pill}`}
          >
            <StatusIcon className="size-3" />
            {status.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 shrink-0">
          #{shortId(response.response_ref)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 pl-1">
        {response.response_description || (
          <span className="italic text-slate-400">
            No description provided.
          </span>
        )}
      </p>

      {/* Evidence notes */}
      {response.evidence_notes && (
        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <FileText className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {response.evidence_notes}
          </p>
        </div>
      )}

      {/* Dates */}
      {dates.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {dates.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-1 text-xs text-slate-500"
            >
              <Calendar className="size-3 text-slate-400" />
              <span className="text-slate-400">{d.label}:</span>
              <span className="font-medium text-slate-600">{d.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-amber-500/80">
          <Clock className="size-3" />
          <span>No dates set</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <User className="size-3" />
          <span className="font-mono">
            Owner: {response.owner.first_name} {response.owner.last_name}
          </span>
        </div>
        <ChevronRight className="size-4 text-slate-300 group-hover:text-[#3B1F6A] group-hover:translate-x-0.5 transition-all duration-150" />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
        <div className="h-6 w-24 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full bg-slate-100 rounded" />
        <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="h-10 bg-slate-50 rounded-lg" />
      <div className="h-3 w-28 bg-slate-100 rounded" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ isFiltered }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3B1F6A]/8 mb-4">
        <ShieldCheck className="size-7 text-[#3B1F6A]/40" />
      </div>
      <p className="text-sm font-semibold text-slate-700 mb-1">
        {isFiltered ? "No responses match your filters" : "No responses yet"}
      </p>
      <p className="text-xs text-slate-400 max-w-xs">
        {isFiltered
          ? "Try clearing the filters to see all responses."
          : "Responses linked to this risk will appear here once created."}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function Responses() {
  // Filter state — passed directly to the hook → backend query params

  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState(null); // ResponseState | null
  const [typeFilter, setTypeFilter] = useState(null); // ResponseType  | null

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    // risk_id would typically come from route params: useParams()
    // ...(riskId && { risk_id: riskId }),
  };

  const { responses, loading, error } = useResponses(filters);

  const isFiltered = !!(statusFilter || typeFilter);

  // Client-side type filter only (type isn't in ResponseFilters on backend)
  const visible = typeFilter
    ? responses.filter((r) => r.response_type === typeFilter)
    : responses;

  return (
    <div className="min-h-screen bg-slate-50/60 ">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex size-6 items-center justify-center rounded-md bg-[#3B1F6A]">
                <ShieldCheck className="size-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Risk Management
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Responses
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Control measures and actions linked to this risk
            </p>
          </div>
          <button
            onClick={() => navigate("/responses/create")}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B1F6A] text-white text-sm font-medium rounded-lg hover:bg-[#2e1854] transition-colors shadow-sm shrink-0"
          >
            <Plus className="size-4" />
            Add Response
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status — hits backend */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mr-0.5 shrink-0">
                Status
              </span>
              <FilterPill
                active={!statusFilter}
                onClick={() => setStatusFilter(null)}
              >
                All
              </FilterPill>
              {STATUS_KEYS.map((s) => {
                const cfg = getStatus(s);
                return (
                  <FilterPill
                    key={s}
                    active={statusFilter === s}
                    onClick={() =>
                      setStatusFilter(statusFilter === s ? null : s)
                    }
                    activeClass={`${cfg.pill} font-semibold`}
                  >
                    {cfg.label}
                  </FilterPill>
                );
              })}
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* Type — client-side only (not in ResponseFilters) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mr-0.5 shrink-0">
                Type
              </span>
              <FilterPill
                active={!typeFilter}
                onClick={() => setTypeFilter(null)}
              >
                All
              </FilterPill>
              {TYPE_KEYS.map((t) => {
                const cfg = getType(t);
                return (
                  <FilterPill
                    key={t}
                    active={typeFilter === t}
                    onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                    activeClass={`${cfg.bg} ${cfg.text} ${cfg.border} font-semibold`}
                  >
                    {cfg.label}
                  </FilterPill>
                );
              })}
            </div>

            {/* Clear */}
            {isFiltered && (
              <button
                onClick={() => {
                  setStatusFilter(null);
                  setTypeFilter(null);
                }}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <XCircle className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-600">
            <XCircle className="size-4 shrink-0" />
            Failed to load responses. Please refresh and try again.
          </div>
        )}

        {/* Grid */}

        <ResponsesList responses={visible} />

        {/* Count */}
        {!loading && visible.length > 0 && (
          <p className="text-center text-xs text-slate-400 pb-2">
            Showing {visible.length} response{visible.length !== 1 ? "s" : ""}
            {typeFilter ? ` · filtered by type` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export default Responses;
