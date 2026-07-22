import { Pencil, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateObjective } from "@/features/objectives/api/objectivesApi"
import { Sheet } from "@/components/ui/sheet";
function ObjectiveEditDrawer({open, setOpen}) {
  

  return (
    <Sheet open={open}>
      
    </Sheet>
  );
}




function ObjectiveHeader({ objective, isAdmin , setOjective }) {
  const [openEdit , setOpenEdit] = useState(false)

  const navigate = useNavigate();
  const handleUpdate = async (data) => {
    try {
      const res = await updateObjective(objective.id, data);
        
      setOjective(res.data);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate("/objectives")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border bg-card px-2.5 py-1.5 rounded-lg"
          >
            ← Objectives
          </button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground">Details</span>
        </div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {objective.objective_reference}-Details
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review objective information and manage linked risks
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdmin && (
          <>
            <button
                onClick={() => setOpenEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
            <button
              onClick={() => {
                /* open delete dialog */
              }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 transition-colors"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </>
        )}
      </div>
      <ObjectiveEditDrawer open={openEdit} setOpen={setOpenEdit}/>
    </div>
  );
}

export default ObjectiveHeader;
