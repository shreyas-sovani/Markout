import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Hero product-preview collage on cream paper: floating, overlapping
 * cards that show Markout's real loop — the bonded swap, the 24-second memory
 * tape, and the verdict routing. Pure SVG + CSS, no client JS.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[520px]">
      {/* soft brand glow behind the cards */}
      <div
        className="pointer-events-none absolute inset-8 rounded-[44px] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(closest-side, rgba(181,39,111,0.20), transparent)" }}
      />

      {/* Card A: the bonded swap */}
      <Card className="absolute left-0 top-4 z-10 w-[252px] animate-floaty p-4 shadow-lift [animation-duration:7s]">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Swap
          </span>
          <span className="font-mono text-[11px] text-faint">MDA / MDB</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-sans text-[13px] text-muted">Fill</span>
          <span className="font-mono text-[15px] font-semibold tabular-nums text-ink">1.000 MDA</span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="font-sans text-[13px] text-muted">Bond posted</span>
          <span className="font-mono text-[15px] font-semibold tabular-nums text-brand">0.020 MDA</span>
        </div>
        <div className="mt-2 font-sans text-[10.5px] text-faint">
          3 bps · instant fill · charged to the router&apos;s own delta
        </div>
      </Card>

      {/* Card B: the 24-second memory tape */}
      <Card className="absolute right-0 top-[60px] z-20 w-[262px] animate-floaty p-4 shadow-lift [animation-duration:9s] [animation-delay:0.6s]">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Memory · 24 s
          </span>
          <Badge variant="brand" className="gap-1 px-1.5 py-0 text-[9px]">
            <span className="h-1 w-1 rounded-full bg-brand animate-pulseSoft" />
            REC
          </Badge>
        </div>

        <svg viewBox="0 0 230 64" className="mt-3 w-full" fill="none" preserveAspectRatio="none">
          {/* fixed window shade */}
          <rect x="96" y="2" width="118" height="56" fill="rgba(181,39,111,0.06)" stroke="#B5276F" strokeWidth="1" strokeDasharray="3 3" />
          {/* pre line */}
          <line x1="6" y1="30" x2="224" y2="30" stroke="#403d33" strokeWidth="1" strokeDasharray="5 4" />
          {/* post line */}
          <line x1="96" y1="14" x2="224" y2="14" stroke="#211d14" strokeWidth="1.4" strokeDasharray="7 4" />
          {/* 50% frontier */}
          <line x1="6" y1="22" x2="224" y2="22" stroke="#b07f25" strokeWidth="1" strokeDasharray="2 4" />
          {/* price trace: impact then reversion */}
          <path
            d="M6,30 L60,29 L96,30 L112,14 L150,15 L190,29 L224,30"
            stroke="#B5276F"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="animate-draw"
            style={{ strokeDasharray: 320, strokeDashoffset: 320, animationDelay: "0.7s" }}
          />
          {/* window average marker */}
          <circle cx="214" cy="22" r="3" fill="#211d14" />
          {/* sweep */}
          <line x1="170" y1="4" x2="170" y2="56" stroke="#B5276F" strokeWidth="1.5" opacity="0.7" />
        </svg>

        <div className="mt-1 flex items-baseline justify-between">
          <span className="font-sans text-[11px] text-muted">window average</span>
          <span className="font-mono text-[14px] font-semibold tabular-nums text-brand">51% back</span>
        </div>
      </Card>

      {/* Card C: the verdict route */}
      <Card className="absolute bottom-2 left-[46px] z-10 w-[404px] animate-floaty p-4 shadow-lift [animation-duration:8s] [animation-delay:0.3s]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-brand">Settled</span>
          <span className="font-sans text-[11px] text-faint">anyone may call it, any time after the window</span>
        </div>
        <div className="relative mt-3 h-8">
          <div className="absolute left-[12%] right-[12%] top-1/2 h-px -translate-y-1/2 bg-edge/30" />
          <span className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_0_4px_rgba(181,39,111,0.18)] animate-flowX" />
          <div className="relative flex h-full items-center justify-between">
            {["bond", "verdict", "trader / LPs"].map((n) => (
              <span
                key={n}
                className="rounded-full border border-edge bg-card px-2.5 py-1 font-sans text-[11px] font-medium text-ink"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[11px] text-ink-soft">
          reverted ≥ 50% → <span className="text-brand">REFUND, paid at settle</span>
          <span className="text-faint"> · </span>
          sustained → <span className="text-gold">DONATE to LPs</span>
        </div>
      </Card>
    </div>
  );
}
