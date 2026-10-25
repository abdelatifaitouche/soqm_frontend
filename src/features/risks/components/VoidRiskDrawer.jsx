import { useState } from "react"
import { Ban, Loader2, AlertCircle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { closeRisk } from "@/features/risks/api/riskApi"
import { useRiskReasonCategories } from "@/features/risks/hooks/useRiskReasonCategories"

// Context sent to the backend for this flow.
const CLOSE_CONTEXT = "RISK_CLOSE"

// A comment makes the audit trail meaningful. Set to false if the backend treats it as optional.
const COMMENT_REQUIRED = true

const FIELD_CLS =
  "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors disabled:opacity-60"

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

// ── Form (mounted only while the drawer is open, so it always starts empty) ───

function VoidRiskForm({ risk, onVoided, onClose }) {
  const { categories, loading, error, refetch } = useRiskReasonCategories()

  const [code, setCode] = useState("")
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState("")

  // The endpoint may return reasons for several contexts; only show the ones for closing a risk.
  const options = categories.filter((c) => !c.context || c.context === CLOSE_CONTEXT)
  const selected = options.find((c) => c.code === code)

  const cleanComment = comment.trim()
  const errors = {
    code: !code ? "Choose a reason." : "",
    comment: COMMENT_REQUIRED && !cleanComment ? "Add a short comment explaining why." : "",
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setApiError("")
    if (hasErrors) return

    const payload = {
      code: selected.code,
      context: selected.context ?? CLOSE_CONTEXT,
      user_comment: cleanComment,
    }

    setSaving(true)
    try {
      const result = await closeRisk(risk.id, payload)

      // Use the risk the API returns if it sends one back; otherwise apply what we know changed.
      const fromApi = result && typeof result === "object" && result.id && result.status ? result : null
      onVoided(
        fromApi ?? {
          ...risk,
          status: "voided",
          closure_reason: {
            closure_code: payload.code,
            closure_title: payload.context,
            closed_by: null,
            closure_reason_comment: payload.user_comment,
          },
        }
      )
      onClose()
    } catch (err) {
      setApiError(extractError(err, "Couldn’t void this risk. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {/* Reason */}
        <fieldset disabled={saving}>
          <legend className="text-sm font-medium text-foreground mb-2">
            Reason <span className="text-muted-foreground font-normal">*</span>
          </legend>

          {loading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-lg border border-border bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-destructive">Couldn’t load the reasons.</p>
              <button type="button" onClick={refetch} className="text-xs font-medium text-[#7B3FBE] hover:underline">
                Try again
              </button>
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reasons are configured for this action.</p>
          ) : (
            <div role="radiogroup" aria-label="Reason for voiding this risk" className="space-y-2">
              {options.map((c) => {
                const active = c.code === code
                return (
                  <label
                    key={c.code}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                      active
                        ? "border-[#3B1F6A] bg-[#EDE9F8]/50 ring-1 ring-[#3B1F6A] dark:bg-accent dark:border-[#7B3FBE] dark:ring-[#7B3FBE]"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="closure-reason"
                      value={c.code}
                      checked={active}
                      onChange={() => setCode(c.code)}
                      className="sr-only"
                    />
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? "border-[#3B1F6A] dark:border-[#7B3FBE]" : "border-border"
                      }`}
                    >
                      {active && <span className="size-2 rounded-full bg-[#3B1F6A] dark:bg-[#7B3FBE]" />}
                    </span>
                    <span className="text-sm text-foreground">{c.display_text}</span>
                  </label>
                )
              })}
            </div>
          )}

          {submitted && errors.code && <p className="text-xs text-red-600 mt-2">{errors.code}</p>}
        </fieldset>

        {/* Comment */}
        <div>
          <label htmlFor="void-comment" className="block text-sm font-medium text-foreground mb-1.5">
            Comment{" "}
            {COMMENT_REQUIRED ? (
              <span className="text-muted-foreground font-normal">*</span>
            ) : (
              <span className="text-muted-foreground font-normal">(optional)</span>
            )}
          </label>
          <textarea
            id="void-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            disabled={saving}
            placeholder="e.g. Added by mistake while testing"
            className={`${FIELD_CLS} resize-none leading-relaxed ${submitted && errors.comment ? "border-red-400" : "border-input"}`}
          />
          {submitted && errors.comment ? (
            <p className="text-xs text-red-600 mt-1.5">{errors.comment}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1.5">The reason and comment are recorded on the risk.</p>
          )}
        </div>

        {apiError && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {apiError}
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
          disabled={saving || loading || !!error}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
          Void risk
        </button>
      </SheetFooter>
    </form>
  )
}

/**
 * Props
 *  - open / onOpenChange: drawer state
 *  - risk:     the current risk (needs id and risk_ref)
 *  - onVoided: (nextRisk) => void. Pass `setRisk` from useRisk.
 */
export default function VoidRiskDrawer({ open, onOpenChange, risk, onVoided }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>
            Void risk <span className="font-mono">{risk.risk_ref}</span>
          </SheetTitle>
          <SheetDescription>
            Choose why this risk should no longer be tracked. The reason is recorded on the risk.
          </SheetDescription>
        </SheetHeader>
        {open && <VoidRiskForm risk={risk} onVoided={onVoided} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}