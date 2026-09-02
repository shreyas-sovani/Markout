"use client";

import { tickToPrice } from "@/lib/contracts";

/**
 * The 24-second memory tape on cream paper.
 *
 * Geometry — one time axis, one tick axis, everything clamped:
 *  · x-domain: [now − SPAN, now]; now falls back to the newest trace point
 *    until a chain timestamp arrives.
 *  · y-domain: union of every drawn series (trace, pre, post, frontier,
 *    window average) padded 15%, so no line can leave the frame.
 *  · fixed window: drawn while a trade is selected (open OR settled), with
 *    bracket labels at bond and settleAfter; clamped to the frame.
 *  · price axis on the left, time axis on the bottom.
 */
export function MemoryTape({
  trace,
  chainNow,
  pre,
  post,
  windowAvg,
  bondTime,
  settleAfter,
  outcome,
}: {
  trace: { t: number; tick: number }[];
  chainNow: bigint;
  pre: number | null;
  post: number | null;
  windowAvg: number | null;
  bondTime: bigint;
  settleAfter: bigint;
  outcome: number;
}) {
  const W = 720;
  const H = 260;
  const L = 74; // left pad (price axis)
  const R = 16;
  const T = 30; // top pad (window label)
  const B = 26; // bottom pad (time axis)
  const SPAN = 180; // seconds visible

  // ---- time base -----------------------------------------------------
  const newestTrace = trace.length ? trace[trace.length - 1].t : null;
  const now =
    chainNow > 0n ? Number(chainNow) : newestTrace !== null ? newestTrace : null;
  const t0 = now !== null ? now - SPAN : 0;
  const clampX = (x: number) => Math.min(Math.max(x, L), W - R);
  const x = (t: number) => (now === null ? L : clampX(L + ((t - t0) / SPAN) * (W - L - R)));

  // ---- tick scale ----------------------------------------------------
  const series: number[] = trace.map((p) => p.tick);
  if (pre !== null) series.push(pre);
  if (post !== null) series.push(post);
  if (windowAvg !== null) series.push(windowAvg);
  const rawLo = series.length ? Math.min(...series) : -10;
  const rawHi = series.length ? Math.max(...series) : 10;
  const pad = Math.max((rawHi - rawLo) * 0.15, 4); // min pad so flat lines don't hug the edge
  const lo = rawLo - pad;
  const hi = rawHi + pad;
  const y = (tick: number) => T + (1 - (tick - lo) / (hi - lo)) * (H - T - B);

  const frontier = pre !== null && post !== null ? (pre + post) / 2 : null;

  // visible trace (allow 2 s of clock skew into the future)
  const pts = trace.filter((p) => now === null || (p.t >= t0 - 2 && p.t <= now + 2));
  const poly = pts.map((p) => `${x(p.t).toFixed(1)},${y(p.tick).toFixed(1)}`).join(" ");

  // fixed window (drawn while a trade is selected, open or settled)
  const hasTrade = bondTime > 0n && settleAfter > 0n;
  const wx1 = hasTrade ? x(Number(bondTime)) : null;
  const wx2 = hasTrade ? x(Number(settleAfter)) : null;
  const sweepX = hasTrade && outcome === 0 && now !== null ? x(now) : null;

  // price axis ticks (5 rounded values)
  const priceTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

  const INK = "#181817";
  const SOFT = "#45443f";
  const MUT = "#9b9991";
  const LINEC = "#dcdad2";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Price memory tape" fill="none">
      {/* frame */}
      <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="#ffffff" stroke={LINEC} />

      {/* price axis */}
      {priceTicks.map((tk, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} stroke={LINEC} strokeWidth="1" />
          <text x={L - 6} y={y(tk) + 3} textAnchor="end" className="fill-[#9b9991] font-mono text-[9px] tabular-nums">
            {tickToPrice(tk).toFixed(4)}
          </text>
        </g>
      ))}

      {/* time axis: −3m … now */}
      {[
        [t0, "−3m"],
        [t0 + SPAN / 3, "−2m"],
        [t0 + (2 * SPAN) / 3, "−1m"],
        [now ?? t0, "now"],
      ].map(([t, label], i) => (
        <g key={i}>
          <line x1={x(t as number)} x2={x(t as number)} y1={T} y2={H - B} stroke="#efeee8" strokeWidth="1" />
          <text x={x(t as number)} y={H - B + 14} textAnchor="middle" className="fill-[#9b9991] font-mono text-[9px]">
            {label as string}
          </text>
        </g>
      ))}

      {/* fixed window */}
      {hasTrade && wx1 !== null && wx2 !== null && (
        <>
          <rect
            x={wx1}
            y={T}
            width={Math.max(wx2 - wx1, 2)}
            height={H - T - B}
            fill="rgba(217,119,87,0.07)"
            stroke="#d97757"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={wx1 + 5} y={T - 8} className="fill-[#a84f35] font-mono text-[9.5px]">
            bond
          </text>
          <text x={wx2 - 5} y={T - 8} textAnchor="end" className="fill-[#a84f35] font-mono text-[9.5px]">
            settleAfter · 24 s
          </text>
          {sweepX !== null && sweepX >= wx1 && (
            <line x1={sweepX} x2={sweepX} y1={T} y2={H - B} stroke="#d97757" strokeWidth="1.5" opacity="0.8" />
          )}
        </>
      )}

      {/* pre */}
      {pre !== null && (
        <>
          <line x1={L} x2={W - R} y1={y(pre)} y2={y(pre)} stroke={MUT} strokeWidth="1" strokeDasharray="5 4" />
          <text x={W - R - 4} y={y(pre) - 5} textAnchor="end" className="fill-[#6f6e68] font-mono text-[9.5px]">
            pre {tickToPrice(pre).toFixed(5)}
          </text>
        </>
      )}

      {/* post */}
      {post !== null && (
        <>
          <line x1={L} x2={W - R} y1={y(post)} y2={y(post)} stroke={INK} strokeWidth="1.4" strokeDasharray="7 4" />
          <text x={W - R - 4} y={y(post) + 12} textAnchor="end" className="fill-[#45443f] font-mono text-[9.5px]">
            post {tickToPrice(post).toFixed(5)}
          </text>
        </>
      )}

      {/* 50% frontier — arithmetic tick midpoint == half the trade's own impact */}
      {frontier !== null && (
        <>
          <line x1={L} x2={W - R} y1={y(frontier)} y2={y(frontier)} stroke="#b68a3a" strokeWidth="1" strokeDasharray="2 4" />
          <text x={L + 6} y={y(frontier) - 5} className="fill-[#9a742f] font-mono text-[9.5px]">
            50% frontier {tickToPrice(frontier).toFixed(5)}
          </text>
        </>
      )}

      {/* live trace */}
      {poly && (
        <polyline
          points={poly}
          stroke="#d97757"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* window average marker — sits at settleAfter, on the average tick */}
      {windowAvg !== null && wx2 !== null && (
        <g>
          <line
            x1={wx2 - 9}
            x2={wx2 + 9}
            y1={y(windowAvg)}
            y2={y(windowAvg)}
            stroke={outcome === 3 ? "#b68a3a" : SOFT}
            strokeWidth="2.2"
          />
          <circle cx={wx2} cy={y(windowAvg)} r="4" fill={outcome === 3 ? "#b68a3a" : SOFT} />
          <text
            x={wx2 + 13}
            y={y(windowAvg) + 3.5}
            className={outcome === 3 ? "fill-[#9a742f] font-mono text-[9.5px]" : "fill-[#45443f] font-mono text-[9.5px]"}
          >
            avg {tickToPrice(windowAvg).toFixed(5)}
          </text>
        </g>
      )}

      {/* live head dot with halo */}
      {pts.length > 0 && (
        <>
          <circle cx={x(pts[pts.length - 1].t)} cy={y(pts[pts.length - 1].tick)} r="7" fill="rgba(217,119,87,0.2)" />
          <circle cx={x(pts[pts.length - 1].t)} cy={y(pts[pts.length - 1].tick)} r="3" fill="#d97757" />
        </>
      )}

      {/* verdict */}
      {outcome === 1 && (
        <text x={(L + W - R) / 2} y={H - B - 6} textAnchor="middle" className="fill-[#657464] font-mono text-[11px] font-semibold">
          bond → trader, paid at settle
        </text>
      )}
      {outcome === 3 && (
        <text x={(L + W - R) / 2} y={H - B - 6} textAnchor="middle" className="fill-[#9a742f] font-mono text-[11px] font-semibold">
          bond → in-range LPs
        </text>
      )}
      {outcome === 2 && (
        <text x={(L + W - R) / 2} y={H - B - 6} textAnchor="middle" className="fill-[#d97757] font-mono text-[11px] font-semibold">
          refund pending — retry claim
        </text>
      )}
    </svg>
  );
}
