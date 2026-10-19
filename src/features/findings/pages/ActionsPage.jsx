
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Wrench,
  CircleDashed,
  ExternalLink,
  ClipboardList,
  Hash,
  RefreshCw,
} from "lucide-react";
import { useAction } from "@/features/findings/hooks/useAction";
import { useEffect, useState } from "react";
import {
  Pencil,
  Save,
  X,
  Play,
} from "lucide-react";

import {
  useStartAction,
  useCompleteAction,
  useUpdateAction,
} from "@/features/findings/hooks/useActionMutation";

// ── Status configuration ─────────────────────────────────────────────────────

const ACTION_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    description: "This action has not started yet.",
    icon: CircleDashed,
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    iconCls: "text-slate-500 dark:text-slate-400",
  },
  IN_PROGRESS: {
    label: "In progress",
    description: "Work on this action is underway.",
    icon: Wrench,
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    iconCls: "text-amber-600 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    description: "This action has been completed.",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    iconCls: "text-emerald-600 dark:text-emerald-400",
  },
};

function fmtDate(value) {
  if (!value) return null;

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function fmtDateTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status, compact = false }) {
  const config =
    ACTION_STATUS_CONFIG[status] ?? ACTION_STATUS_CONFIG.DRAFT;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border font-semibold ${config.cls} ${
        compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
    >
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
          <h2 className="text-sm font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
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
        {Icon && (
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="min-w-0 break-words text-sm font-medium text-foreground sm:flex-1">
        {children ?? (
          <span className="font-normal text-muted-foreground">
            Not set
          </span>
        )}
      </div>
    </div>
  );
}

function DateCard({ label, value, icon: Icon, variant = "default" }) {
  const variants = {
    default: "bg-muted/40",
    success:
      "bg-emerald-50/70 dark:bg-emerald-950/20",
    warning:
      "bg-amber-50/70 dark:bg-amber-950/20",
  };

  const iconVariants = {
    default: "text-muted-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className={`rounded-xl border border-border/70 p-4 ${variants[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${iconVariants[variant]}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="mt-3 text-sm font-semibold text-foreground">
        {value ?? "Not set"}
      </p>
    </div>
  );
}

// ── Loading state ────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6 pb-12"
      aria-label="Loading action details"
      aria-busy="true"
    >
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="size-12 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="mb-5 h-5 animate-pulse rounded bg-muted last:mb-0"
          />
        ))}
      </div>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onBack, onRetry }) {
  return (
    <div className="mx-auto flex min-h-64 max-w-xl items-center justify-center py-12">
      <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>

        <h2 className="mt-4 text-base font-semibold text-foreground">
          Unable to load action
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message || "This action could not be found or loaded."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Go back
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B1F6A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4b2883] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1F6A] focus-visible:ring-offset-2"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────


export default function ActionDetails() {
  const { action_id } = useParams();
  const navigate = useNavigate();

  const {
    action,
    loading,
    error: fetchError,
  } = useAction(action_id);

  const startMutation = useStartAction();
  const completeMutation = useCompleteAction();
  const updateMutation = useUpdateAction();

  const [currentAction, setCurrentAction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!action) return;

    setCurrentAction(action);
    setTitle(action.title ?? "");
    setEstimatedDate(
      action.estimated_completion_date?.slice(0, 10) ?? ""
    );
  }, [action]);

  if (loading) return <Skeleton />;

  if (fetchError || !currentAction) {
    return (
      <ErrorState
        message="Unable to load this action."
        onBack={() => navigate(-1)}
      />
    );
  }

  const busy =
    startMutation.loading ||
    completeMutation.loading ||
    updateMutation.loading;

  const actionStatus = currentAction.status;
  const completed = actionStatus === "COMPLETED";

async function handleStart() {
  setFormError("");

  try {
    await startMutation.mutate(currentAction.id);

    setCurrentAction((previous) => ({
      ...previous,
      status: "IN_PROGRESS",
    }));
  } catch {
    setFormError(
      startMutation.error || "Failed to start this action."
    );
  }
}

async function handleComplete() {
  setFormError("");

  try {
    await completeMutation.mutate(currentAction.id);

    setCurrentAction((previous) => ({
      ...previous,
      status: "COMPLETED",
      completion_date: new Date().toISOString(),
    }));
  } catch {
    setFormError(
      completeMutation.error || "Failed to complete this action."
    );
  }
}

  async function handleUpdate(event) {
    event.preventDefault();
    setFormError("");

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setFormError("The action title is required.");
      return;
    }

    const payload = {
      title: cleanTitle,
      estimated_completion_date: estimatedDate
        ? `${estimatedDate}T00:00:00`
        : null,
    };

    try {
      const result = await updateMutation.mutate(
        currentAction.id,
        payload
      );

      setCurrentAction((previous) => ({
        ...previous,
        ...(result ?? {}),
        ...payload,
      }));

      setEditing(false);
    } catch {
      setFormError(
        updateMutation.error || "Failed to update this action."
      );
    }
  }

  const status =
    ACTION_STATUS_CONFIG[actionStatus] ??
    ACTION_STATUS_CONFIG.DRAFT;

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Navigation */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>

      {/* Header */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#3B1F6A]/10 text-[#3B1F6A] dark:text-[#a78bdb]">
                {completed ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <ClipboardList className="size-6" />
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-3">
                  <StatusBadge status={actionStatus} />
                </div>

                {editing ? (
                  <form
                    id="edit-action-form"
                    onSubmit={handleUpdate}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label
                        htmlFor="action-title"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Action title
                      </label>

                      <input
                        id="action-title"
                        value={title}
                        onChange={(event) =>
                          setTitle(event.target.value)
                        }
                        required
                        maxLength={255}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-[#3B1F6A] focus:ring-2 focus:ring-[#3B1F6A]/15"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="estimated-date"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Estimated completion date
                      </label>

                      <input
                        id="estimated-date"
                        type="date"
                        value={estimatedDate}
                        onChange={(event) =>
                          setEstimatedDate(event.target.value)
                        }
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-[#3B1F6A] focus:ring-2 focus:ring-[#3B1F6A]/15"
                      />
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="break-words text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                      {currentAction.title || "Untitled action"}
                    </h1>

                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                      ID: {currentAction.id}
                    </p>
                  </>
                )}
              </div>
            </div>

            {currentAction.finding_id && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  navigate(`/findings/${currentAction.finding_id}`)
                }
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                View finding
                <ExternalLink className="size-3.5" />
              </button>
            )}
          </div>

          {/* Action controls */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border/70 pt-5">
            {editing ? (
              <>
                <button
                  type="submit"
                  form="edit-action-form"
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B1F6A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4b2883] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateMutation.loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save changes
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setTitle(currentAction.title ?? "");
                    setEstimatedDate(
                      currentAction.estimated_completion_date?.slice(0, 10) ?? ""
                    );
                    setFormError("");
                    setEditing(false);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <X className="size-4" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy || completed}
                  onClick={() => {
                    setFormError("");
                    setEditing(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="size-4" />
                  Edit action
                </button>

                {actionStatus === "DRAFT" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleStart}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B1F6A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4b2883] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {startMutation.loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Start action
                  </button>
                )}

                {actionStatus === "IN_PROGRESS" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleComplete}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {completeMutation.loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Complete action
                  </button>
                )}
              </>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{formError}</p>
            </div>
          )}
        </div>

        {completed && (
          <div className="flex items-start gap-3 border-t border-emerald-200 bg-emerald-50/70 px-5 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:px-7">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Action completed
              </p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                {currentAction.completion_date
                  ? `Completed on ${
                      fmtDateTime(currentAction.completion_date) ??
                      fmtDate(currentAction.completion_date)
                    }.`
                  : "This action is marked as completed."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-sm font-semibold text-foreground">
          Timeline
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Estimated and actual completion dates.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DateCard
            label="Estimated completion"
            value={fmtDate(currentAction.estimated_completion_date)}
            icon={CalendarDays}
            variant={completed ? "default" : "warning"}
          />

          <DateCard
            label="Actual completion"
            value={fmtDate(currentAction.completion_date)}
            icon={CheckCircle2}
            variant={completed ? "success" : "default"}
          />
        </div>
      </section>

      {/* Action information */}
      <SectionCard
        title="Action information"
        description="Status and details associated with this action."
        icon={ClipboardList}
      >
        <DetailRow label="Status" icon={Clock3}>
          <StatusBadge status={actionStatus} compact />
        </DetailRow>

        <DetailRow label="Estimated completion" icon={CalendarDays}>
          {fmtDate(currentAction.estimated_completion_date)}
        </DetailRow>

        <DetailRow label="Completed on" icon={CheckCircle2}>
          {fmtDateTime(currentAction.completion_date) ?? (
            <span className="font-normal text-muted-foreground">
              Not yet completed
            </span>
          )}
        </DetailRow>

        <DetailRow label="Related finding" icon={ExternalLink}>
          {currentAction.finding_id ? (
            <button
              type="button"
              onClick={() =>
                navigate(`/findings/${currentAction.finding_id}`)
              }
              className="break-all text-left text-[#3B1F6A] hover:underline dark:text-[#a78bdb]"
            >
              {currentAction.finding_id}
            </button>
          ) : (
            <span className="font-normal text-muted-foreground">
              No finding linked
            </span>
          )}
        </DetailRow>
      </SectionCard>

      {/* Record history */}
      <SectionCard
        title="Record history"
        description="Creation and last modification timestamps."
        icon={Clock3}
      >
        <DetailRow label="Created at" icon={CalendarDays}>
          {fmtDateTime(currentAction.created_at)}
        </DetailRow>

        <DetailRow label="Last updated" icon={RefreshCw}>
          {fmtDateTime(currentAction.updated_at)}
        </DetailRow>
      </SectionCard>
    </main>
  );
}
