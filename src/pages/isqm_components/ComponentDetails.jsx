import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useComponent } from "@/hooks/useComponent";
import { useComponentObjectives } from "@/hooks/useComponentObjectives";
import { useRole } from "@/hooks/useRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { deleteComponent } from "@/api/endpoints/componentsApi";
import ComponentHeader from "./components/ComponentHeader";
import ObjectiveTable from "../objectives/components/ObjectiveTable";
import ComponentInfo from "./components/ComponentInfo";



// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    cls: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",
    dot: "bg-gray-400",
  },
  approved: {
    label: "Approved",
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  active: {
    label: "Active",
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  under_review: {
    label: "Under Review",
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  revised: {
    label: "Revised",
    cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  achieved: {
    label: "Achieved",
    cls: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  archived: {
    label: "Archived",
    cls: "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground",
    dot: "bg-gray-400",
  },
};



export default function ComponentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  const {
    component,
    setComponent,
    loading: compLoading,
    error: compError,
  } = useComponent(id);
  const {
    objectives,
    loading: objLoading,
    error: objError,
  } = useComponentObjectives(id);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteComponent(id);
      navigate("/components");
    } finally {
      setDeleting(false);
    }
  };

  

  const totalObjectives = objectives?.length ?? 0;
  const activeObjectives =
    objectives?.filter((o) => o.status === "active").length ?? 0;
  const underReview =
    objectives?.filter((o) => o.status === "under_review").length ?? 0;

  if (compLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading component…</span>
      </div>
    );

  if (compError || !component)
    return (
      <div className="flex items-center justify-center h-64 text-destructive gap-2">
        <AlertCircle className="size-4" />
        <span className="text-sm">Component not found.</span>
      </div>
    );

  return (
    <>
      <div className="space-y-5">
        {/* Page header */}
        <ComponentHeader component={component} isAdmin={isAdmin} setComponent={setComponent} />

        {/* Component info card */}
        <ComponentInfo
          component={component}
          totalObjectives={totalObjectives}
        />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total objectives",
              value: totalObjectives,
              color: "text-foreground",
            },
            {
              label: "Active",
              value: activeObjectives,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Under review",
              value: underReview,
              color: "text-amber-600 dark:text-amber-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card px-5 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                {s.label}
              </p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
          
        {/* Objectives table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Linked objectives
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quality objectives associated with this component
              </p>
            </div>
            <button
              onClick={() =>
                navigate(`/objectives/create?component_id=${component.id}`)
              }
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
            >
              <Plus className="size-3" /> Add objective
            </button>
          </div>

          {objLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading objectives…</span>
            </div>
          ) : objError ? (
            <div className="py-12 text-center text-destructive text-sm">
              Failed to load objectives.
            </div>
          ) : !objectives?.length ? (
            <div className="py-14 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No objectives linked to this component yet.
              </p>
              <button
                onClick={() =>
                  navigate(`/objectives/create?component_id=${component.id}`)
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B3FBE] hover:underline mt-1"
              >
                <Plus className="size-3.5" /> Add the first objective
              </button>
            </div>
          ) : (
            <ObjectiveTable objectives={objectives} />
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete component?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {component.name}
              </span>{" "}
              will be permanently deleted along with all associated objectives.
              This cannot be undone.
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
  );
}
