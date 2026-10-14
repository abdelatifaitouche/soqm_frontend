import React from 'react'

function RiskMatrix() {
  return (
    <div>
        
          {matrixLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading risk matrix…</span>
            </div>
          )}

          {!matrixLoading && matrixError && (
            <div className="flex items-center justify-center gap-2 py-16 text-destructive">
              <AlertCircle className="size-4" />
              <span className="text-sm">Failed to load risk matrix.</span>
            </div>
          )}

          {!matrixLoading && !matrixError && (
            <div className="max-w space-y-4">
              {/* Stats */}
              {matrixStats && (
                <div className="grid grid-cols-3 gap-3">
                  <MatrixStatCard label="Critical" value={`${matrixStats.critical.toFixed(1)}%`} sublabel="Score 6–9" icon={Activity} tone="critical" />
                  <MatrixStatCard label="High" value={`${matrixStats.high.toFixed(1)}%`} sublabel="Score 3–5" icon={TrendingUp} tone="high" />
                  <MatrixStatCard label="Low" value={`${matrixStats.low.toFixed(1)}%`} sublabel="Score 1–2" icon={Target} tone="low" />
                </div>
              )}

              {/* Heat map */}
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-xs font-semibold text-foreground">Risk assessment matrix</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Distribution of risks across occurrence and significance</p>
                </div>

                <div className="p-4">
                  {/* Legend */}
                  <div className="flex gap-3 mb-3">
                    {["critical", "high", "low"].map((z) => (
                      <div key={z} className="flex items-center gap-1.5">
                        <div className={`size-2 rounded-sm ${MATRIX_ZONE[z].dot}`} />
                        <span className="text-[10px] text-muted-foreground">{MATRIX_ZONE[z].label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-center">
                    {/* Y-axis */}
                    <div className="flex items-center justify-center w-3 shrink-0">
                      <span
                        className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground"
                        style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                      >
                        Significance
                      </span>
                    </div>

                    <div>
                      {/* Column headers */}
                      <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "32px repeat(3, 48px)" }}>
                        <div />
                        {OCC_COLS.map((o) => (
                          <div key={o} className="text-center">
                            <p className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">{OCC_LABELS[o]}</p>
                          </div>
                        ))}
                      </div>

                      {/* Rows */}
                      <div className="space-y-1.5">
                        {SIG_ROWS.map((s) => (
                          <div key={s} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: "32px repeat(3, 48px)" }}>
                            <div className="flex items-center justify-end pr-1.5">
                              <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">{SIG_LABELS[s]}</span>
                            </div>
                            {OCC_COLS.map((o) => {
                              const cell = matrixCells?.find((c) => c.occurence === o && c.significance === s)
                              return <MatrixCell key={`${s}-${o}`} cell={cell} maxPercent={maxPercent} />
                            })}
                          </div>
                        ))}
                      </div>

                      <div className="text-center mt-2">
                        <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">← Occurrence →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          
    </div>
           )}
    </div>
  );
} 
export default RiskMatrix
