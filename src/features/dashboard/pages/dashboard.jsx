import { useAuth } from "@/features/auth/hooks/useAuth"
import { useEffect, useRef } from "react"

const METRICS = [
  { label: "Compliance",    value: "94.2%", delta: "↑ +1.8% this month", up: true },
  { label: "Open risks",    value: "23",    delta: "↑ +3 this week",      up: false },
  { label: "Engagements",   value: "148",   delta: "— No change",         up: null },
  { label: "Findings",      value: "11",    delta: "↑ +2 this week",      up: false },
  { label: "Pending tasks", value: "37",    delta: "↓ −5 today",          up: true },
]

const ACTIVITY = [
  { color: "#E24B4A", text: "High-risk finding — Audit dept.",       time: "10 min ago" },
  { color: "#1D9E75", text: "Evidence uploaded for risk response",   time: "43 min ago" },
  { color: "#7B3FBE", text: "EQR review completed — Advisory",       time: "2 hr ago" },
  { color: "#BA7517", text: "Quality alert issued to HR dept.",      time: "Yesterday" },
  { color: "#3B6FBE", text: "New user Tarek Ouaaz added",            time: "Yesterday" },
]

const RISKS = [
  { name: "Client acceptance independence failure", pct: 85, level: "High",   color: "#E24B4A" },
  { name: "Insufficient EQR documentation",         pct: 62, level: "Medium", color: "#BA7517" },
  { name: "Training compliance gap — IT dept.",     pct: 55, level: "Medium", color: "#BA7517" },
  { name: "Monitoring cadence delay — Q2",          pct: 30, level: "Low",    color: "#1D9E75" },
  { name: "Outdated procedure — Client exit",       pct: 22, level: "Low",    color: "#1D9E75" },
]

const OBJECTIVES = [
  { name: "Governance & Leadership",   pct: 88, color: "#7B3FBE" },
  { name: "Ethical Requirements",      pct: 95, color: "#1D9E75" },
  { name: "Engagement Performance",    pct: 74, color: "#BA7517" },
  { name: "Resources",                 pct: 81, color: "#7B3FBE" },
  { name: "Monitoring & Remediation",  pct: 61, color: "#E24B4A" },
  { name: "Info & Communication",      pct: 90, color: "#1D9E75" },
]

const LEVEL_STYLE = {
  High:   "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low:    "bg-emerald-50 text-emerald-700",
}

function useChart(id, config) {
  const ref = useRef(null)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!ref.current || !window.Chart) return
      clearInterval(interval)
      const chart = new window.Chart(ref.current, config())
      return () => chart.destroy()
    }, 100)
    return () => clearInterval(interval)
  }, [])
  return ref
}

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.first_name ?? user?.email?.split("@")[0] ?? "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const tc = dark ? "rgba(255,255,255,0.35)" : "rgba(30,10,60,0.35)"
  const gc = dark ? "rgba(255,255,255,0.05)" : "rgba(59,31,106,0.06)"

  const c1 = useRef(null)
  const c2 = useRef(null)
  const c3 = useRef(null)

  useEffect(() => {
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"
    s.onload = () => {
      if (c1.current) new window.Chart(c1.current, {
        type: "line",
        data: { labels: ["Jan","Feb","Mar","Apr","May","Jun"], datasets: [{ data: [89,91,90,93,92,94], borderColor: "#7B3FBE", backgroundColor: "rgba(123,63,190,0.07)", borderWidth: 2, pointRadius: 3, pointBackgroundColor: "#7B3FBE", pointBorderColor: "#fff", pointBorderWidth: 1.5, fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 85, max: 100, ticks: { color: tc, font: { size: 10 }, callback: v => v + "%" }, grid: { color: gc }, border: { display: false } }, x: { ticks: { color: tc, font: { size: 10 } }, grid: { display: false }, border: { display: false } } } },
      })
      if (c2.current) new window.Chart(c2.current, {
        type: "doughnut",
        data: { labels: ["High","Medium","Low"], datasets: [{ data: [6,9,8], backgroundColor: ["#E24B4A","#BA7517","#1D9E75"], borderWidth: 0, hoverOffset: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "74%", plugins: { legend: { display: false } } },
      })
      if (c3.current) new window.Chart(c3.current, {
        type: "bar",
        data: { labels: ["Audit","Advisory","HR","IT","Quality"], datasets: [{ data: [4,3,2,1,1], backgroundColor: ["#3B1F6A","#52298F","#7B3FBE","#9B5FDE","#C4B0E8"], borderRadius: 4, borderSkipped: false }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tc, font: { size: 10 }, stepSize: 1 }, grid: { color: gc }, border: { display: false } }, y: { ticks: { color: tc, font: { size: 10 } }, grid: { display: false }, border: { display: false } } } },
      })
    }
    document.head.appendChild(s)
  }, [])

  return (
    <div className="space-y-3 pb-8">

      {/* Greeting */}
      <div>
        <h1 className="text-[19px] font-medium text-[#1E0A3C] tracking-tight">{greeting}, {firstName}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{dateStr} · Grant Thornton SOQM</p>
      </div>

      {/* KPI strip — GT purple cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-[#3B1F6A] rounded-xl px-4 py-3.5 relative overflow-hidden">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#A888D8] mb-2">{m.label}</p>
            <p className="text-2xl font-medium text-white leading-none mb-1.5">{m.value}</p>
            <p className={`text-[11px] ${m.up === true ? "text-emerald-300" : m.up === false ? "text-red-300" : "text-[#7A8FAD]"}`}>
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-3">
        <div className="rounded-xl border border-[#E0D8F0] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7B3FBE] mb-3">Compliance trend — 2026</p>
          <div className="h-44"><canvas ref={c1} aria-label="Compliance rate trend 2026" /></div>
        </div>
        <div className="rounded-xl border border-[#E0D8F0] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7B3FBE] mb-2">Recent activity</p>
          <div className="divide-y divide-[#F0EAF8]">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
                <div>
                  <p className="text-xs text-[#1E0A3C] leading-snug">{a.text}</p>
                  <p className="text-[10px] text-[#B8B0CC] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-3">
        <div className="rounded-xl border border-[#E0D8F0] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7B3FBE] mb-2">Top open risks</p>
          <div className="divide-y divide-[#F0EAF8]">
            {RISKS.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                <div className="size-1.5 rounded-full shrink-0" style={{ background: r.color }} />
                <span className="text-xs text-[#1E0A3C] flex-1 min-w-0 truncate">{r.name}</span>
                <div className="w-16 h-1 bg-[#EDE9F8] rounded-full overflow-hidden shrink-0">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${LEVEL_STYLE[r.level]}`}>
                  {r.level}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#E0D8F0] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7B3FBE] mb-2">Objective completion</p>
          <div className="space-y-2.5">
            {OBJECTIVES.map((o) => (
              <div key={o.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-[#1E0A3C]">{o.name}</span>
                  <span className="text-xs font-medium text-[#3B1F6A]">{o.pct}%</span>
                </div>
                <div className="h-1 bg-[#EDE9F8] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${o.pct}%`, background: o.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#E0D8F0] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7B3FBE] mb-4">Risk distribution by severity</p>
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 shrink-0"><canvas ref={c2} aria-label="Risk severity donut chart" /></div>
            <div className="flex flex-col gap-2.5 flex-1">
              {[
                { label: "High severity",   val: 6, pct: "26%", color: "#E24B4A" },
                { label: "Medium severity", val: 9, pct: "39%", color: "#BA7517" },
                { label: "Low severity",    val: 8, pct: "35%", color: "#1D9E75" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-xs font-medium text-[#1E0A3C]">
                    {s.val} <span className="font-normal text-[#B8B0CC] text-[10px]">{s.pct}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#E0D8F0] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7B3FBE] mb-4">Findings by department</p>
          <div className="h-32"><canvas ref={c3} aria-label="Findings by department bar chart" /></div>
        </div>
      </div>

    </div>
  )
}