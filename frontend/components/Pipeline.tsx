const STAGES = [
  { label: "Connect", sub: "wallet" },
  { label: "Mint", sub: "demo tokens" },
  { label: "LP", sub: "or skip" },
  { label: "Swap", sub: "spot or batch" },
  { label: "Settle", sub: "verdict paid" },
];

/** The five-stage app flow. `step` is the current active index (0-4). */
export function Pipeline({ step }: { step: number }) {
  return (
    <div className="overflow-x-auto rounded-xl2 border border-line bg-card px-4 py-4 shadow-card md:px-6">
      <div className="flex min-w-[620px] items-stretch">
        {STAGES.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex min-w-20 flex-col items-center gap-2 text-center">
                <span
                  className={[
                    "grid size-8 place-items-center rounded-lg font-mono text-[11px] font-medium transition-colors",
                    done
                      ? "bg-sage text-canvas"
                      : active
                        ? "bg-brand text-canvas shadow-[0_0_0_4px_rgba(217,119,87,0.14)]"
                        : "border border-line bg-secondary text-faint",
                  ].join(" ")}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="leading-tight">
                  <div
                    className={`font-sans text-[11.5px] font-semibold ${active || done ? "text-ink" : "text-muted"}`}
                  >
                    {s.label}
                  </div>
                  <div className="font-sans text-[10.5px] text-faint">{s.sub}</div>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div className="relative mx-2 mb-6 h-px flex-1 overflow-hidden bg-line">
                  {done && <div className="absolute inset-0 bg-sage/60" />}
                  {active && (
                    <div className="absolute inset-y-0 left-0 w-1/3 animate-sheen bg-brand" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
