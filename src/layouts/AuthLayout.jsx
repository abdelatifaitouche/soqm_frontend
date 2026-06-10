import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3F7] p-6">
      <div className="w-full max-w-[820px]">
        <Outlet />
      </div>
    </div>
  )
}