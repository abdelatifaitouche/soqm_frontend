import { ArrowRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formatDate";

function ObjectiveTable({objectives}) {
    const navigate = useNavigate()
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-muted/20">
          {["Objective", "Status", "Review date", ""].map((h) => (
            <th
              key={h}
              className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {objectives.map((obj) => (
          <tr
            key={obj.id}
            onClick={() => navigate(`/objectives/${obj.id}`)}
            className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <td className="px-5 py-3.5 max-w-sm">
              <p className="text-sm text-foreground line-clamp-2 leading-snug">
                {obj.objective_reference}
              </p>
            </td>
            <td className="px-5 py-3.5">
              {obj.status}
            </td>
            <td className="px-5 py-3.5">
              <span className="text-sm text-muted-foreground">
                {formatDate(obj.review_date)}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/objectives/${obj.id}`);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3B1F6A] hover:bg-[#52298F] text-white transition-colors"
                >
                  <ArrowRight className="size-3.5" /> View
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ObjectiveTable;
