import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, Eye, AlertTriangle, CircleDashed, Rocket, ClipboardCheck, CheckCircle2, Archive } from "lucide-react";

const RESPONSE_TYPE_CONFIG = {
  DETECTIVE: {
    label: "Detective",
    icon: Eye,
    chip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  PREVENTIVE: {
    label: "Preventive",
    icon: ShieldCheck,
    chip: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900",
  },
  CORRECTIVE: {
    label: "Corrective",
    icon: AlertTriangle,
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
};

const STATUS_CONFIG = {
  DRAFT:       { label: "Draft",       icon: CircleDashed,   pill: "bg-slate-100 text-slate-500 border-slate-200" },
  PLANNED:     { label: "Planned",     icon: Rocket,         pill: "bg-sky-50 text-sky-700 border-sky-200" },
  IMPLEMENTED: { label: "Implemented", icon: ClipboardCheck, pill: "bg-blue-50 text-blue-700 border-blue-200" },
  EFFECTIVE:   { label: "Effective",   icon: CheckCircle2,   pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RETIRED:     { label: "Retired",     icon: Archive,        pill: "bg-rose-50 text-rose-600 border-rose-200" },
};

function TypeChip({ type }) {
  const cfg = RESPONSE_TYPE_CONFIG[type] || { label: type || "—", icon: ShieldCheck, chip: "bg-slate-50 text-slate-500 border-slate-200" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.chip}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || "—", icon: CircleDashed, pill: "bg-slate-50 text-slate-400 border-slate-100" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${cfg.pill}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function ResponsesList({ responses }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {["Ref", "Name", "Type", "Status", "Owner", ""].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!responses?.length ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="size-6 text-muted-foreground/25" />
                  <p className="text-sm text-muted-foreground">No responses found.</p>
                </div>
              </td>
            </tr>
          ) : (
            responses.map((response) => (
              <tr
                key={response.id}
                className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/responses/${response.id}`)}
              >
                {/* Ref */}
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded font-mono">
                    {response.response_ref}
                  </span>
                </td>

                {/* Name */}
                <td className="px-5 py-3.5 max-w-[220px]">
                  <span className="text-sm text-foreground font-medium truncate block">
                    {response.response_name || "—"}
                  </span>
                </td>

                {/* Type */}
                <td className="px-5 py-3.5">
                  <TypeChip type={response.response_type} />
                </td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  <StatusPill status={response.status} />
                </td>

                {/* Owner */}
                <td className="px-5 py-3.5">
                  {response.owner ? (
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full bg-[#EDE9F8] dark:bg-accent shrink-0">
                        <span className="text-[9px] font-bold text-[#7B3FBE] dark:text-foreground uppercase">
                          {response.owner.first_name?.[0]}{response.owner.last_name?.[0]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {response.owner.first_name} {response.owner.last_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </td>

                {/* Action */}
                <td className="px-5 py-3.5">
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/responses/${response.id}`); }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                    >
                      <ArrowUpRight className="size-3" /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsesList;