import { useComponents } from "@/features/isqm_components/hooks/useComponents"
import { useRole } from "@/features/auth/hooks/useRole"
import { ShieldCheck, AlertCircle, Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

const COMPONENT_COLORS = [
  { bg: "bg-[#EDE9F8]", text: "text-[#3B1F6A]", dot: "bg-[#7B3FBE]" },
  { bg: "bg-[#E8F0FB]", text: "text-[#1E3A6E]", dot: "bg-[#3B6FBE]" },
  { bg: "bg-[#F0EBF8]", text: "text-[#4A2080]", dot: "bg-[#9B5FDE]" },
  { bg: "bg-[#EAF3EE]", text: "text-[#1A4731]", dot: "bg-[#2E7D52]" },
  { bg: "bg-[#FDF3E7]", text: "text-[#7A3E0A]", dot: "bg-[#D4820A]" },
  { bg: "bg-[#FDE8F0]", text: "text-[#7A1E3E]", dot: "bg-[#C4336E]" },
  { bg: "bg-[#E8F5F5]", text: "text-[#1A4747]", dot: "bg-[#2E8080]" },
  { bg: "bg-[#F5EDE8]", text: "text-[#6E2E1A]", dot: "bg-[#B85030]" },
]

export default function IsqmComponents() {
  const navigate = useNavigate()

  const { components, loading, error } = useComponents()
  const { isAdmin } = useRole()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading components…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive gap-2">
        <AlertCircle className="size-4" />
        <span className="text-sm">Failed to load components.</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1E0A3C] tracking-tight">
              ISQM 1 Components
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              The 8 components of the System of Quality Management as defined by ISQM 1.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-[#EDE9F8] text-[#3B1F6A] px-3 py-1.5 rounded-full">
              {components.length} Components
            </span>
            {isAdmin && (
              <button
                onClick={()=>navigate("/components/create")}
                className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
              >
                <Plus className="size-3.5" />
                Add Component
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {components.map((component, index) => {
            const color = COMPONENT_COLORS[index % COMPONENT_COLORS.length]
            return (
              <div
                onClick={()=>navigate(`/components/${component.id}`)}
                key={component.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md hover:border-[#C4B0E8] transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${color.bg}`}>
                    <ShieldCheck className={`size-4 ${color.text}`} />
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${color.bg} ${color.text}`}>
                    {component.isqm_reference}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full shrink-0 ${color.dot}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Component {component.display_order}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[#1E0A3C] leading-snug pr-2">
                    {component.name}
                  </h3>
                </div>
              </div>
            )
          })}
        </div>
      </div>


      
    </>
  )
}