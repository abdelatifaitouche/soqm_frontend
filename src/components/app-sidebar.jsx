import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
} from "lucide-react"

const navigation = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Departments", href: "/departments", icon: Building2 },
      { title: "Employees & Roles", href: "/users", icon: Users },
    ],
  },
  {
    label: "ISQM 1 Compliance",
    items: [
      { title: "SOQM Components", href: "/components", icon: ShieldCheck },
      { title: "Quality Objectives", href: "/objectives", icon: Target },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Processes", href: "/processes", icon: Workflow },
      { title: "Procedures", href: "/procedures", icon: ClipboardList },
    ],
  },
  {
    label: "Risk Management",
    items: [
      { title: "Risks & Responses", href: "/risks", icon: AlertTriangle },
      { title: "Evidence & Monitoring", href: "/monitoring", icon: SearchCheck },
    ],
  },
  {
    label: "Monitoring & Findings",
    items: [
      { title: "EQR Reviews", href: "/eqr", icon: FileStack },
      { title: "Findings & Remediations", href: "/findings", icon: CheckSquare },
    ],
  },
  {
    label: "Supporting Systems",
    items: [
      { title: "Tasks", href: "/tasks", icon: CheckSquare },
      { title: "Quality Alerts", href: "/alerts", icon: Bell },
      { title: "Weekly Reports", href: "/reports", icon: FileBarChart2 },
      { title: "Document Library", href: "/documents", icon: Library },
    ],
  },
  {
    label: "AI Assistant",
    items: [
      { title: "SOQM Chatbot", href: "/chatbot", icon: Bot },
    ],
  },
]

export function AppSidebar({ ...props }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <Sidebar variant="floating" {...props}>

      {/* Header — GT branding */}
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2.5 cursor-default select-none">
                <div className="flex size-8 items-center justify-center rounded-md bg-[#3B1F6A]">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.9" />
                    <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.6" />
                    <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.6" />
                    <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.35" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm tracking-tight">SOQM</span>
                  <span className="text-xs text-muted-foreground">Grant Thornton</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-2">
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.href} className="flex items-center gap-2.5">
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer — user info + logout */}
      <SidebarFooter className="border-t border-sidebar-border pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#3B1F6A] text-white text-[11px] font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0 leading-none min-w-0">
                <span className="text-xs font-medium truncate">{user?.email}</span>
                <span className="text-[10px] text-muted-foreground truncate">{user?.role?.replace("_", " ")}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  )
}