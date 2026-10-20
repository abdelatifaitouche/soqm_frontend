import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Pencil, Ban, UserCheck, Loader2, AlertCircle, X } from "lucide-react"
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
  SheetFooter,
} from "@/components/ui/sheet"
import { useEmployee } from "@/features/employees/hooks/useEmployee"
import { useEmployeeActions } from "@/features/employees/hooks/useEmployeeActions"

// ── Config ────────────────────────────────────────────────────────────────────
// Which states allow which action. Adjust to your business rules.

const BLOCKABLE = ["ACTIVE", "ON_LEAVE", "INVITED"]
const ACTIVATABLE = ["IN_ACTIVE"]

const STATUS_CONFIG = {
  ACTIVE:     { label: "Active",     dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  INVITED:    { label: "Invited",    dot: "bg-blue-500",    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  ON_LEAVE:   { label: "On leave",   dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  IN_ACTIVE:  { label: "Inactive",   dot: "bg-slate-400",   cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800" },
  TERMINATED: { label: "Terminated", dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
}

const keyOf = (v) => String(v ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_")

function titleCase(str) {
  const s = String(str ?? "").replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtDate(val) {
  if (!val) return "—"
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// FastAPI can return `detail` as a string or as a list of validation errors.
function extractError(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).filter(Boolean).join(". ")
  return fallback
}

const FIELD_CLS =
  "w-full rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-60"

// ── Small components ──────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[keyOf(status)]
  if (!cfg) return <span className="text-sm text-muted-foreground">{titleCase(status) || "—"}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function Section({ title, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-border bg-card ${className}`}>
      <h2 className="px-5 pt-4 pb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="px-5 pb-5">{children}</div>
    </section>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm text-foreground text-right">{children}</dd>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6" aria-busy="true">
      <div className="h-5 w-24 rounded bg-muted animate-pulse" />
      <div className="rounded-xl border border-border bg-card p-8 flex items-center gap-5">
        <div className="size-16 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-56 rounded bg-muted animate-pulse" />
          <div className="h-4 w-36 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    </div>
  )
}

// ── Edit drawer ───────────────────────────────────────────────────────────────
// The form is mounted only while the drawer is open, so it always starts from
// the latest saved values. Only changed fields are sent.

const EDITABLE = [
  { key: "first_name", label: "First name", max: 50 },
  { key: "last_name", label: "Last name", max: 50 },
  { key: "job_title", label: "Job title", max: 100 },
]

function EditForm({ employee, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: employee.first_name ?? "",
    last_name: employee.last_name ?? "",
    job_title: employee.job_title ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const errors = Object.fromEntries(
    EDITABLE.map(({ key, label, max }) => {
      const v = form[key].trim()
      return [key, v.length < 2 ? `${label} must be at least 2 characters` : v.length > max ? `${label} must be ${max} characters or fewer` : ""]
    })
  )
  const hasErrors = Object.values(errors).some(Boolean)

  const changes = Object.fromEntries(
    EDITABLE.map(({ key }) => [key, form[key].trim()]).filter(([key, v]) => v !== (employee[key] ?? ""))
  )
  const hasChanges = Object.keys(changes).length > 0

  const submit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setError("")
    if (hasErrors) return
    if (!hasChanges) { onClose(); return }

    setSaving(true)
    try {
      await onSave(changes)
      onClose()
    } catch (err) {
      setError(extractError(err, "Couldn’t save the changes. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
        {EDITABLE.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              disabled={saving}
              className={`${FIELD_CLS} ${submitted && errors[key] ? "border-red-400" : "border-input"}`}
            />
            {submitted && errors[key] && <p className="text-xs text-red-600 mt-1.5">{errors[key]}</p>}
          </div>
        ))}

        <p className="text-xs text-muted-foreground leading-relaxed">
          Department and level can’t be changed here.
        </p>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      <SheetFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#52298F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </SheetFooter>
    </form>
  )
}

function EditDrawer({ open, onOpenChange, employee, onSave }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit employee</SheetTitle>
          <SheetDescription>Update {employee.first_name}’s details.</SheetDescription>
        </SheetHeader>
        {open && <EditForm employee={employee} onSave={onSave} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employee, setEmployee, loading, error, refetch } = useEmployee(id)
  const { busy, update, block, activate } = useEmployeeActions(id)

  const [editOpen, setEditOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [actionError, setActionError] = useState("")

  // Use the returned employee when the API sends one back; otherwise reload.
  const apply = (result) => {
    if (result?.id && result?.status) setEmployee(result)
    else refetch()
  }

  const handleSave = async (changes) => apply(await update(changes))

  const handleBlock = async (e) => {
    e.preventDefault() // keep the dialog open until the request finishes
    setActionError("")
    try {
      apply(await block())
      setBlockOpen(false)
    } catch (err) {
      setBlockOpen(false)
      setActionError(extractError(err, "Couldn’t block this employee. Try again."))
    }
  }

  const handleActivate = async () => {
    setActionError("")
    try {
      apply(await activate())
    } catch (err) {
      setActionError(extractError(err, "Couldn’t activate this employee. Try again."))
    }
  }

  if (loading && !employee) return <PageSkeleton />

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-sm font-semibold text-foreground">
              {error ? "Couldn’t load this employee." : "Employee not found."}
            </p>
          </div>
          <button onClick={() => navigate("/employees")} className="text-xs text-[#3B1F6A] dark:text-[#a78bdb] hover:underline">
            Back to employees
          </button>
        </div>
      </div>
    )
  }

  const status = keyOf(employee.status)
  const canBlock = BLOCKABLE.includes(status)
  const canActivate = ACTIVATABLE.includes(status)
  const name = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unnamed"
  const initials = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`.toUpperCase()

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Employees
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>

          {canBlock && (
            <button
              onClick={() => setBlockOpen(true)}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors disabled:opacity-50"
            >
              <Ban className="size-3.5" />
              Block
            </button>
          )}

          {canActivate && (
            <button
              onClick={handleActivate}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#3B1F6A] hover:bg-[#52298F] rounded-md transition-colors disabled:opacity-60"
            >
              {busy === "activate" ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
              Activate
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError("")} aria-label="Dismiss" className="hover:opacity-70">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Header card */}
      <header className="rounded-xl border border-border bg-card p-6 sm:p-8 flex items-center gap-5 flex-wrap">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#EDE9F8] text-[#3B1F6A] dark:bg-accent dark:text-foreground text-xl font-bold shrink-0">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">{name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[employee.job_title, employee.department?.name].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <StatusPill status={employee.status} />
      </header>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <Section title="Details">
          <dl className="-my-1">
            <DetailRow label="First name">{employee.first_name || "—"}</DetailRow>
            <DetailRow label="Last name">{employee.last_name || "—"}</DetailRow>
            <DetailRow label="Job title">{employee.job_title || "—"}</DetailRow>
            <DetailRow label="Department">{employee.department?.name ?? "—"}</DetailRow>
            <DetailRow label="Level">{employee.level ? titleCase(employee.level) : "—"}</DetailRow>
            <DetailRow label="Status"><StatusPill status={employee.status} /></DetailRow>
          </dl>
        </Section>

        <Section title="Record">
          <dl className="-my-1">
            <DetailRow label="Added">{fmtDate(employee.created_at)}</DetailRow>
            <DetailRow label="Last updated">{fmtDate(employee.updated_at)}</DetailRow>
          </dl>
        </Section>
      </div>

      <EditDrawer open={editOpen} onOpenChange={setEditOpen} employee={employee} onSave={handleSave} />

      {/* Block confirmation */}
      <AlertDialog open={blockOpen} onOpenChange={(v) => { if (busy !== "block") setBlockOpen(v) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {employee.first_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {name} will be marked as inactive. You can activate them again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "block"}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={busy === "block"} className="bg-red-600 hover:bg-red-700">
              {busy === "block" && <Loader2 className="size-4 animate-spin mr-2" />}
              Block employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}