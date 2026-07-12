import React, { useState, useRef, useMemo, useEffect } from "react"
import { downloadDocument, uploadDocument } from "@/api/endpoints/documentApi"
import { useDocuments } from "@/hooks/useDocuments"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Loader2,
  AlertCircle,
  FolderOpen,
  Upload,
  UploadCloud,
  X,
  Search,
  Plus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRole } from "@/hooks/useRole"

// ============================================================
// CONFIG
// ============================================================

// Matches the backend DocumentType enum — values are lowercase
const DOCUMENT_TYPES = [
  { value: "policy",    label: "Policy" },
  { value: "manual",    label: "Manual" },
  { value: "procedure", label: "Procedure" },
  { value: "template",  label: "Template" },
  { value: "form",      label: "Form" },
  { value: "guidance",  label: "Guidance" },
  { value: "evidence",  label: "Evidence" },
  { value: "standard",  label: "Standard" },
  { value: "other",     label: "Other" },
]

const TYPE_FILTER_OPTIONS = [{ value: "", label: "All types" }, ...DOCUMENT_TYPES]

// Matches the backend DocumentStatus enum — values are lowercase
const STATUS_OPTIONS = [
  { value: "",         label: "All statuses" },
  { value: "active",   label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "deleted",  label: "Deleted" },
]

const SELECT_CLS =
  "h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#7B3FBE] transition-colors cursor-pointer"

// Icon + color driven by the document_type enum (backend sends it
// inconsistently cased — "template" vs "POLICY" — so always compare lowercased).
// There's no file-extension info in the payload, so category is the only
// reliable signal for the icon.
const DOC_TYPE_VISUAL = {
  policy:    { icon: FileText,        chip: "bg-[#EDE9F8] text-[#7B3FBE] dark:bg-accent dark:text-foreground" },
manual: {
  icon: FileText,
  chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
},  procedure: { icon: FileText,        chip: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" },
  template:  { icon: FileSpreadsheet, chip: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400" },
  form:      { icon: FileSpreadsheet, chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" },
  guidance:  { icon: FileText,        chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" },
  evidence:  { icon: FileImage,       chip: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" },
  standard:  { icon: FileText,        chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" },
  other:     { icon: File,            chip: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
}

const DEFAULT_TYPE_ICON = DOC_TYPE_VISUAL.other

function getTypeIconConfig(doc) {
  const type = (doc.document_type || "").toLowerCase()
  return DOC_TYPE_VISUAL[type] || DEFAULT_TYPE_ICON
}

// Document-type badge (distinct color set from the icon chip, purely cosmetic)
const DOC_TYPE_BADGE = {
  policy:    "bg-[#EDE9F8] text-[#3B1F6A] dark:bg-accent dark:text-foreground",
  procedure: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  template:  "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  form:      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  guidance:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  evidence:  "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  standard:  "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  other:     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

function DocTypeBadge({ type }) {
  if (!type) return null
  const style = DOC_TYPE_BADGE[type.toLowerCase()] || DOC_TYPE_BADGE.other
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${style}`}>
      {type.toLowerCase()}
    </span>
  )
}

// Status badge (active / archived / deleted)
const STATUS_BADGE = {
  active:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500",
  deleted:  "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
}

function StatusBadge({ status }) {
  if (!status) return null
  const style = STATUS_BADGE[status.toLowerCase()] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${style}`}>
      {status.toLowerCase()}
    </span>
  )
}

function formatBytes(bytes) {
  if (!bytes) return null
  const units = ["B", "KB", "MB", "GB"]
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// ============================================================
// DOCUMENT CARD
// ============================================================

function DocumentCard({ doc, onDownload, downloading, failed }) {
  const { icon: Icon, chip } = getTypeIconConfig(doc)
  const meta = [formatBytes(doc.file_size), formatDate(doc.updated_at || doc.created_at)].filter(Boolean)

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all">
      <div className={`flex size-11 items-center justify-center rounded-lg shrink-0 ${chip}`}>
        <Icon className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
            {doc.title || "Untitled document"}
          </p>
          <DocTypeBadge type={doc.document_type} />
          <StatusBadge status={doc.status} />
          {doc.version != null && (
            <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              v{doc.version}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {doc.description && <span className="truncate max-w-xs">{doc.description}</span>}
          {meta.length > 0 && (
            <>
              {doc.description && <span className="text-zinc-300 dark:text-zinc-700">·</span>}
              <span className="whitespace-nowrap">{meta.join(" · ")}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {failed && (
          <span className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle className="size-3" /> Failed
          </span>
        )}
        <button
          onClick={() => onDownload(doc.id, doc.title)}
          disabled={downloading}
          title="Download"
          className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-white hover:bg-[#3B1F6A] disabled:opacity-50 transition-colors"
        >
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// UPLOAD DRAWER
// ============================================================

function UploadDrawer({ open, onOpenChange, onUploaded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [documentType, setDocumentType] = useState("policy")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const inputRef = useRef(null)

  const reset = () => {
    setFile(null)
    setTitle("")
    setDescription("")
    setDocumentType("policy")
    setProgress(0)
    setError("")
  }

  const handleClose = (val) => {
    if (!val && !uploading) reset()
    onOpenChange(val)
  }

  const pickFile = (f) => {
    if (!f) return
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a file to upload.")
      return
    }
    if (!title.trim()) {
      setError("Title is required.")
      return
    }

    setUploading(true)
    setError("")
    setProgress(0)

    try {
      const res = await uploadDocument(
        file,
        { title: title.trim(), description: description.trim(), document_type: documentType },
        {
          onUploadProgress: (evt) => {
            if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100))
          },
        }
      )

      onUploaded?.(res?.data ?? res)
      reset()
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to upload document", err)
      setError(err?.response?.data?.detail ?? "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Upload document</SheetTitle>
          <SheetDescription>Add a file to the document library</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-5 py-2">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-[#7B3FBE] bg-[#EDE9F8] dark:bg-accent"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            {file ? (
              <>
                <CheckCircle2 className="size-6 text-emerald-500" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-full px-4">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">{formatBytes(file.size)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600 transition-colors"
                >
                  <X className="size-3" /> Remove
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="size-6 text-zinc-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-zinc-400">PDF, Word, Excel, or image files</p>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#7B3FBE]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description"
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#7B3FBE] resize-none"
            />
          </div>

          {/* Document type */}
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Document type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#7B3FBE]"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Progress */}
          {uploading && (
            <div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-[#7B3FBE] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">{progress}%</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <SheetFooter>
          <button
            onClick={() => handleClose(false)}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-md hover:bg-[#52298F] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({ page, totalPages, hasNextPage, hasPrevPage, onChange }) {
  if (totalPages <= 1) return null

  const pages = useMemo(() => {
    const set = new Set([1, totalPages, page - 1, page, page + 1])
    return [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={!hasPrevPage}
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="size-3.5" />
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1]
        const gap = prev !== undefined && p - prev > 1
        return (
          <React.Fragment key={p}>
            {gap && <span className="px-1.5 text-xs text-muted-foreground/50">…</span>}
            <button
              onClick={() => onChange(p)}
              className={`flex items-center justify-center size-8 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-[#3B1F6A] text-white"
                  : "border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        )
      })}

      <button
        onClick={() => onChange(page + 1)}
        disabled={!hasNextPage}
        className="flex items-center justify-center size-8 rounded-lg border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function Documents() {
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [page, setPage] = useState(1)
    const { isAdmin } = useRole()
  // Both filters are already lowercase, matching the backend enums exactly —
  // no transformation needed before sending.
  const filters = useMemo(() => ({
    ...(typeFilter && { document_type: typeFilter }),
    ...(statusFilter && { status: statusFilter }),
  }), [typeFilter, statusFilter])

  // Any filter change invalidates the current page.
  useEffect(() => {
    setPage(1)
  }, [filters])

  const {
    documents, setDocuments, documents_loading, documents_error,
    total, totalPages, hasNextPage, hasPrevPage,
  } = useDocuments(filters, page)

  const [downloadingId, setDownloadingId] = useState(null)
  const [failedId, setFailedId] = useState(null)

  const handleDownload = async (id, title) => {
    setDownloadingId(id)
    setFailedId(null)
    try {
      const blob = await downloadDocument(id)
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = title ? title.replace(/[^\w.\- ]/g, "").trim() : `document-${id}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to download document", err)
      setFailedId(id)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleUploaded = (newDoc) => {
    if (typeof setDocuments === "function" && newDoc) {
      setDocuments((prev) => [newDoc, ...(prev ?? [])])
    }
  }

  // Search is client-side, applied on top of whatever page the backend returned.
  const visible = search
    ? documents?.filter((d) => (d.title || "").toLowerCase().includes(search.toLowerCase()))
    : documents

  const isFiltered = !!(typeFilter || statusFilter)

  const clearFilters = () => {
    setTypeFilter("")
    setStatusFilter("")
  }

  return (
    <div className="max-w mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {documents_loading ? "Loading library…" : `${total} document${total !== 1 ? "s" : ""} in your library`}
          </p>
        </div>
        {
            isAdmin ? <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#52298F] transition-colors shrink-0"
        >
          <Plus className="size-4" />
          Upload document
        </button>:<></>
        }
        
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-xs flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-card outline-none focus:ring-2 focus:ring-[#7B3FBE] text-foreground placeholder:text-muted-foreground transition-colors"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={SELECT_CLS}
        >
          {TYPE_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={SELECT_CLS}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="size-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {documents_loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading documents…</span>
        </div>
      ) : documents_error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-destructive">
          <AlertCircle className="size-4" />
          <span className="text-sm">Failed to load documents</span>
        </div>
      ) : !documents?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EDE9F8] dark:bg-accent">
            <FolderOpen className="size-6 text-[#7B3FBE]" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isFiltered ? "No documents match these filters" : "No documents yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFiltered ? "Try a different type or status" : "Upload your first file to get started"}
            </p>
          </div>
          {isFiltered ? (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 mt-2 px-4 py-2 text-sm font-medium text-[#7B3FBE] hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 mt-2 px-4 py-2 text-sm font-medium text-white bg-[#3B1F6A] rounded-lg hover:bg-[#52298F] transition-colors"
            >
              <Plus className="size-4" />
              Upload document
            </button>
          )}
        </div>
      ) : visible?.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No documents match "{search}"
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDownload={handleDownload}
              downloading={downloadingId === doc.id}
              failed={failedId === doc.id}
            />
          ))}
        </div>
      )}

      {/* Pagination — hidden while search is active since search only
          filters the current page client-side and doesn't affect page count. */}
      {!documents_loading && !documents_error && total > 0 && !search && (
        <Pagination
          page={page}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onChange={setPage}
        />
      )}

      <UploadDrawer open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={handleUploaded} />
    </div>
  )
}