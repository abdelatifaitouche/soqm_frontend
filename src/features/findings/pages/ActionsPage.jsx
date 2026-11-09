import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, AlertCircle, Loader2, CheckCircle2, CircleDashed, Wrench,
  Pencil, Play, Trash2, Check, Lock, ArrowUpRight, Lightbulb,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAction } from "@/features/findings/hooks/useAction";
import {
  useStartAction, useCompleteAction, useUpdateAction,
} from "@/features/findings/hooks/useActionMutation";
import { useDeleteAction } from "@/features/findings/hooks/useActions";
import { useEmployeeOptions } from "@/features/employees/hooks/useEmployeeOptions";
import ActionEvidenceSection from "@/features/findings/components/ActionEvidenceSection";

// ── Config ────────────────────────────────────────────────────────────────────

const ACTION_STATUS_CONFIG = {
  DRAFT:       { label: "Draft",       icon: CircleDashed, cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700" },
  IN_PROGRESS: { label: "In progress", icon: Wrench,       cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900" },
};

const STEPS = ["DRAFT", "IN_PROGRESS", "COMPLETED"];

const FIELD_CLS =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(value) {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(value) {
  const d = parseDate(value);
  return d ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d) : null;
}

function fmtDateTime(value) {
  const d = parseDate(value);
  return d
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d)
    : null;
}

// Due-date urgency for actions that aren't completed yet.
function dueStatus(value, completed) {
  const d = parseDate(value);
  if (!d || completed) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86_400_000);
  if (days < 0) return { label: `${-days} day${days === -1 ? "" : "s"} overdue`, tone: "danger" };
  if (days === 0) return { label: "Due today", tone: "warning" };
  if (days <= 7) return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "warning" };
  return null;
}

function ownerName(owner) {
  if (!owner) return null;
  return `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() || "Unnamed owner";
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
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

// ── Small components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = ACTION_STATUS_CONFIG[status] ?? ACTION_STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", config.cls)}>
      <Icon className="size-3.5 shrink-0" />
      {config.label}
    </span>
  );
}

function DueChip({ due }) {
  if (!due) return null;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        due.tone === "danger"
          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      )}
    >
      {due.label}
    </span>
  );
}

function StatusStepper({ status, createdAt, completedAt }) {
  const idx = Math.max(0, STEPS.indexOf(status));
  const isCompleted = status === "COMPLETED";
  const dates = { DRAFT: fmtDate(createdAt), COMPLETED: fmtDate(completedAt) };

  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((key, i) => {
        const done = i < idx || isCompleted;
        const current = i === idx && !isCompleted;
        return (
          <li key={key} className={cn("flex min-w-0 items-center gap-3", i < STEPS.length - 1 && "flex-1")}>
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  current && "bg-primary/10 text-primary ring-2 ring-primary",
                  !done && !current && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className={cn("truncate text-sm font-medium", done || current ? "text-foreground" : "text-muted-foreground")}>
                  {ACTION_STATUS_CONFIG[key].label}
                </p>
                {done && dates[key] && (
                  <p className="truncate text-[11px] text-muted-foreground">{dates[key]}</p>
                )}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn("hidden h-0.5 flex-1 rounded-full sm:block", i < idx ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PropertyRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-foreground">
        {children ?? <span className="text-muted-foreground">Not set</span>}
      </dd>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12" aria-busy="true">
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <div className="h-36 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
        </div>
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="mx-auto flex min-h-64 max-w-md items-center justify-center py-12">
      <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">Unable to load action</h2>
        <p className="mx-auto mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {message || "This action could not be found or loaded."}
        </p>
        <Button variant="outline" size="lg" className="mt-6 px-4" onClick={onBack}>
          <ArrowLeft /> Go back
        </Button>
      </div>
    </div>
  );
}

// ── Edit drawer ───────────────────────────────────────────────────────────────

function EditForm({ action, onSave, onClose }) {
  const savedDate = action.estimated_completion_date?.slice(0, 10) ?? "";
  const currentOwnerId = action.owner_id ?? action.owner?.id ?? "";

  const [title, setTitle]         = useState(action.title ?? "");
  const [date, setDate]           = useState(savedDate);
  const [ownerId, setOwnerId]     = useState(currentOwnerId);
  const [saving, setSaving]       = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const { employee_options, employee_loading, employee_error } = useEmployeeOptions();

  const cleanTitle = title.trim();
  const titleError = !cleanTitle ? "The action title is required." : "";

  const changes = {};
  if (cleanTitle !== (action.title ?? "")) changes.title = cleanTitle;
  if (date !== savedDate) changes.estimated_completion_date = date ? `${date}T00:00:00` : null;
  if (String(ownerId) !== String(currentOwnerId)) changes.owner_id = ownerId === "" ? null : ownerId;
  const hasChanges = Object.keys(changes).length > 0;

  async function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    if (titleError) return;
    if (!hasChanges) return onClose();
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
          <label htmlFor="action-title" className="text-sm font-medium text-foreground">Title</label>
          <input
            id="action-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            disabled={saving}
            aria-invalid={submitted && !!titleError}
            className={cn(FIELD_CLS, submitted && titleError && "border-destructive")}
          />
          {submitted && titleError && <p className="text-xs text-destructive">{titleError}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="owner_id" className="text-sm font-medium text-foreground">Owner</label>
          <select
            id="owner_id"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            disabled={saving || employee_loading}
            className={FIELD_CLS}
          >
            <option value="">Unassigned</option>
            {(employee_options ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {`${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || "Unnamed"}
              </option>
            ))}
          </select>
          {employee_loading && <p className="text-xs text-muted-foreground">Loading employees…</p>}
          {employee_error && <p className="text-xs text-destructive">Could not load employees.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="estimated-date" className="text-sm font-medium text-foreground">Due date</label>
          <input
            id="estimated-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            className={FIELD_CLS}
          />
          <p className="text-xs text-muted-foreground">Leave empty to clear the date.</p>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button type="button" variant="ghost" size="lg" className="px-4" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="px-4" disabled={saving || !hasChanges}>
          {saving && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
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
          <SheetDescription>Update the title, owner or due date.</SheetDescription>
        </SheetHeader>
        {open && <EditForm action={action} onSave={onSave} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

// ── Progress card ─────────────────────────────────────────────────────────────

function nextStepText(status, total, accepted, completionDate) {
  if (status === "COMPLETED") {
    const when = fmtDateTime(completionDate);
    return when ? `Completed on ${when}. This action is now read-only.` : "This action is completed and read-only.";
  }
  if (status === "DRAFT") return "Start the action when work begins. Evidence can be submitted once it's in progress.";
  if (total === 0) return "Submit evidence showing the work was carried out, then get it reviewed.";
  if (accepted === 0) return `${total} evidence item${total === 1 ? " is" : "s are"} waiting for review. Accept it before completing.`;
  return "Evidence has been accepted. You can now complete the action.";
}

function ProgressCard({ action, accepted, total, pending, busy, onStart, onComplete }) {
  const status = action.status;
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <StatusStepper status={status} createdAt={action.created_at} completedAt={action.completion_date} />

      <div
        className={cn(
          "mt-5 flex flex-col gap-3 rounded-lg p-3.5 sm:flex-row sm:items-center sm:justify-between",
          status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/60"
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          {status === "COMPLETED" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
          )}
          <p className={cn("text-sm leading-relaxed", status === "COMPLETED" ? "text-emerald-800 dark:text-emerald-300" : "text-foreground")}>
            {nextStepText(status, total, accepted, action.completion_date)}
          </p>
        </div>

        {status === "DRAFT" && (
          <Button size="lg" className="shrink-0 px-4" disabled={busy} onClick={onStart}>
            {pending === "start" ? <Loader2 className="animate-spin" /> : <Play />}
            Start action
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <Button size="lg" className="shrink-0 px-4" disabled={busy} onClick={onComplete}>
            {pending === "complete" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            Complete action
          </Button>
        )}
      </div>
    </section>
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

  const [local, setLocal]             = useState(null);
  const [editOpen, setEditOpen]       = useState(false);
  const [pending, setPending]         = useState(null); // "start" | "complete" | "delete" | null
  const [formError, setFormError]     = useState("");
  const [confirm, setConfirm]         = useState(null); // { title, description, warning, confirmLabel, destructive, run }
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset the local copy whenever a fresh action arrives from the API.
  const [syncedAction, setSyncedAction] = useState(null);
  if (action && action !== syncedAction) {
    setSyncedAction(action);
    setLocal(action);
  }

  const current = local ?? action;

  if (loading && !current) return <PageSkeleton />;
  if (fetchError || !current) {
    return <ErrorState message={extractError(fetchError, "This action could not be found.")} onBack={() => navigate(-1)} />;
  }

  const status    = current.status;
  const completed = status === "COMPLETED";
  const busy      = pending !== null;
  const evidence  = Array.isArray(current.action_completion_evidence) ? current.action_completion_evidence : [];
  const accepted  = evidence.filter((e) => e.status === "ACCEPTED").length;
  const owner     = ownerName(current.owner);
  const due       = dueStatus(current.estimated_completion_date, completed);

  function merge(result, fallback) {
    const fromApi = result && typeof result === "object" && result.id ? result : null;
    setLocal((prev) => ({ ...prev, ...(fromApi ?? fallback) }));
  }

  function ask(config) {
    setFormError("");
    setConfirm(config);
    setConfirmOpen(true);
  }

  async function runConfirmed() {
    const { kind, run, failureMessage } = confirm;
    setPending(kind);
    try {
      await run();
      setConfirmOpen(false);
    } catch (err) {
      setConfirmOpen(false);
      setFormError(extractError(err, failureMessage));
    } finally {
      setPending(null);
    }
  }

  const handleStart = () => ask({
    kind: "start",
    title: "Start this action?",
    description: "The action moves to In progress, and evidence can then be submitted against it.",
    confirmLabel: "Start action",
    failureMessage: "Failed to start this action.",
    run: async () => merge(await startMutation.mutate(current.id), { status: "IN_PROGRESS" }),
  });

  const handleComplete = () => ask({
    kind: "complete",
    title: "Complete this action?",
    description: "Today will be recorded as the completion date. Completed actions can't be edited or receive new evidence.",
    warning: accepted === 0 ? "No evidence has been accepted for this action yet." : null,
    confirmLabel: "Complete action",
    failureMessage: "Failed to complete this action.",
    run: async () => merge(
      await completeMutation.mutate(current.id),
      { status: "COMPLETED", completion_date: new Date().toISOString() }
    ),
  });

  const handleDelete = () => ask({
    kind: "delete",
    title: "Delete this action?",
    description: "The action will be removed from view. An administrator can restore it if needed.",
    confirmLabel: "Delete action",
    destructive: true,
    failureMessage: "Failed to delete this action.",
    run: async () => {
      await deleteMutation.mutate(current.id);
      navigate(-1); // 204 No Content — nothing to merge, just leave
    },
  });

  async function handleUpdate(changes) {
    setFormError("");
    merge(await updateMutation.mutate(current.id, changes), changes);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <DueChip due={due} />
          </div>
          <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-foreground">
            {current.title || "Untitled action"}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {completed ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
              <Lock className="size-3.5" /> Read-only
            </span>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                className="px-3.5"
                disabled={busy}
                onClick={() => { setFormError(""); setEditOpen(true); }}
              >
                <Pencil /> Edit
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                disabled={busy}
                onClick={handleDelete}
                aria-label="Delete action"
                title="Delete action"
              >
                {pending === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </>
          )}
        </div>
      </header>

      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> <p>{formError}</p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <ProgressCard
            action={current}
            accepted={accepted}
            total={evidence.length}
            pending={pending}
            busy={busy}
            onStart={handleStart}
            onComplete={handleComplete}
          />

          <ActionEvidenceSection
            evidence={evidence}
            actionId={current.id}
            blockedReason={
              status === "DRAFT"
                ? "Start the action before submitting evidence."
                : completed
                  ? "Completed actions can't receive new evidence."
                  : null
            }
            onSubmitted={(item) =>
              setLocal((prev) => ({
                ...prev,
                action_completion_evidence: [item, ...(prev?.action_completion_evidence ?? [])],
              }))
            }
            onAccepted={(item) =>
              setLocal((prev) => ({
                ...prev,
                action_completion_evidence: (prev?.action_completion_evidence ?? []).map((e) =>
                  e.id === item.id ? item : e
                ),
              }))
            }
          />
        </div>

        {/* Properties sidebar */}
        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Details</h2>
          <dl className="divide-y divide-border/60">
            <PropertyRow label="Owner">
              {owner ? (
                <span className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {initials(owner)}
                  </span>
                  <span className="truncate">{owner}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </PropertyRow>

            <PropertyRow label="Due date">
              {fmtDate(current.estimated_completion_date) && (
                <span className="flex flex-wrap items-center gap-2">
                  {fmtDate(current.estimated_completion_date)}
                  <DueChip due={due} />
                </span>
              )}
            </PropertyRow>

            {completed && (
              <PropertyRow label="Completed">{fmtDateTime(current.completion_date)}</PropertyRow>
            )}

            <PropertyRow label="Finding">
              {current.finding_id ? (
                <Link
                  to={`/findings/${current.finding_id}`}
                  className="group inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  View finding
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                </Link>
              ) : (
                <span className="text-muted-foreground">No finding linked</span>
              )}
            </PropertyRow>

            <PropertyRow label="Created">{fmtDateTime(current.created_at)}</PropertyRow>
            <PropertyRow label="Last updated">{fmtDateTime(current.updated_at)}</PropertyRow>

            <PropertyRow label="Action ID">
              <span className="break-all font-mono text-xs text-muted-foreground">{current.id}</span>
            </PropertyRow>
          </dl>
        </aside>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!busy) setConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.warning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertCircle className="mt-px size-3.5 shrink-0" /> {confirm.warning}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={runConfirmed}
              className={confirm?.destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {busy && <Loader2 className="animate-spin" />}
              {confirm?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditDrawer open={editOpen} onOpenChange={setEditOpen} action={current} onSave={handleUpdate} />
    </main>
  );
}
