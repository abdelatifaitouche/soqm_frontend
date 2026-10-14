import {
  Pencil, Plus, Trash2, PowerOff, Power, Archive,
  MoreHorizontal, ChevronLeft,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ComponentEditDrawer from "./ComponentEditDrawer";
import {
  updateComponent,
  activateComponent,
  deactivateComponent,
  archiveComponent,
} from "@/features/isqm_components/api/componentsApi"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  ACTIVE: {
    label: "Active",
    bar:   "bg-emerald-400",
    badge: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900",
    glow:  "shadow-[0_0_0_3px_rgba(52,211,153,0.15)]",
  },
  IN_ACTIVE: {
    label: "Inactive",
    bar:   "bg-amber-400",
    badge: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900",
    glow:  "shadow-[0_0_0_3px_rgba(251,191,36,0.15)]",
  },
  ARCHIVED: {
    label: "Archived",
    bar:   "bg-slate-300 dark:bg-slate-600",
    badge: "text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
    glow:  "",
  },
};

// ─── Inline confirm dialog ────────────────────────────────────────────────────

function ConfirmDialog({ title, body, confirmLabel, confirmCls, onConfirm, onCancel }) {
  return (
    // full-screen backdrop
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-sm font-medium py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-sm font-medium py-2 rounded-xl transition-colors text-white ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overflow menu (More…) ────────────────────────────────────────────────────

function MoreMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="More actions"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden py-1">
          {items.map((item, i) =>
            item === "divider" ? (
              <div key={i} className="my-1 border-t border-border/60" />
            ) : (
              <button
                key={i}
                onClick={() => { setOpen(false); item.onClick(); }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="size-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ComponentHeader({ component, isAdmin, setComponent, onDelete }) {
  const navigate = useNavigate();
  const [busy, setBusy]       = useState(null);
  const [confirm, setConfirm] = useState(null); // { key, title, body, confirmLabel, confirmCls, action }

  const status = component.status; // "ACTIVE" | "IN_ACTIVE" | "ARCHIVED"
  const cfg    = STATUS[status] || STATUS.IN_ACTIVE;

  // Generic runner: sets busy, calls API, updates component
  const run = (key, apiFn) => async () => {
    setBusy(key);
    try {
      const res = await apiFn(component.id);
      setComponent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  // Ask for confirm then run
  const ask = (key, apiFn, meta) => () => setConfirm({ key, action: run(key, apiFn), ...meta });

  const handleUpdate = async (data) => {
    try {
      const res = await updateComponent(component.id, data);
      setComponent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Build overflow menu items based on status
  const moreItems = [];

  if (isAdmin) {
    if (status === "ACTIVE") {
      moreItems.push({
        icon: PowerOff, label: "Deactivate",
        onClick: ask("deactivate", deactivateComponent, {
          title: "Deactivate this component?",
          body: "It will be marked inactive. Nothing is deleted — you can reactivate at any time.",
          confirmLabel: "Deactivate", confirmCls: "bg-amber-600 hover:bg-amber-700",
        }),
        disabled: busy === "deactivate",
      });
      moreItems.push({
        icon: Archive, label: "Archive",
        onClick: ask("archive", archiveComponent, {
          title: "Archive this component?",
          body: "Archived components become read-only and are hidden from active views.",
          confirmLabel: "Archive", confirmCls: "bg-slate-700 hover:bg-slate-800",
        }),
        disabled: busy === "archive",
      });
    }

    if (status === "IN_ACTIVE") {
      moreItems.push({
        icon: Power, label: "Activate",
        onClick: run("activate", activateComponent),
        disabled: busy === "activate",
      });
      moreItems.push({
        icon: Archive, label: "Archive",
        onClick: ask("archive", archiveComponent, {
          title: "Archive this component?",
          body: "Archived components become read-only and are hidden from active views.",
          confirmLabel: "Archive", confirmCls: "bg-slate-700 hover:bg-slate-800",
        }),
        disabled: busy === "archive",
      });
    }

    if (status === "ARCHIVED") {
      moreItems.push({
        icon: Power, label: "Restore to active",
        onClick: run("activate", activateComponent),
        disabled: busy === "activate",
      });
    }

    moreItems.push("divider");
    moreItems.push({
      icon: Trash2, label: "Delete component", danger: true,
      onClick: ask("delete", () => Promise.resolve(), {
        title: "Delete this component?",
        body: "This is permanent. All linked objectives, risks, and responses will be affected.",
        confirmLabel: "Delete permanently", confirmCls: "bg-red-600 hover:bg-red-700",
      }),
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">

        {/* ── Left ──────────────────────────────────────────────────── */}
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate("/components")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ChevronLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
              Components
            </button>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {component.name}
            </span>
          </div>

          {/* Name + status badge */}
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              {component.name}
            </h1>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
              <span className={`size-1.5 rounded-full ${cfg.bar}`} />
              {cfg.label}
            </span>
          </div>

          {/* Meta */}
          <p className="text-sm text-muted-foreground">
            {component.isqm_reference}
          </p>
        </div>

        {/* ── Right ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <>
              <ComponentEditDrawer
                component={component}
                onSave={handleUpdate}
                trigger={
                  <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                }
              />

              {moreItems.length > 0 && <MoreMenu items={moreItems} />}
            </>
          )}

          <button
            onClick={() => navigate(`/objectives/create?component_id=${component.id}`)}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
          >
            <Plus className="size-3.5" /> Add objective
          </button>
        </div>
      </div>

      {/* ── Confirm dialog (portal-style, rendered outside card) ──── */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          confirmCls={confirm.confirmCls}
          onConfirm={() => {
            const action = confirm.key === "delete"
              ? () => onDelete?.(component.id)
              : confirm.action;
            setConfirm(null);
            action();
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

export default ComponentHeader;