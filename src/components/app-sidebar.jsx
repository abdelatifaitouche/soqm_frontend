import { NavLink, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Target,
  Workflow,
  ClipboardList,
  AlertTriangle,
  SearchCheck,
  FileStack,
  CheckSquare,
  Bell,
  FileBarChart2,
  Library,
  LogOut,
  Bot,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

const navigation = [
  {
    label: "AI Assistant",
    icon: Bot,
    defaultOpen: true,
    items: [
      { title: "SOQM Chatbot", href: "/chatbot", icon: Bot },
    ],
  },
  {
    label: "Overview",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "ISQM 1 Compliance",
    icon: ShieldCheck,
    defaultOpen: true,
    items: [
      { title: "SOQM Components", href: "/components", icon: ShieldCheck },
      { title: "Quality Objectives", href: "/objectives", icon: Target },
    ],
  },
  {
    label: "Risk Management",
    icon: AlertTriangle,
    defaultOpen: true,
    items: [
      { title: "Risks", href: "/risks", icon: AlertTriangle },
       { title: "Responses", href: "/responses", icon: AlertTriangle },
      { title: "Evidence & Monitoring", href: "/monitoring", icon: SearchCheck },
    ],
  },
  {
    label: "Operations",
    icon: Workflow,
    defaultOpen: false,
    items: [
      { title: "Processes", href: "/processes", icon: Workflow },
      { title: "Procedures", href: "/procedures", icon: ClipboardList },
    ],
  },
  {
    label: "Monitoring & Findings",
    icon: FileStack,
    defaultOpen: false,
    items: [
      { title: "EQR Reviews", href: "/eqr", icon: FileStack },
      { title: "Findings & Remediations", href: "/findings", icon: CheckSquare },
    ],
  },
  {
    label: "Organization",
    icon: Building2,
    defaultOpen: false,
    items: [
      { title: "Departments", href: "/departments", icon: Building2 },
      { title: "Users", href: "/users", icon: Users },
      { title: "Employees", href: "/employees", icon: Users },
    ],
  },
  {
    label: "Supporting Systems",
    icon: Library,
    defaultOpen: false,
    items: [
      { title: "Tasks", href: "/tasks", icon: CheckSquare },
      { title: "Quality Alerts", href: "/alerts", icon: Bell },
      { title: "Weekly Reports", href: "/reports", icon: FileBarChart2 },
      { title: "Document Library", href: "/documents", icon: Library },
    ],
  },
]

function NavGroup({ group, location }) {
  const hasActive = group.items.some((item) =>
    item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)
  )
  const [open, setOpen] = useState(group.defaultOpen || hasActive)
  const GroupIcon = group.icon

  return (
    <div className="mb-1">
      {/* Group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/40 transition-all duration-150 select-none"
      >
        <GroupIcon className="size-3 shrink-0 opacity-60" />
        <span className="flex-1 text-left">{group.label}</span>
        {open
          ? <ChevronDown className="size-3 opacity-50" />
          : <ChevronRight className="size-3 opacity-50" />
        }
      </button>

      {/* Items */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: open ? `${group.items.length * 44}px` : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="ml-2 mt-0.5 border-l border-sidebar-border pl-2 space-y-0.5">
          {group.items.map((item) => {
            const isActive = item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href)

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-[#3B1F6A] text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  }
                `}
              >
                <item.icon className={`size-3.5 shrink-0 ${isActive ? "opacity-90" : "opacity-60"}`} />
                <span>{item.title}</span>
                {isActive && (
                  <span className="ml-auto size-1.5 rounded-full bg-[#D4B8F0]" />
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({ ...props }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "?"

  return (
    <Sidebar variant="floating" {...props}>

      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#3B1F6A] shadow-md">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.9" />
              <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.6" />
              <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.6" />
              <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.35" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">SOQM</span>
            <span className="text-[11px] text-sidebar-foreground/50 font-medium">Grant Thornton</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-3 px-2 space-y-0.5 overflow-y-auto">
        {navigation.map((group) => (
          <NavGroup key={group.label} group={group} location={location} />
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border pt-3 px-2 pb-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/40 mb-1">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#3B1F6A] text-white text-[11px] font-bold shadow-sm">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium truncate text-sidebar-foreground">{user?.email}</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate capitalize">
              {user?.role?.replace("_", " ")}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-sidebar-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="size-3.5 shrink-0" />
          <span>Sign out</span>
        </button>
      </SidebarFooter>

    </Sidebar>
  )
}