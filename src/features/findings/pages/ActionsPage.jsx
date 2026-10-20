import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft, AlertCircle, Loader2, CalendarDays, CheckCircle2,
  Clock3, Wrench, CircleDashed, ExternalLink, ClipboardList,
  RefreshCw, Pencil, Play, X, Trash2,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { useAction } from "@/features/findings/hooks/useAction";
import {
  useStartAction, useCompleteAction, useUpdateAction,
} from "@/features/findings/hooks/useActionMutation";
import { useDeleteAction } from "@/features/findings/hooks/useActions";

// ── Status config ─────────────────────────────────────────────────────────────

const ACTION_STATUS_CONFIG = {
  DRAFT:       { label: "Draft",       icon: CircleDashed, cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
  IN_PROGRESS: { label: "In progress", icon: Wrench,       cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(value) {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function fmtDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

function extractError(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msg = detail.map((d) => d.msg).filter(Boolean).join(". ");
    if (msg) return msg;
  }
  return err?.message && !err.message.startsWith("Request failed") ? err.message : fallback;
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, confirmCls, loading }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="px-6 pt-6 pb-5">
          <h2 id="confirm-title" className="text-base font-semibold text-foreground pr-8">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60 ${confirmCls}`}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, compact = false }) {
  const config = ACTION_STATUS_CONFIG[status] ?? ACTION_STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border font-semibold ${config.cls} ${compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"}`}>
      <Icon className="size-3.5 shrink-0" />
      {config.label}
    </span>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
        {Icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="px-5 sm:px-6">{children}</div>
    </section>
  );
}

function DetailRow({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/60 py-4 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex items-center gap-2 sm:w-44 sm:shrink-0">
        {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="min-w-0 break-words text-sm font-medium text-foreground sm:flex-1">
        {children ?? <span className="font-normal text-muted-foreground">Not set</span>}
      </div>
    </div>
  );
}

function DateCard({ label, value, icon: Icon, variant = "default" }) {
  const variants = { default: "bg-muted/40", success: "bg-emerald-50/70 dark:bg-emerald-950/20", warning: "bg-amber-50/70 dark:bg-amber-950/20" };
  const iconVariants = { default: "text-muted-foreground", success: "text-emerald-600 dark:text-emerald-400", warning: "text-amber-600 dark:text-amber-400" };
  return (
    <div className={`rounded-xl border border-border/70 p-4 ${variants[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${iconVariants[variant]}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{value ?? "Not set"}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12" aria-busy="true">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="size-12 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />)}
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="mx-auto flex min-h-64 max-w-xl items-center justify-center py-12">
      <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">Unable to load action</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message || "This action could not be found or loaded."}
        </p>
        <button type="button" onClick={onBack}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          <ArrowLeft className="size-4" /> Go back
        </button>
      </div>
    </div>
  );
}

// ── Edit drawer ───────────────────────────────────────────────────────────────

const FIELD_CLS = "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-[#3B1F6A] focus:ring-2 focus:ring-[#3B1F6A]/15 disabled:opacity-60";

function EditForm({ action, onSave, onClose }) {
  const savedDate = action.estimated_completion_date?.slice(0, 10) ?? "";
  const [title, setTitle]       = useState(action.title ?? "");
  const [date, setDate]         = useState(savedDate);
  const [saving, setSaving]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  const cleanTitle = title.trim();
  const titleError = !cleanTitle ? "The action title is required." : "";
  const changes = {};
  if (cleanTitle !== (action.title ?? "")) changes.title = cleanTitle;
  if (date !== savedDate) changes.estimated_completion_date = date ? `${date}T00:00:00` : null;
  const hasChanges = Object.keys(changes).length > 0;

  async function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (titleError) return;
    if (!hasChanges) { onClose(); return; }
    setSaving(true);
    try {
      await onSave(changes);
      onClose();
    } catch (err) {
      setError(extractError(err, "Failed to update this action."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="action-title" className="text-sm font-medium text-foreground">Action title</label>
          <input id="action-title" value={title} onChange={(e) => setTitle(e.target.value)}
            maxLength={255} disabled={saving}
            className={`${FIELD_CLS} ${submitted && titleError ? "border-red-400" : "border-border"}`} />
          {submitted && titleError && <p className="text-xs text-red-600">{titleError}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="estimated-date" className="text-sm font-medium text-foreground">Estimated completion date</label>
          <input id="estimated-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            disabled={saving} className={`${FIELD_CLS} border-border`} />
          <p className="text-xs text-muted-foreground">Leave empty to clear the date.</p>
        </div>
        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
      </div>
      <SheetFooter>
        <button type="button" onClick={onClose} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={saving || !hasChanges}
          className="flex items-center gap-2 rounded-lg bg-[#3B1F6A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4b2883] disabled:cursor-not-allowed disabled:opacity-50">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </SheetFooter>
    </form>
  );
}

function EditDrawer({ open, onOpenChange, action, onSave }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit action</SheetTitle>
          <SheetDescription>Update the title or the estimated completion date.</SheetDescription>
        </SheetHeader>
        {open && <EditForm action={action} onSave={onSave} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActionDetails() {
  const { action_id } = useParams();
  const navigate      = useNavigate();

  const { action, loading, error: fetchError } = useAction(action_id);
  const startMutation    = useStartAction();
  const completeMutation = useCompleteAction();
  const updateMutation   = useUpdateAction();
  const deleteMutation   = useDeleteAction();

  const [local, setLocal]       = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending]   = useState(null); // "start" | "complete" | null
  const [formError, setFormError] = useState("");

  // Confirm dialog state
  const [confirm, setConfirm]   = useState(null);
  // confirm = { kind, title, description, confirmLabel, confirmCls, action }

  useEffect(() => { if (action) setLocal(action); }, [action]);

  const current = local ?? action;

  if (loading && !current) return <Skeleton />;
  if (fetchError || !current) return (
    <ErrorState message={extractError(fetchError, "This action could not be found.")} onBack={() => navigate(-1)} />
  );

  const actionStatus = current.status;
  const completed    = actionStatus === "COMPLETED";
  const busy         = pending !== null;

  function merge(result, fallback) {
    const fromApi = result && typeof result === "object" && result.id ? result : null;
    setLocal((prev) => ({ ...prev, ...(fromApi ?? fallback) }));
  }

  async function runStatusAction(kind, mutate, fallback, failureMessage) {
    setFormError("");
    setPending(kind);
    setConfirm(null);
    try {
      const result = await mutate(current.id);
      merge(result, fallback);
    } catch (err) {
      setFormError(extractError(err, failureMessage));
    } finally {
      setPending(null);
    }
  }

  const handleStart = () => setConfirm({
    kind:         "start",
    title:        "Start this action?",
    description:  "This will move the action to In progress. You can complete it once the work is done.",
    confirmLabel: "Start action",
    confirmCls:   "bg-[#3B1F6A] hover:bg-[#4b2883]",
    action:       () => runStatusAction("start", startMutation.mutate, { status: "IN_PROGRESS" }, "Failed to start this action."),
  });

  const handleComplete = () => setConfirm({
    kind:         "complete",
    title:        "Mark action as completed?",
    description:  "This will record today as the completion date. Completed actions can't be edited afterward.",
    confirmLabel: "Complete action",
    confirmCls:   "bg-emerald-600 hover:bg-emerald-700",
    action:       () => runStatusAction("complete", completeMutation.mutate, { status: "COMPLETED", completion_date: new Date().toISOString() }, "Failed to complete this action."),
  });

  const handleDelete = () => setConfirm({
    kind:         "delete",
    title:        "Delete this action?",
    description:  "This is a soft delete — the action will be removed from view but can be restored by an administrator if needed.",
    confirmLabel: "Delete action",
    confirmCls:   "bg-red-600 hover:bg-red-700",
    action:       async () => {
      setFormError("")
      setPending("delete")
      setConfirm(null)
      try {
        await deleteMutation.mutate(current.id)
        navigate(-1) // 204 No Content — nothing to merge, just leave
      } catch (err) {
        setFormError(extractError(err, "Failed to delete this action."))
        setPending(null)
      }
    },
  });

  async function handleUpdate(changes) {
    setFormError("");
    const result = await updateMutation.mutate(current.id, changes);
    merge(result, changes);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-16">
      <button type="button" onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* Header */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#3B1F6A]/10 text-[#3B1F6A] dark:text-[#a78bdb]">
                {completed ? <CheckCircle2 className="size-6" /> : <ClipboardList className="size-6" />}
              </div>
              <div className="min-w-0">
                <div className="mb-3"><StatusBadge status={actionStatus} /></div>
                <h1 className="break-words text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                  {current.title || "Untitled action"}
                </h1>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">ID: {current.id}</p>
              </div>
            </div>

            {current.finding_id && (
              <button type="button" disabled={busy}
                onClick={() => navigate(`/findings/${current.finding_id}`)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50">
                View finding <ExternalLink className="size-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/70 pt-5">
            <button type="button" disabled={busy || completed}
              onClick={() => { setFormError(""); setEditOpen(true); }}
              title={completed ? "Completed actions can't be edited" : undefined}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
              <Pencil className="size-4" /> Edit action
            </button>

            {!completed && (
              <button type="button" disabled={busy} onClick={handleDelete}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50">
                {pending === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete
              </button>
            )}

            {actionStatus === "DRAFT" && (
              <button type="button" disabled={busy} onClick={handleStart}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B1F6A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4b2883] disabled:cursor-not-allowed disabled:opacity-50">
                {pending === "start" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Start action
              </button>
            )}

            {actionStatus === "IN_PROGRESS" && (
              <button type="button" disabled={busy} onClick={handleComplete}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                {pending === "complete" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Complete action
              </button>
            )}

            {completed && (
              <span className="text-xs text-muted-foreground">Completed actions can't be edited.</span>
            )}
          </div>

          {formError && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> <p>{formError}</p>
            </div>
          )}
        </div>

        {completed && (
          <div className="flex items-start gap-3 border-t border-emerald-200 bg-emerald-50/70 px-5 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:px-7">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Action completed</p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                {current.completion_date
                  ? `Completed on ${fmtDateTime(current.completion_date) ?? fmtDate(current.completion_date)}.`
                  : "This action is marked as completed."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        <p className="mt-1 text-xs text-muted-foreground">Estimated and actual completion dates.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DateCard label="Estimated completion" value={fmtDate(current.estimated_completion_date)} icon={CalendarDays} variant={completed ? "default" : "warning"} />
          <DateCard label="Actual completion"    value={fmtDate(current.completion_date)}            icon={CheckCircle2}  variant={completed ? "success" : "default"} />
        </div>
      </section>

      {/* Details */}
      <SectionCard title="Action information" description="Status and details associated with this action." icon={ClipboardList}>
        <DetailRow label="Status" icon={Clock3}><StatusBadge status={actionStatus} compact /></DetailRow>
        <DetailRow label="Estimated completion" icon={CalendarDays}>{fmtDate(current.estimated_completion_date)}</DetailRow>
        <DetailRow label="Completed on" icon={CheckCircle2}>
          {fmtDateTime(current.completion_date) ?? <span className="font-normal text-muted-foreground">Not yet completed</span>}
        </DetailRow>
        <DetailRow label="Related finding" icon={ExternalLink}>
          {current.finding_id ? (
            <button type="button" onClick={() => navigate(`/findings/${current.finding_id}`)}
              className="break-all text-left text-[#3B1F6A] hover:underline dark:text-[#a78bdb]">
              {current.finding_id}
            </button>
          ) : (
            <span className="font-normal text-muted-foreground">No finding linked</span>
          )}
        </DetailRow>
      </SectionCard>

      <SectionCard title="Record history" description="Creation and last modification timestamps." icon={Clock3}>
        <DetailRow label="Created at"   icon={CalendarDays}>{fmtDateTime(current.created_at)}</DetailRow>
        <DetailRow label="Last updated" icon={RefreshCw}>{fmtDateTime(current.updated_at)}</DetailRow>
      </SectionCard>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.action}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        confirmCls={confirm?.confirmCls}
        loading={busy}
      />

      <EditDrawer open={editOpen} onOpenChange={setEditOpen} action={current} onSave={handleUpdate} />
    </main>
  );
}