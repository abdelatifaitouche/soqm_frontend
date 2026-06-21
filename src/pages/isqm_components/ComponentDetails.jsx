import { useParams, useNavigate } from "react-router-dom"
import { AlertCircle, Loader2, Plus, ArrowRight, Pencil, Trash2, ShieldCheck } from "lucide-react"
import { useComponent } from "@/hooks/useComponent"
import { useComponentObjectives } from "@/hooks/useComponentObjectives"
import { useRole } from "@/hooks/useRole"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { deleteComponent } from "@/api/endpoints/componentsApi"

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:        { label: "Draft",        cls: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",              dot: "bg-gray-400" },
  approved:     { label: "Approved",     cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",     dot: "bg-emerald-500" },
  active:       { label: "Active",       cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",     dot: "bg-emerald-500" },
  under_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",             dot: "bg-amber-500" },
  revised:      { label: "Revised",      cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",         dot: "bg-purple-500" },
  achieved:     { label: "Achieved",     cls: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",                 dot: "bg-teal-500" },
  archived:     { label: "Archived",     cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",              dot: "bg-gray-400" },
}

function StatusPill({ status }) {
  const s = status?.toLowerCase()
  const cfg = STATUS_CONFIG[s] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",
    dot: "bg-gray-400",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ComponentDetails() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { isAdmin } = useRole()

  const { component, loading: compLoading, error: compError } = useComponent(id)
  const { objectives, loading: objLoading, error: objError }  = useComponentObjectives(id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteComponent(id)
      navigate("/components")
    } finally {
      setDeleting(false)
    }
  }

  const totalObjectives  = objectives?.length ?? 0
  const activeObjectives = objectives?.filter((o) => o.status === "active").length ?? 0
  const underReview      = objectives?.filter((o) => o.status === "under_review").length ?? 0

  if (compLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading component…</span>
    </div>
  )

  if (compError || !component) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" />
      <span className="text-sm">Component not found.</span>
    </div>
  )

  return (
    <>
      <div className="space-y-5">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => navigate("/components")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border bg-card px-2.5 py-1.5 rounded-lg"
              >
                ← Components
              </button>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{component.name}</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{component.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{component.isqm_reference}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate(`/components/${id}/edit`)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
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

        {/* Component info card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            {/* Order badge */}
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3B1F6A] text-white text-sm font-semibold shrink-0">
              {component.display_order}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#EDE9F8] text-[#7B3FBE] dark:bg-accent dark:text-foreground">
                  <ShieldCheck className="size-3" /> {component.isqm_reference}
                </span>
                <StatusPill status={component.is_active ? "active" : "draft"} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {component.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Display order</p>
              <p className="text-sm font-medium text-foreground">#{component.display_order}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Status</p>
              <StatusPill status={component.is_active ? "active" : "draft"} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Total objectives</p>
              <p className="text-sm font-medium text-[#7B3FBE]">{totalObjectives} objectives</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">ISQM reference</p>
              <p className="text-sm font-medium text-foreground">{component.isqm_reference}</p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total objectives", value: totalObjectives,  color: "text-foreground" },
            { label: "Active",           value: activeObjectives, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Under review",     value: underReview,      color: "text-amber-600 dark:text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Objectives table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Linked objectives</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Quality objectives associated with this component</p>
            </div>
            <button
              onClick={() => navigate(`/objectives/create?component_id=${component.id}`)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
            >
              <Plus className="size-3" /> Add objective
            </button>
          </div>

          {objLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /><span className="text-sm">Loading objectives…</span>
            </div>
          ) : objError ? (
            <div className="py-12 text-center text-destructive text-sm">Failed to load objectives.</div>
          ) : !objectives?.length ? (
            <div className="py-14 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No objectives linked to this component yet.</p>
              <button
                onClick={() => navigate(`/objectives/create?component_id=${component.id}`)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1"
              >
                <Plus className="size-3.5" /> Add the first objective
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["Objective", "Status", "Review date", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {objectives.map((obj) => (
                  <tr
                    key={obj.id}
                    onClick={() => navigate(`/objectives/${obj.id}`)}
                    className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 max-w-sm">
                      <p className="text-sm text-foreground line-clamp-2 leading-snug">{obj.objective_text}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={obj.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground">{formatDate(obj.review_date)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/objectives/${obj.id}/edit`) }}
                            className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] dark:hover:bg-accent text-muted-foreground hover:text-[#3B1F6A] dark:hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/objectives/${obj.id}`) }}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                        >
                          <ArrowRight className="size-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete component?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{component.name}</span> will be permanently
              deleted along with all associated objectives. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="size-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}