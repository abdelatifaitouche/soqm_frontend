import { LoginForm } from "@/components/login-form"
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3F7] p-6 font-sans">
      <div className="w-full max-w-[820px]">
        <LoginForm />
      </div>
    </div>
  )
}