import { Pencil, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import ComponentEditDrawer from "./ComponentEditDrawer";
import { updateComponent } from "@/api/endpoints/componentsApi"

function ComponentHeader({ component, isAdmin , setComponent }) {
  const navigate = useNavigate();
  /**() => setDeleteOpen(true) */

  const handleUpdate = async (data) => {
  try {
    const res = await updateComponent(component.id, data)

    setComponent(res.data)

  } catch (err) {
    console.error(err)
  }
}

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate("/components")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border bg-card px-2.5 py-1.5 rounded-lg"
          >
            ← Components
          </button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {component.name}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {component.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {component.isqm_reference}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdmin && (
          <>
            <ComponentEditDrawer
              component={component}
              onSave={handleUpdate}
              trigger={
                <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <Pencil className="size-3.5" />
                  Edit
                </button>
              }
            />
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 transition-colors"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </>
        )}
        <button
          onClick={() =>
            navigate(`/objectives/create?component_id=${component.id}`)
          }
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
        >
          <Plus className="size-3.5" /> Add objective
        </button>
      </div>
    </div>
  );
}

export default ComponentHeader;
