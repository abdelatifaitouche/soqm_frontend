import { ShieldCheck } from "lucide-react";
import React from "react";

function ComponentCard(component) {
  return (
    <div>
      <div
        key={component.id}
        className="group relative flex flex-col gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md hover:border-[#C4B0E8] transition-all duration-200"
      >
        {/* Index + reference badge */}
        <div className="flex items-center justify-between">
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${color.bg}`}
          >
            <ShieldCheck className={`size-4 ${color.text}`} />
          </div>
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${color.bg} ${color.text}`}
          >
            {component.isqm_reference}
          </span>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full shrink-0 ${color.dot}`} />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Component {index + 1}
            </span>
          </div>
          <h3 className="text-sm font-medium text-[#1E0A3C] leading-snug pr-2">
            {component.name}
          </h3>
        </div>

        {/* Admin actions — only visible on hover for admins */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => openEdit(component, e)}
              className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] text-muted-foreground hover:text-[#3B1F6A] transition-colors"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={(e) => openDelete(component, e)}
              className="flex size-7 items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentCard;
