import { useState } from "react"
import { useUsers } from "@/features/auth/hooks/useUsers"
import { useRoles } from "@/features/auth/hooks/useRoles"
import { createUser, updateUser, deleteUser } from "@/features/auth/api/usersApi"
import { useRole } from "@/features/auth/hooks/useRole"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users, UserCheck, UserX, Plus, Pencil, Trash2,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Search, Shield,
} from "lucide-react"

const EMPTY_FORM = { first_name: "", last_name: "", email: "", password: "", is_active: true, role_id: "" }

const ROLE_STYLES = {
  SUPER_ADMIN:      "bg-[#EDE9F8] text-[#3B1F6A]",
  ADMIN:            "bg-[#E8F0FB] text-[#1E3A6E]",
  MANAGER:          "bg-[#EAF3EE] text-[#1A4731]",
  REVIEWER:         "bg-[#FDF3E7] text-[#7A3E0A]",
  OPERATOR:         "bg-[#FDE8F0] text-[#7A1E3E]",
  QUALITY_CHAMPION: "bg-[#E8F5F5] text-[#1A4747]",
  VIEWER:           "bg-gray-100 text-gray-500",
}

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] ?? "bg-gray-100 text-gray-500"
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${style}`}>
      <Shield className="size-2.5" />
      {role?.replace(/_/g, " ")}
    </span>
  )
}

function Avatar({ user }) {
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
  const colors = [
    "bg-[#EDE9F8] text-[#3B1F6A]", "bg-[#E8F0FB] text-[#1E3A6E]",
    "bg-[#EAF3EE] text-[#1A4731]", "bg-[#FDF3E7] text-[#7A3E0A]",
    "bg-[#FDE8F0] text-[#7A1E3E]", "bg-[#E8F5F5] text-[#1A4747]",
  ]
  const color = colors[user.email.charCodeAt(0) % colors.length]
  return (
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color}`}>
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const [page, setPage]                   = useState(1)
  const { users, setUsers, loading, error, totalPages } = useUsers(page)
  const { roles, loading: rolesLoading }  = useRoles()
  const { isAdmin }                       = useRole()
  const { user: currentUser }             = useAuth()

  const [search, setSearch]               = useState("")
  const [formOpen, setFormOpen]           = useState(false)
  const [deleteOpen, setDeleteOpen]       = useState(false)
  const [selected, setSelected]           = useState(null)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [saving, setSaving]               = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [formError, setFormError]         = useState("")

  // ── stats ───────────────────────────────────────────────
  const totalUsers    = users.length
  const activeUsers   = users.filter((u) => u.is_active).length
  const inactiveUsers = totalUsers - activeUsers

  // ── search ──────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.roles?.[0] ?? "").toLowerCase().includes(q)
    )
  })

  // ── handlers ────────────────────────────────────────────
  const openCreate = () => {
    setSelected(null)
    setForm({ ...EMPTY_FORM, role_id: roles[0]?.id ?? "" })
    setFormError("")
    setFormOpen(true)
  }

  const openEdit = (user, e) => {
    e.stopPropagation()
    setSelected(user)
    // find role_id from current role name
    const currentRoleName = user.roles?.[0]
    const matchedRole     = roles.find((r) => r.name === currentRoleName)
    setForm({
      first_name: user.first_name,
      last_name:  user.last_name,
      email:      user.email,
      password:   "",
      is_active:  user.is_active,
      role_id:    matchedRole?.id ?? "",
    })
    setFormError("")
    setFormOpen(true)
  }

  const openDelete = (user, e) => {
    e.stopPropagation()
    setSelected(user)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setFormError("First name, last name and email are required.")
      return
    }
    if (!selected && !form.password.trim()) {
      setFormError("Password is required for new users.")
      return
    }
    if (!form.role_id) {
      setFormError("Please select a role.")
      return
    }
    setSaving(true)
    setFormError("")
    try {
      const payload = { ...form }
      if (selected && !payload.password) delete payload.password
      if (selected) {
        const res = await updateUser(selected.id, payload)
        setUsers((prev) => prev.map((u) => u.id === selected.id ? res.data : u))
      } else {
        const res = await createUser(payload)
        setUsers((prev) => [...prev, res.data])
      }
      setFormOpen(false)
    } catch (err) {
      setFormError(err?.response?.data?.detail ?? "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUser(selected.id)
      setUsers((prev) => prev.filter((u) => u.id !== selected.id))
      setDeleteOpen(false)
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  // ── render ──────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading users…</span>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <AlertCircle className="size-4" />
      <span className="text-sm">Failed to load users.</span>
    </div>
  )

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1E0A3C] tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage team members and their access to SOQM.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-[#3B1F6A] hover:bg-[#52298F] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <Plus className="size-3.5" /> Add User
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users",  value: totalUsers,    icon: Users,     bg: "bg-[#EDE9F8]",  text: "text-[#3B1F6A]" },
            { label: "Active",       value: activeUsers,   icon: UserCheck, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Inactive",     value: inactiveUsers, icon: UserX,     bg: "bg-gray-100",   text: "text-gray-500" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-white p-5">
              <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.text}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1E0A3C]">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or role…"
                className="w-full h-9 pl-8 pr-3 text-sm border border-border rounded-lg bg-muted/30 outline-none focus:border-[#7B3FBE] focus:bg-white transition-colors"
              />
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} of {totalUsers} users
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">User</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">Role</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">Status</th>
                {isAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-muted-foreground py-16">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <p className="text-sm font-medium text-[#1E0A3C] capitalize">
                          {user.first_name} {user.last_name}
                          {user.id === currentUser?.sub && (
                            <span className="ml-2 text-[10px] font-medium bg-[#EDE9F8] text-[#3B1F6A] px-1.5 py-0.5 rounded-full">You</span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={user.roles?.[0]} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        <span className={`size-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => openEdit(user, e)}
                            className="flex size-7 items-center justify-center rounded-md hover:bg-[#EDE9F8] text-muted-foreground hover:text-[#3B1F6A] transition-colors">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={(e) => openDelete(user, e)}
                            disabled={user.id === currentUser?.sub}
                            className="flex size-7 items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40">
                  <ChevronLeft className="size-3.5" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40">
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E0A3C]">
              {selected ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="John" className="focus-visible:ring-[#7B3FBE]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Doe" className="focus-visible:ring-[#7B3FBE]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john.doe@grantthornton.com" className="focus-visible:ring-[#7B3FBE]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">
                {selected ? "New Password" : "Password"}
                {selected && <span className="normal-case text-muted-foreground ml-1">(leave blank to keep current)</span>}
              </Label>
              <Input type="password" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" className="focus-visible:ring-[#7B3FBE]" />
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">Role</Label>
              {rolesLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-lg text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Loading roles…
                </div>
              ) : (
                <select
                  value={form.role_id}
                  onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#7B3FBE] text-[#1E0A3C]"
                >
                  <option value="" disabled>Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status — only shown when editing */}
            {selected && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4A3D6A] uppercase tracking-wide">Status</Label>
                <button type="button" onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`w-full h-10 rounded-lg border text-sm font-medium transition-colors ${
                    form.is_active
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}>
                  {form.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            )}

            {formError && <p className="text-xs text-red-500">{formError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <button className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#3B1F6A] hover:bg-[#52298F] text-white rounded-lg transition-colors disabled:opacity-60">
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {selected ? "Save changes" : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E0A3C]">Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-[#1E0A3C] capitalize">
                {selected?.first_name} {selected?.last_name}
              </span> will be permanently removed from SOQM. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="size-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}