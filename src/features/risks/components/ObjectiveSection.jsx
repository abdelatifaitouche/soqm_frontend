import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Target, Plus, Unlink, Check, Loader2, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react"
import {
  addObjectiveToRisk,
  removeObjectiveFromRisk,
  fetchComponentObjectives,
} from "@/features/risks/api/riskApi"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const DRAWER_PAGE_SIZE = 10

// ── Add-objective drawer ──────────────────────────────────────────────────────
// Lists the objectives of the risk's component. Objectives already linked show
// as "Linked". Mounted state resets whenever the drawer closes.

function AddObjectiveDrawer({ open, onOpenChange, riskId, componentId, linkedIds, onAdded }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, size: DRAWER_PAGE_SIZE })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [addingId, setAddingId] = useState(null)
  const [addError, setAddError] = useState("")
  const [addedIds, setAddedIds] = useState(() => new Set()) // linked during this drawer session

  useEffect(() => {
    if (!open || !componentId) return
    let cancelled = false
    setLoading(true)
    setLoadError("")
    fetchComponentObjectives(componentId, { page, size: DRAWER_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        // Accept either a paginated { items, total, size } or a plain array.
        if (Array.isArray(res)) {
          setData({ items: res, total: res.length, size: Math.max(res.length, DRAWER_PAGE_SIZE) })
        } else {
          setData({
            items: res?.items ?? [],
            total: res?.total ?? 0,
            size: res?.size ?? DRAWER_PAGE_SIZE,
          })
        }
      })
      .catch(() => { if (!cancelled) setLoadError("Couldn’t load objectives. Try again.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, page, reloadKey, componentId])

  const handleOpenChange = (val) => {
    if (!val) {
      setPage(1)
      setAddError("")
      setAddedIds(new Set())
    }
    onOpenChange(val)
  }

  const handleAdd = async (objective) => {
    setAddingId(objective.id)
    setAddError("")
    try {
      await addObjectiveToRisk(riskId, objective.id)
      setAddedIds((s) => new Set(s).add(objective.id))
      onAdded(objective)
    } catch (err) {
      if (err?.response?.status === 409) {
        setAddedIds((s) => new Set(s).add(objective.id))
        setAddError(`Objective ${objective.objective_reference} is already linked to this risk.`)
      } else {
        setAddError(extractError(err, "Couldn’t link this objective. Try again."))
      }
    } finally {
      setAddingId(null)
    }
  }

  const items = data.items
  const totalPages = Math.max(1, Math.ceil((data.total ?? 0) / (data.size || DRAWER_PAGE_SIZE)))

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Add existing objective</SheetTitle>
          <SheetDescription>
            Objectives from this risk’s component. Pick one to link it to this risk.
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
              <span className="text-sm">Loading objectives…</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <p className="text-sm text-destructive">{loadError}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-xs font-medium text-[#7B3FBE] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Target className="size-4 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No objectives found for this component.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((o) => {
                const adding = addingId === o.id
                const linked = linkedIds.has(o.id) || addedIds.has(o.id)
                return (
                  <li key={o.id} className={`flex items-start gap-3 py-3.5 ${linked ? "opacity-70" : ""}`}>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent dark:text-foreground px-2 py-0.5 rounded-md font-mono">
                          {o.objective_reference}
                        </span>
                        {o.status && (
                          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {formatLabel(o.status)}
                          </span>
                        )}
                      </div>
                      {o.description && (
                        <p className="text-sm text-foreground/90 leading-snug line-clamp-2">{o.description}</p>
                      )}
                    </div>

                    {linked ? (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3.5" /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(o)}
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
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Objectives section (sidebar card) ─────────────────────────────────────────
/**
 * Props
 *  - risk:      the risk from useRisk (needs id, component, objectives)
 *  - onChange:  (nextRisk) => void. Pass `setRisk` from useRisk.
 *  - canManage: whether the user may link / unlink objectives
 */
export default function ObjectivesSection({ risk, onChange, canManage = false }) {
  const navigate = useNavigate()
  const objectives = risk.objectives ?? []
  const componentId = risk.component?.id ?? risk.component_id ?? null

  const [addOpen, setAddOpen] = useState(false)
  const [toRemove, setToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState("")

  const linkedIds = useMemo(() => new Set(objectives.map((o) => o.id)), [objectives])

  // The risk payload lists objectives as { id, objective_reference, status }.
  const handleAdded = (objective) => {
    if (objectives.some((o) => o.id === objective.id)) return
    onChange({
      ...risk,
      objectives: [
        ...objectives,
        { id: objective.id, objective_reference: objective.objective_reference, status: objective.status },
      ],
    })
  }

  const openRemove = (objective) => {
    setRemoveError("")
    setToRemove(objective)
  }

  const closeRemove = () => {
    if (removing) return // don't close mid-request
    setToRemove(null)
    setRemoveError("")
  }

  const handleRemove = async (e) => {
    e.preventDefault() // keep the dialog open until the request settles
    if (!toRemove) return
    setRemoving(true)
    setRemoveError("")
    try {
      await removeObjectiveFromRisk(risk.id, toRemove.id)
      onChange({ ...risk, objectives: objectives.filter((o) => o.id !== toRemove.id) })
      setToRemove(null)
    } catch (err) {
      setRemoveError(extractError(err, "Couldn’t remove this objective. Try again."))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Objectives
            {objectives.length ? <span className="ml-1.5 font-normal text-muted-foreground">{objectives.length}</span> : null}
          </h2>

          {canManage && (
            <button
              onClick={() => setAddOpen(true)}
              disabled={!componentId}
              title={!componentId ? "This risk has no component" : undefined}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-3" /> Add
            </button>
          )}
        </div>

        <div className="px-5 pb-5">
          {objectives.length > 0 ? (
            <ul className="-my-1">
              {objectives.map((obj) => (
                <li key={obj.id} className="flex items-center gap-1 border-b border-border/60 last:border-0">
                  <button
                    onClick={() => navigate(`/objectives/${obj.id}`)}
                    className="group flex-1 min-w-0 flex items-center gap-3 py-2.5 text-left"
                  >
                    <div className="flex items-center justify-center size-8 rounded-lg bg-[#EDE9F8] dark:bg-accent shrink-0">
                      <Target className="size-4 text-[#7B3FBE]" />
                    </div>
                    <span className="flex-1 min-w-0 text-sm text-foreground/90 truncate group-hover:text-foreground transition-colors">
                      Objective {obj.objective_reference}
                    </span>
                    {obj.status && (
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                        {formatLabel(obj.status)}
                      </span>
                    )}
                  </button>

                  {canManage && (
                    <button
                      onClick={() => openRemove(obj)}
                      aria-label={`Remove objective ${obj.objective_reference} from this risk`}
                      title="Remove from risk"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 focus-visible:text-red-600 transition-colors"
                    >
                      <Unlink className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground italic">Not linked to any objective</p>
              {canManage && componentId && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline"
                >
                  <Plus className="size-3.5" /> Add existing objective
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <AddObjectiveDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        riskId={risk.id}
        componentId={componentId}
        linkedIds={linkedIds}
        onAdded={handleAdded}
      />

      <AlertDialog open={!!toRemove} onOpenChange={(open) => !open && closeRemove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove objective from this risk?</AlertDialogTitle>
            <AlertDialogDescription>
              Objective <span className="font-mono font-semibold">{toRemove?.objective_reference}</span> will be
              unlinked from this risk. The objective itself isn’t deleted and can be linked again later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeError && (
            <div role="alert" className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {removeError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removing} className="bg-red-600 hover:bg-red-700">
              {removing && <Loader2 className="size-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}