import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Pagination({ page, totalPages, total, onPageChange, loading }) {
  if (totalPages <= 1) return null

  const from = (page - 1) * 10 + 1
  const to   = Math.min(page * 10, total)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && arr[i - 1] !== p - 1) acc.push("…")
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="text-xs text-muted-foreground px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === page
                  ? "bg-[#3B1F6A] text-white"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => {onPageChange(page + 1);
             console.log(page)}}
          disabled={page >= totalPages || loading}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
