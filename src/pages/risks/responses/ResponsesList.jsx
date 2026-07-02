import { ArrowBigRightDash } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

function ResponsesList({ responses }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
              reference
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">
              response
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
              type
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
              status
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
              owner
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
              details
            </th>
          </tr>
        </thead>
        <tbody>
          {responses?.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="text-center text-sm text-muted-foreground py-16"
              >
                No Response found.
              </td>
            </tr>
          ) : (
            responses?.map((response) => (
              <tr
                key={response.id}
                className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {response.response_ref}
                  </span>
                </td>

                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {response.response_name}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {response.response_type}
                  </span>
                </td>
                
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {response.status}
                  </span>
                </td>

                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {response.owner.first_name} {response.owner.last_name}
                  </span>
                </td>
                

                <td className="px-5 py-3.5 hidden md:table-cell">
                  <button
                    onClick={() => navigate(`/responses/${response.id}`)}
                    className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
                  >
                    <ArrowBigRightDash className="size-3.5" /> view
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsesList;
