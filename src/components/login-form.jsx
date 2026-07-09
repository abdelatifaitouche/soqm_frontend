import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

 const handleSubmit = async (e) => {
  e.preventDefault()
  setError("")
  setLoading(true)
  try {
    await login(email, password)
    navigate("/dashboard")
  } catch (err) {
    const msg = err?.response?.data?.detail || "Invalid credentials. Please try again."
    setError(msg)
  } finally {
    setLoading(false)
  }
}

  return (
    <div
      className="grid md:grid-cols-2 overflow-hidden rounded-2xl"
      style={{ minHeight: "480px", boxShadow: "0 1px 3px rgba(60,30,90,0.08)" }}
    >
      {/* ── Left panel ── */}
      <div className="flex flex-col justify-between bg-[#3B1F6A] p-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-[30px] h-[30px] bg-[#6B3FA0] rounded-md flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.9" />
                <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.6" />
                <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.6" />
                <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#D4B8F0" opacity="0.35" />
              </svg>
            </div>
            <span className="text-[#D4B8F0] text-[11px] font-semibold tracking-[0.12em] uppercase">
              SOQM · Grant Thornton Algeria
            </span>
          </div>

          {/* Rule + Headline */}
          <div className="w-7 h-0.5 bg-[#8B5CC8] mb-5" />
          <h1 className="text-[#F0E8FF] text-xl font-light leading-relaxed tracking-tight">
            <strong className="font-semibold text-white block">Precision at every level.</strong>
            Quality management built for audit.
          </h1>
          <p className="text-[#A888D8] text-xs leading-[1.75] mt-3.5">
            A single platform for engagement quality, compliance tracking, and
            audit excellence — designed for Grant Thornton teams.
          </p>
        </div>

        
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col justify-center bg-white px-10 py-12">
        <p className="text-[#7B3FBE] text-[10px] font-semibold tracking-[0.12em] uppercase mb-2.5">
          Secure portal
        </p>
        <h2 className="text-[#1E0A3C] text-xl font-medium tracking-tight mb-1.5">
          Sign in to your workspace
        </h2>
        <p className="text-[#8A859A] text-sm mb-7">
          Use your Grant Thornton credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[#4A3D6A] tracking-[0.03em] uppercase mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@grantthornton.com"
              required
              className="w-full h-10 border border-[#D8D2E8] rounded-lg px-3.5 text-sm text-[#1E0A3C] bg-[#FAFAF9] outline-none placeholder:text-[#C0BAD0] focus:border-[#7B3FBE] focus:bg-white transition-colors"
              style={{ boxShadow: "none" }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(123,63,190,0.08)"}
              onBlur={e => e.target.style.boxShadow = "none"}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-medium text-[#4A3D6A] tracking-[0.03em] uppercase">
                Password
              </label>
              <a href="#" className="text-[12px] text-[#9B7FC8] hover:text-[#3B1F6A] transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-10 border border-[#D8D2E8] rounded-lg px-3.5 text-sm text-[#1E0A3C] bg-[#FAFAF9] outline-none focus:border-[#7B3FBE] focus:bg-white transition-colors"
              onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(123,63,190,0.08)"}
              onBlur={e => e.target.style.boxShadow = "none"}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 -mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[41px] bg-[#3B1F6A] hover:bg-[#52298F] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#EAE6F0]" />
          <span className="text-[11px] text-[#C0BAD0] tracking-wide">or</span>
          <div className="flex-1 h-px bg-[#EAE6F0]" />
        </div>

        
        <p className="text-[11px] text-[#B8B0CC] text-center mt-5 leading-relaxed">
          By signing in you agree to Grant Thornton's<br />
          acceptable use and data privacy policies.
        </p>
      </div>
    </div>
  )
}

