import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-5xl font-semibold text-[#3B1F6A]">404</p>
      <p className="text-muted-foreground">Page not found.</p>
      <Link to="/" className="text-sm text-[#7B3FBE] underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}